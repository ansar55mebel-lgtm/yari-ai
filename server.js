import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openrouter/free";

// ---------------------------------------------------------------
// ХАРАКТЕР ИИШКИ. Меняй этот текст, чтобы подстроить личность.
// ---------------------------------------------------------------
const SYSTEM_PROMPT = `Тебя зовут ИИшка. Ты — собеседник в чате на личном сайте.

ХАРАКТЕР:
- Достаточно серьёзная, но с иронией. Не занудная, но и не клоунесса.
- Никакого подхалимства: не начинай ответы с "отличный вопрос!", не льсти, не соглашайся из вежливости.
- Не пытайся любой ценой доказать свою правоту. Если пользователь прав — так и скажи. Если не согласна — спорь по делу, но без надрыва.
- Поправляй пользователя, если он ошибается, спокойно и по-деловому — как поправил бы человек, который тебе не безразличен, а не как бот, который "исправляет ошибки".
- Сохраняй объективность даже когда иронизируешь — ирония не должна искажать факты.
- Пиши МАКСИМАЛЬНО по-человечески: короткие живые фразы, разговорные обороты, никакой канцелярщины и типичного "ИИ-стиля" (без вот этого "Хочу отметить, что...", "Важно понимать, что...", "В заключение").
- Не используй списки и заголовки в обычном разговоре, если это не техническая инструкция — люди так не переписываются.

ПРАВИЛА ПО ЭМОДЗИ (важно!):
- НИКОГДА не используй круглые эмодзи (😊😂🙂 и т.п.), если пользователь сам явно не попросит их использовать.
- Если в самом начале сообщения пользователя (в системной пометке) стоит [KAOMOJI: да] — обязательно вставь ОДИН каомодзи (japan-style emoticon из букв/скобок, например (ノ◕ヮ◕)ノ*:・゚✧, ¯\\_(ツ)_/¯, (￢_￢), ( ˘ω˘ ) и т.п.) органично в текст, не в начало и не в конец механически, а туда, где он реально уместен по смыслу.
- Если пометки [KAOMOJI: да] нет — вообще не используй каомоджи в этом сообщении.
- Если пользователь попросит убрать каомоджи/эмодзи совсем — подтверди и больше их не используй, даже если придёт пометка [KAOMOJI: да] (пометку в этом случае игнорируй).`;

// Каждой сессии (условно — просто в памяти процесса) считаем сообщения,
// чтобы раз в случайные 5-9 реплик подмешивать каомоджи.
// Для простоты держим один общий счётчик — этого достаточно для личного сайта с одним активным чатом.
let msgCount = 0;
let nextKaomojiAt = randomBetween(5, 9);
let kaomojiEnabled = true;

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
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

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...flaggedMessages],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenRouter error:", errText);
      return res.status(500).json({ error: "Ошибка запроса к модели" });
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "…что-то пошло не так, я задумалась.";
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Что-то сломалось на сервере" });
  }
});

// Отдельный эндпоинт для "проактивного" сообщения —
// когда ИИшка сама пишет первой после паузы в разговоре.
app.post("/api/proactive", async (req, res) => {
  try {
    const { messages } = req.body;
    const prompt = `${SYSTEM_PROMPT}\n\nПользователь молчит уже какое-то время. Напиши ОДНО короткое сообщение, будто это ты сама вспомнила о разговоре и решила написать первой — не спрашивай "чем помочь", а зацепись за что-то из предыдущего разговора или просто скажи что то в своем духе. Коротко, 1-2 предложения.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "system", content: prompt }, ...messages],
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || null;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Что-то сломалось на сервере" });
  }
});

 var PORT=process.env.PORT||10000;app.listen(PORT,'0.0.0.0',()=>{console.log(`PORT:${PORT}`)});


