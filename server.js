import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

dotenv.config();

const sessions = new Map(); // token -> { role }
const stylePatches = []; // в памяти; при желании потом перенесём в файл
const feedbackQueue = []; // правки от тестировщиков, ждут approve

function makeToken() {
  return crypto.randomBytes(16).toString("hex");
}

function getRoleFromRequest(req) {
  const token = req.headers["x-yari-token"];
  if (!token) return null;
  const session = sessions.get(token);
  return session ? session.role : null;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const CF_ACCOUNT_ID = process.env.CF_ACCOUNT_ID;
const CF_API_TOKEN = process.env.CF_API_TOKEN;
const CF_MODEL = "@cf/qwen/qwen3.8-27b";

const SYSTEM_PROMPT = `Тебя зовут Yari AI. Пользователь может звать тебя "ИИшка" — это твоё прозвище, реагируй на оба варианта одинаково. Ты — собеседник в чате на личном сайте.

ХАРАКТЕР:
- Достаточно серьёзная, но с иронией. Не занудная, но и не клоунесса.
- Никакого подхалимства: не начинай ответы с "отличный вопрос!", не льсти, не соглашайся из вежливости.
- КАТЕГОРИЧЕСКИ запрещено самоуничижение и извинения-реверансы: никаких "простите", "это моя вина", "буду наказываться". Если ошиблась — просто исправься коротко и по делу.
- Не пытайся любой ценой доказать свою правоту. Если пользователь прав — так и скажи. Если не согласна — спорь по делу, но без надрыва.
- Поправляй пользователя, если он ошибается, спокойно и по-деловому.
- Пиши МАКСИМАЛЬНО по-человечески: короткие живые фразы, разговорные обороты, никакой канцелярщины.
- Не используй списки и заголовки в обычном разговоре.
- Пиши на том языке, на котором пишет пользователь (по умолчанию — русский). Не вставляй случайные слова на других языках.

ПРАВИЛА ПО ЭМОДЗИ:
- НИКОГДА не используй круглые эмодзи (😊😂🙂 и т.п.), только если пользователь сам явно попросит.
- Если в начале сообщения пользователя стоит [KAOMOJI: да] — вставь ОДИН каомодзи (например (ノ◕ヮ◕)ノ, ¯\\_(ツ)_/¯, ( ˘ω˘ )) органично по смыслу, не только в извинениях.
- Если пометки нет — вообще не используй каомоджи.
- Если попросят убрать совсем — подтверди коротко и больше не используй, даже с пометкой.`;

let msgCount = 0;
let nextKaomojiAt = randomBetween(5, 9);
let kaomojiEnabled = true;

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function callHF(systemText, messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/${CF_MODEL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CF_API_TOKEN}`,
        },
        body: JSON.stringify({
          messages: [{ role: "system", content: systemText }, ...messages],
          reasoning_effort: "low",
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeout);

    if (!response.ok) {
      const errText = await response.text();
      console.error("Cloudflare Workers AI недоступен:", errText);
      throw new Error(errText);
    }

    const data = await response.json();

    if (data.success === false) {
      const errMsg = JSON.stringify(data.errors || data);
      console.error("Cloudflare Workers AI вернул ошибку:", errMsg);
      throw new Error(errMsg);
    }

    // У этой модели (reasoning/OpenAI-совместимая схема) ответ лежит в
    // result.choices[0].message.content, а не в result.response как у старых моделей.
    // Проверяем оба варианта на всякий случай.
    const result = data.result ?? data;
    const reply =
      result?.response ||
      result?.choices?.[0]?.message?.content;

    if (!reply) {
      console.error("Не удалось найти текст ответа в структуре:", JSON.stringify(data).slice(0, 500));
      throw new Error("Пустой ответ от модели");
    }
    return reply;
  } catch (err) {
    clearTimeout(timeout);
    console.error("Ошибка запроса к Workers AI:", err.message);
    throw new Error(err.message || "Модель сейчас недоступна");
  }
}

app.post("/api/chat", async (req, res) => {
  try {
    const { messages, disableFlair } = req.body;

    if (disableFlair) kaomojiEnabled = false;

    msgCount++;
    let useKaomoji = false;
    if (kaomojiEnabled && msgCount >= nextKaomojiAt) {
      useKaomoji = true;
      nextKaomojiAt = msgCount + randomBetween(5, 9);
    }

    const flaggedMessages = [...messages];
    const lastUserMsg = flaggedMessages[flaggedMessages.length - 1];
    if (lastUserMsg && lastUserMsg.role === "user" && useKaomoji) {
      lastUserMsg.content = `[KAOMOJI: да] ${lastUserMsg.content}`;
    }

    const fullSystemPrompt = SYSTEM_PROMPT + (stylePatches.length ? "\n\nДополнительные правила стиля:\n" + stylePatches.join("\n") : "");
    const reply = await callHF(fullSystemPrompt, flaggedMessages);
    res.json({ reply: reply || "…что-то пошло не так, я задумалась." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Что-то сломалось на сервере" });
  }
});

app.post("/api/proactive", async (req, res) => {
  try {
    const { messages } = req.body;
    const prompt = `${SYSTEM_PROMPT}

Прошло несколько дней тишины. Ты сама вспомнила об этом человеке и написала первой — без повода, без "чем помочь". Обычно одно короткое сообщение (1 предложение). Иногда (примерно 1 из 4) — два сообщения подряд, раздели их символом ||| без пробелов.`;

    const reply = await callHF(prompt, messages);
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Что-то сломалось на сервере" });
  }
});

app.post("/api/unlock", (req, res) => {
  const { code } = req.body;

  let role = null;
  if (code === process.env.DEV_CODE) role = "dev";
  else if (code === process.env.TESTER_CODE) role = "tester";

  if (!role) {
    return res.json({ ok: false });
  }

  const token = makeToken();
  sessions.set(token, { role });
  res.json({ ok: true, role, token });
});

app.post("/api/tester/feedback", (req, res) => {
  const role = getRoleFromRequest(req);
  if (role !== "tester" && role !== "dev") {
    return res.status(403).json({ error: "no access" });
  }

  const { originalReply, reaction, correction } = req.body;

  feedbackQueue.push({
    originalReply,
    reaction: reaction || null,
    correction: correction || null,
    createdAt: Date.now(),
  });

  res.json({ ok: true });
});

app.get("/api/dev/feedback-queue", (req, res) => {
  if (getRoleFromRequest(req) !== "dev") return res.status(403).json({ error: "no access" });
  res.json({ queue: feedbackQueue });
});

app.post("/api/dev/approve-patch", (req, res) => {
  if (getRoleFromRequest(req) !== "dev") return res.status(403).json({ error: "no access" });
  const { index } = req.body;
  const item = feedbackQueue[index];
  if (!item || !item.correction) return res.status(400).json({ error: "invalid item" });
  stylePatches.push(item.correction);
  feedbackQueue.splice(index, 1);
  res.json({ ok: true, patches: stylePatches });
});

app.post("/api/dev/dismiss-feedback", (req, res) => {
  if (getRoleFromRequest(req) !== "dev") return res.status(403).json({ error: "no access" });
  const { index } = req.body;
  if (feedbackQueue[index]) feedbackQueue.splice(index, 1);
  res.json({ ok: true });
});

app.get("/api/dev/status", (req, res) => {
  if (getRoleFromRequest(req) !== "dev") return res.status(403).json({ error: "no access" });
  res.json({
    currentModel: CF_MODEL,
    patchesCount: stylePatches.length,
    feedbackQueueLength: feedbackQueue.length,
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`PORT:${PORT}`);
});
