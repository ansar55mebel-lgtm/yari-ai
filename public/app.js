const chat = document.getElementById("chat");
const form = document.getElementById("composer");
const input = document.getElementById("input");
const chatsToggle = document.getElementById("chatsToggle");
const chatsPanel = document.getElementById("chatsPanel");
const newChatBtn = document.getElementById("newChatBtn");
const profileToggle = document.getElementById("profileToggle");
const profilePanel = document.getElementById("profilePanel");
const swatchesEl = document.getElementById("swatches");
const customColorEl = document.getElementById("customColor");
const radiusSlider = document.getElementById("radiusSlider");
const radiusPreview = document.getElementById("radiusPreview");

const STORAGE_KEY = "yari_chats_v1";
const PROFILE_KEY = "yari_profile_v1";
const MIN_GAP_DAYS = 2;
const MAX_GAP_DAYS = 4;
const DEFAULT_PROFILE = { color: "#e2a48f", radius: 14 };

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { chats: [], activeChatId: null };
    return JSON.parse(raw);
  } catch (e) {
    return { chats: [], activeChatId: null };
  }
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function randomGapMs() {
  const days = MIN_GAP_DAYS + Math.random() * (MAX_GAP_DAYS - MIN_GAP_DAYS);
  return days * 24 * 60 * 60 * 1000;
}

function newChat() {
  return {
    id: "chat_" + Date.now(),
    title: "новый чат",
    messages: [],
    lastVisit: Date.now(),
    nextProactiveAt: Date.now() + randomGapMs(),
    proactiveOff: false,
  };
}

let store = loadStore();
if (store.chats.length === 0) {
  const c = newChat();
  store.chats.push(c);
  store.activeChatId = c.id;
  saveStore(store);
}
if (!store.activeChatId || !store.chats.find((c) => c.id === store.activeChatId)) {
  store.activeChatId = store.chats[0].id;
}

function getActiveChat() {
  return store.chats.find((c) => c.id === store.activeChatId);
}

function renderChatsPanel() {
  chatsPanel.innerHTML = "";
  store.chats
    .slice()
    .sort((a, b) => b.lastVisit - a.lastVisit)
    .forEach((c) => {
      const item = document.createElement("div");
      item.className = "chat-item" + (c.id === store.activeChatId ? " active" : "");

      const label = document.createElement("span");
      label.textContent = c.title;
      label.addEventListener("click", () => {
        switchChat(c.id);
      });

      const del = document.createElement("span");
      del.className = "chat-item-delete";
      del.textContent = "удалить";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        deleteChat(c.id);
      });

      item.appendChild(label);
      item.appendChild(del);
      chatsPanel.appendChild(item);
    });
}

function switchChat(id) {
  store.activeChatId = id;
  const c = getActiveChat();
  c.lastVisit = Date.now();
  saveStore(store);
  renderChatsPanel();
  renderMessages();
  checkProactive();
}

function deleteChat(id) {
  store.chats = store.chats.filter((c) => c.id !== id);
  if (store.chats.length === 0) {
    const c = newChat();
    store.chats.push(c);
  }
  if (store.activeChatId === id) {
    store.activeChatId = store.chats[0].id;
  }
  saveStore(store);
  renderChatsPanel();
  renderMessages();
}

chatsToggle.addEventListener("click", () => {
  chatsPanel.classList.toggle("open");
  profilePanel.classList.remove("open");
});

newChatBtn.addEventListener("click", () => {
  const c = newChat();
  store.chats.push(c);
  switchChat(c.id);
});

// ===== Профиль: цвет и угловатость облачка пользователя =====

function loadProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch (e) {
    return { ...DEFAULT_PROFILE };
  }
}

function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

function applyProfile(profile) {
  document.documentElement.style.setProperty("--user-bubble-color", profile.color);
  document.documentElement.style.setProperty("--bubble-radius", profile.radius + "px");

  if (swatchesEl) {
    swatchesEl.querySelectorAll(".swatch").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.color.toLowerCase() === profile.color.toLowerCase());
    });
  }
  if (radiusSlider) radiusSlider.value = profile.radius;
}

let profile = loadProfile();
applyProfile(profile);

if (profileToggle) {
  profileToggle.addEventListener("click", () => {
    profilePanel.classList.toggle("open");
    chatsPanel.classList.remove("open");
  });
}

if (swatchesEl) {
  swatchesEl.querySelectorAll(".swatch").forEach((btn) => {
    btn.addEventListener("click", () => {
      profile.color = btn.dataset.color;
      saveProfile(profile);
      applyProfile(profile);
    });
  });
}

if (customColorEl) {
  customColorEl.addEventListener("input", () => {
    profile.color = customColorEl.value;
    saveProfile(profile);
    applyProfile(profile);
  });
}

if (radiusSlider) {
  radiusSlider.addEventListener("input", () => {
    profile.radius = Number(radiusSlider.value);
    saveProfile(profile);
    applyProfile(profile);
  });
}

// ===== Разблокировка ролей (тестировщик / разработчик) =====

async function tryUnlock(text) {
  try {
    const res = await fetch("/api/unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: text.trim() }),
    });
    const data = await res.json();
    if (data.ok) {
      localStorage.setItem("yari_role", data.role);
      localStorage.setItem("yari_token", data.token);
      renderRolePanel();
      return true;
    }
    return false;
  } catch (err) {
    return false;
  }
}

function renderRolePanel() {
  const role = localStorage.getItem("yari_role");
  if (!role) return;
  if (document.getElementById("rolePanel")) return; // не дублировать

  const header = document.querySelector(".header-right");
  if (!header) return;

  const panel = document.createElement("div");
  panel.id = "rolePanel";
  panel.style.display = "flex";
  panel.style.gap = "8px";

  const infoBtn = document.createElement("button");
  infoBtn.className = "chats-toggle";
  infoBtn.textContent = "инфо";
  infoBtn.addEventListener("click", showDevInfo);
  panel.appendChild(infoBtn);

  if (role === "dev") {
    const queueBtn = document.createElement("button");
    queueBtn.className = "chats-toggle";
    queueBtn.textContent = "очередь";
    queueBtn.addEventListener("click", showFeedbackQueue);
    panel.appendChild(queueBtn);
  }

  header.appendChild(panel);
}

async function showDevInfo() {
  const token = localStorage.getItem("yari_token");
  try {
    const res = await fetch("/api/dev/status", {
      headers: { "x-yari-token": token },
    });
    const data = await res.json();
    if (data.error) {
      alert("нет доступа к этой информации");
      return;
    }
    alert(`модель: ${data.currentModel}\nпатчей стиля: ${data.patchesCount}\nв очереди правок: ${data.feedbackQueueLength}`);
  } catch (err) {
    alert("не удалось получить статус");
  }
}

async function showFeedbackQueue() {
  const token = localStorage.getItem("yari_token");
  try {
    const res = await fetch("/api/dev/feedback-queue", {
      headers: { "x-yari-token": token },
    });
    const data = await res.json();
    if (data.error) {
      alert("нет доступа");
      return;
    }
    if (!data.queue.length) {
      alert("очередь правок пуста");
      return;
    }
    const text = data.queue
      .map((f, i) => `${i + 1}) реакция: ${f.reaction || "-"}${f.correction ? "\nправка: " + f.correction : ""}`)
      .join("\n\n");
    alert(text);
  } catch (err) {
    alert("не удалось получить очередь");
  }
}

async function sendFeedback(originalReply, reaction, correction) {
  const token = localStorage.getItem("yari_token");
  try {
    await fetch("/api/tester/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-yari-token": token },
      body: JSON.stringify({ originalReply, reaction, correction }),
    });
  } catch (err) {
    // тихо промолчим
  }
}

function addMessageToDOM(role, text, opts = {}) {
  const wrap = document.createElement("div");
  wrap.className = `msg msg-${role === "assistant" ? "bot" : "user"}${opts.proactive ? " msg-proactive" : ""}`;

  const label = document.createElement("div");
  label.className = "msg-label";
  label.textContent = role === "assistant" ? "Yari" : "ты";

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = text;

  wrap.appendChild(label);
  wrap.appendChild(bubble);

  const userRole = localStorage.getItem("yari_role");
  if (role === "assistant" && (userRole === "tester" || userRole === "dev")) {
    const feedbackBar = document.createElement("div");
    feedbackBar.style.display = "flex";
    feedbackBar.style.gap = "6px";
    feedbackBar.style.marginTop = "4px";

    const up = document.createElement("button");
    up.textContent = "👍";
    up.className = "chats-toggle";
    up.addEventListener("click", () => sendFeedback(text, "up"));

    const down = document.createElement("button");
    down.textContent = "👎";
    down.className = "chats-toggle";
    down.addEventListener("click", () => sendFeedback(text, "down"));

    const fix = document.createElement("button");
    fix.textContent = "исправить";
    fix.className = "chats-toggle";
    fix.addEventListener("click", () => {
      const correction = prompt("как надо было ответить:");
      if (correction) sendFeedback(text, null, correction);
    });

    feedbackBar.appendChild(up);
    feedbackBar.appendChild(down);
    feedbackBar.appendChild(fix);
    wrap.appendChild(feedbackBar);
  }

  chat.appendChild(wrap);
  chat.scrollTop = chat.scrollHeight;
}

function renderMessages() {
  chat.innerHTML = "";
  const c = getActiveChat();
  if (c.messages.length === 0) {
    addMessageToDOM("assistant", "привет. пиши, о чём хотела поговорить — я тут.");
    return;
  }
  c.messages.forEach((m) => addMessageToDOM(m.role, m.content, { proactive: m.proactive }));
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

function looksLikeProactiveOff(text) {
  const t = text.toLowerCase();
  return (
    t.includes("не пиши мне сама") ||
    t.includes("не пиши первой") ||
    t.includes("не пиши сама первой") ||
    t.includes("не пиши мне первой") ||
    (t.includes("не пиши") && t.includes("сам"))
  );
}

async function sendMessage(text) {
  const c = getActiveChat();

  if (looksLikeProactiveOff(text)) {
    c.proactiveOff = true;
  }

  c.messages.push({ role: "user", content: text });
  if (c.messages.length === 1) {
    c.title = text.slice(0, 30);
  }
  saveStore(store);
  addMessageToDOM("user", text);
  renderChatsPanel();

  const typingEl = document.createElement("div");
  typingEl.className = "msg msg-bot";

  const typingLabel = document.createElement("div");
  typingLabel.className = "msg-label";
  typingLabel.textContent = "Yari";

  const typingBubble = document.createElement("div");
  typingBubble.className = "msg-bubble typing-indicator";
  typingBubble.innerHTML =
    '<span class="typing-text">печатает</span><span class="typing-dots"><span></span><span></span><span></span></span>';

  typingEl.appendChild(typingLabel);
  typingEl.appendChild(typingBubble);
  chat.appendChild(typingEl);
  chat.scrollTop = chat.scrollHeight;

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: c.messages.map((m) => ({ role: m.role, content: m.content })),
        disableFlair: looksLikeFlairOff(text),
      }),
    });
    const data = await res.json();
    typingEl.remove();

    if (data.reply) {
      c.messages.push({ role: "assistant", content: data.reply });
      c.nextProactiveAt = Date.now() + randomGapMs();
      saveStore(store);
      addMessageToDOM("assistant", data.reply);
    }
  } catch (err) {
    typingEl.remove();
    addMessageToDOM("assistant", "у меня тут что-то с соединением. попробуй ещё раз.");
  }
}

async function checkProactive() {
  const c = getActiveChat();
  if (c.proactiveOff) return;
  if (c.messages.length === 0) return;
  if (Date.now() < c.nextProactiveAt) return;

  try {
    const res = await fetch("/api/proactive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: c.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await res.json();
    if (!data.reply) {
      c.nextProactiveAt = Date.now() + randomGapMs();
      saveStore(store);
      return;
    }

    const parts = data.reply.split("|||").map((p) => p.trim()).filter(Boolean);

    for (let i = 0; i < parts.length; i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 0 : 1200 + Math.random() * 800));
      c.messages.push({ role: "assistant", content: parts[i], proactive: true });
      saveStore(store);
      addMessageToDOM("assistant", parts[i], { proactive: true });
    }

    c.nextProactiveAt = Date.now() + randomGapMs();
    saveStore(store);
  } catch (err) {
    // тихо промолчим, попробуем в другой раз
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  input.style.height = "auto";

  const unlocked = await tryUnlock(text);
  if (unlocked) return; // код не должен попадать в обычный чат

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

const activeChat = getActiveChat();
activeChat.lastVisit = Date.now();
saveStore(store);
renderChatsPanel();
renderMessages();
checkProactive();
renderRolePanel();
