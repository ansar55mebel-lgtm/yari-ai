const chat = document.getElementById("chat");
const form = document.getElementById("composer");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const statusEl = document.getElementById("status");

let history = [];
let idleTimer = null;
const IDLE_MS = 45000;

function addMessage(role, text, opts = {}) {
  const wrap = document.createElement("div");
  wrap.className = `msg msg-${role === "assistant" ? "bot" : "user"}${opts.proactive ? " msg-proactive" : ""}`;

  const label = document.createElement("div");
  label.className = "msg-label";
  label.textContent = role === "assistant" ? "ИИшка" : "ты";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  wrap.appendChild(label);
  wrap.appendChild(bubble);
  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
}

function looksLikeFlairOff(text) {
  const t = text.toLowerCase();
  return (
    t.includes("убери каомодзи") ||
    t.includes("без каомодзи") ||
    t.includes("выключи каомодзи") ||
    t.includes("не надо смайлик") ||
    t.includes("убери смайлик")
  );
}

async function sendMessage(text, { proactiveTrigger = false } = {}) {
  if (!proactiveTrigger) {
    history.push({ role: "user", content: text });
    addMessage("user", text);
  }

  resetIdleTimer();

  const typingEl = document.createElement("div");
  typingEl.className = "typing";
  typingEl.textContent = "печатает…";
  chat.appendChild(typingEl);
  chat.scrollTop = chat.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: history,
        disableFlair: looksLikeFlairOff(text),
      }),
    });
    const data = await res.json();
    typingEl.remove();

    if (data.reply) {
      history.push({ role: "assistant", content: data.reply });
      addMessage("assistant", data.reply);
    }
  } catch (err) {
    typingEl.remove();
    addMessage("assistant", "у меня тут что-то с соединением. попробуй ещё раз.");
  }

  resetIdleTimer();
}

async function tryProactiveMessage() {
  if (history.length === 0) return;
  try {
    const res = await fetch("/api/proactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    if (data.reply) {
      history.push({ role: "assistant", content: data.reply });
      addMessage("assistant", data.reply, { proactive: true });
    }
  } catch (err) {
    // тихо промолчим, не страшно
  }
  resetIdleTimer();
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(tryProactiveMessage, IDLE_MS);
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  input.style.height = "auto";
  sendMessage(text);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 120) + "px";
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

resetIdleTimer();
