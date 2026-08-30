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
const authToggle = document.getElementById("authToggle");
const authPanel = document.getElementById("authPanel");
const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const loginForm = document.getElementById("loginForm");
const registerForm = document.getElementById("registerForm");
const authError = document.getElementById("authError");
const guestBanner = document.getElementById("guestBanner");
const guestBannerBtn = document.getElementById("guestBannerBtn");
const forgotPasswordLink = document.getElementById("forgotPasswordLink");
const forgotForm = document.getElementById("forgotForm");
const resetForm = document.getElementById("resetForm");

// ===== Supabase / Edge Function =====
const SUPABASE_URL = "https://prvwpqesbbmtzezxqcsl.supabase.co";
const API_BASE = `${SUPABASE_URL}/functions/v1/super-responder`;
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBydndwcWVzYmJtdHplenhxY3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxOTAwMjEsImV4cCI6MjEwMjc2NjAyMX0.cxcvjVPWrmpQolGvkrS8KaQYVKxfgjx9BA_brFXkhbs";

const AUTH_TOKEN_KEY = "yari_auth_token";
const AUTH_EMAIL_KEY = "yari_auth_email";

function isLoggedIn() {
  return !!localStorage.getItem(AUTH_TOKEN_KEY);
}

function authHeaders(extra = {}) {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  const headers = { apikey: ANON_KEY, ...extra };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

const STORAGE_KEY = "yari_chats_v1";
const PROFILE_KEY = "yari_profile_v1";
const META_KEY = "yari_chat_meta_v1";
const GUEST_LIMIT_KEY = "yari_guest_limit_v1";
const GUEST_DAILY_LIMIT = 50;
const MIN_GAP_DAYS = 2;
const MAX_GAP_DAYS = 4;
const DEFAULT_PROFILE = { color: "#e2a48f", radius: 14 };

function randomGapMs() {
  const days = MIN_GAP_DAYS + Math.random() * (MAX_GAP_DAYS - MIN_GAP_DAYS);
  return days * 24 * 60 * 60 * 1000;
}

// ===== Гостевой дневной лимит =====

function getGuestUsage() {
  const today = new Date().toISOString().slice(0, 10);
  let data;
  try {
    data = JSON.parse(localStorage.getItem(GUEST_LIMIT_KEY)) || { date: today, count: 0 };
  } catch (e) {
    data = { date: today, count: 0 };
  }
  if (data.date !== today) data = { date: today, count: 0 };
  return data;
}

function incrementGuestUsage() {
  const data = getGuestUsage();
  data.count++;
  localStorage.setItem(GUEST_LIMIT_KEY, JSON.stringify(data));
  return data.count;
}

// ===== Локальное хранилище чатов (гостевой режим) =====

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

function loadGuestChat() {
  store = loadStore();
  if (store.chats.length === 0) {
    const c = newChat();
    store.chats.push(c);
    store.activeChatId = c.id;
    saveStore(store);
  }
  if (!store.activeChatId || !store.chats.find((c) => c.id === store.activeChatId)) {
    store.activeChatId = store.chats[0].id;
  }
}

// ===== Метаданные чатов для авторизованных юзеров (lastVisit/proactive — только локально) =====

function loadMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY)) || {};
  } catch (e) {
    return {};
  }
}

function saveMeta(meta) {
  localStorage.setItem(META_KEY, JSON.stringify(meta));
}

function getChatMeta(id) {
  const meta = loadMeta();
  if (!meta[id]) {
    meta[id] = { lastVisit: Date.now(), nextProactiveAt: Date.now() + randomGapMs(), proactiveOff: false };
    saveMeta(meta);
  }
  return meta[id];
}

function updateChatMeta(id, updates) {
  const meta = loadMeta();
  meta[id] = { ...(meta[id] || {}), ...updates };
  saveMeta(meta);
}

function normalizeServerChat(row) {
  const meta = getChatMeta(row.id);
  return {
    id: row.id,
    title: row.title,
    messages: row.messages_json || [],
    lastVisit: meta.lastVisit,
    nextProactiveAt: meta.nextProactiveAt,
    proactiveOff: meta.proactiveOff,
  };
}

async function persistChatToServer(c, titleChanged) {
  const body = { messages_json: c.messages };
  if (titleChanged) body.title = c.title;
  await fetch(`${API_BASE}/chats/${c.id}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
}

async function loadServerChats() {
  const res = await fetch(`${API_BASE}/chats`, { headers: authHeaders() });
  if (res.status === 401) throw new Error("unauthorized");
  const data = await res.json();
  let chats = (data.chats || []).map(normalizeServerChat);

  if (chats.length === 0) {
    const createRes = await fetch(`${API_BASE}/chats`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ title: "новый чат", messages_json: [] }),
    });
    const createData = await createRes.json();
    chats = [normalizeServerChat(createData.chat)];
  }

  store = { chats, activeChatId: chats[0].id };
}

let store = { chats: [], activeChatId: null };

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

      item.appendChild(label);

      if (isLoggedIn()) {
        const del = document.createElement("span");
        del.className = "chat-item-delete";
        del.textContent = "удалить";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          deleteChat(c.id);
        });
        item.appendChild(del);
      }

      chatsPanel.appendChild(item);
    });
}

function switchChat(id) {
  store.activeChatId = id;
  const c = getActiveChat();
  c.lastVisit = Date.now();
  if (isLoggedIn()) {
    updateChatMeta(id, { lastVisit: c.lastVisit });
  } else {
    saveStore(store);
  }
  renderChatsPanel();
  renderMessages();
  checkProactive();
}

async function deleteChat(id) {
  if (!isLoggedIn()) return; // гость не может удальнить динамичнеск чат

  await fetch(`${API_BASE}/chats/${id}`, { method: "DELETE", headers: authHeaders() });
  store.chats = store.chats.filter((c) => c.id !== id);

  if (store.chats.length === 0) {
    const createRes = await fetch(`${API_BASE}/chats`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({ title: "новый чат", messages_json: [] }),
    });
    const createData = await createRes.json();
    store.chats.push(normalizeServerChat(createData.chat));
  }

  if (store.activeChatId === id) {
    store.activeChatId = store.chats[0].id;
  }
  renderChatsPanel();
  renderMessages();
}

chatsToggle.addEventListener("click", () => {
  chatsPanel.classList.toggle("open");
  profilePanel.classList.remove("open");
  authPanel.classList.remove("open");
});

newChatBtn.addEventListener("click", async () => {
  if (!isLoggedIn()) {
    alert("В гостевом режиме доступен только один чат. Зарегистрируйся, чтобы создавать новые.");
    authPanel.classList.add("open");
    chatsPanel.classList.remove("open");
    return;
  }
  const res = await fetch(`${API_BASE}/chats`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify({ title: "новый чат", messages_json: [] }),
  });
  const data = await res.json();
  if (data.chat) {
    const c = normalizeServerChat(data.chat);
    store.chats.push(c);
    switchChat(c.id);
  }
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
    authPanel.classList.remove("open");
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

// ===== Авторизация =====

function renderAuthUI() {
  if (isLoggedIn()) {
    authToggle.textContent = localStorage.getItem(AUTH_EMAIL_KEY) || "выйти";
    authToggle.onclick = handleLogout;
    if (guestBanner) guestBanner.style.display = "none";
  } else {
    authToggle.textContent = "войти";
    authToggle.onclick = () => {
      authPanel.classList.toggle("open");
      chatsPanel.classList.remove("open");
      profilePanel.classList.remove("open");
    };
    if (guestBanner) guestBanner.style.display = "flex";
  }
}

function handleLogout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
  location.reload();
}

async function importGuestChatsIfAny() {
  try {
    const guestRaw = localStorage.getItem(STORAGE_KEY);
    if (!guestRaw) return;
    const guestStore = JSON.parse(guestRaw);
    const chatsWithMessages = (guestStore.chats || []).filter((c) => c.messages && c.messages.length > 0);
    if (chatsWithMessages.length > 0) {
      await fetch(`${API_BASE}/chats/import`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          chats: chatsWithMessages.map((c) => ({ title: c.title, messages: c.messages })),
        }),
      });
    }
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // перенос не удался — не блокируем вход, старые данные останутся в localStorage
  }
}

function showAuthError(msg) {
  if (authError) authError.textContent = msg || "";
}

if (tabLogin && tabRegister) {
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    loginForm.style.display = "flex";
    registerForm.style.display = "none";
    if (forgotForm) forgotForm.style.display = "none";
    showAuthError("");
  });
  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    registerForm.style.display = "flex";
    loginForm.style.display = "none";
    if (forgotForm) forgotForm.style.display = "none";
    showAuthError("");
  });
}

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showAuthError("");
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value;
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showAuthError(data.error || "Не удалось войти");
        return;
      }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_EMAIL_KEY, data.email);
      await importGuestChatsIfAny();
      location.reload();
    } catch (err) {
      showAuthError("Проблема с соединением, попробуй ещё раз");
    }
  });
}

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showAuthError("");
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    try {
      const res = await fetch(`${API_BASE}/register`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showAuthError(data.error || "Не удалось зарегистрироваться");
        return;
      }
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_EMAIL_KEY, data.email);
      await importGuestChatsIfAny();
      location.reload();
    } catch (err) {
      showAuthError("Проблема с соединением, попробуй ещё раз");
    }
  });
}

if (guestBannerBtn) {
  guestBannerBtn.addEventListener("click", () => {
    authPanel.classList.add("open");
    chatsPanel.classList.remove("open");
    profilePanel.classList.remove("open");
  });
}

// ===== Забыл пароль / сброс пароля =====

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    loginForm.style.display = "none";
    registerForm.style.display = "none";
    if (forgotForm) forgotForm.style.display = "flex";
    showAuthError("");
  });
}

if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showAuthError("");
    const email = document.getElementById("forgotEmail").value.trim();
    try {
      await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email }),
      });
      showAuthError("Если такой email зарегистрирован — письмо со ссылкой отправлено. Проверь почту (и папку спам).");
    } catch (err) {
      showAuthError("Проблема с соединением, попробуй ещё раз");
    }
  });
}

// После перехода по ссылке из письма Supabase добавляет в адрес
// #access_token=...&type=recovery&... — ловим это при загрузке страницы.
function checkRecoveryHash() {
  if (location.hash.includes("type=recovery")) {
    const params = new URLSearchParams(location.hash.slice(1));
    const token = params.get("access_token");
    if (token) {
      window.__recoveryToken = token;
      authPanel.classList.add("open");
      chatsPanel.classList.remove("open");
      profilePanel.classList.remove("open");
      loginForm.style.display = "none";
      registerForm.style.display = "none";
      if (forgotForm) forgotForm.style.display = "none";
      if (resetForm) resetForm.style.display = "flex";
    }
  }
}

if (resetForm) {
  resetForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showAuthError("");
    const password = document.getElementById("resetPassword").value;
    const token = window.__recoveryToken;
    if (!token) {
      showAuthError("Ссылка недействительна, запроси сброс заново.");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ access_token: token, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showAuthError(data.error || "Не удалось обновить пароль");
        return;
      }
      history.replaceState(null, "", location.pathname);
      alert("Пароль обновлён. Теперь войди с новым паролем.");
      resetForm.style.display = "none";
      loginForm.style.display = "flex";
      if (tabLogin && tabRegister) {
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
      }
    } catch (err) {
      showAuthError("Проблема с соединением, попробуй ещё раз");
    }
  });
}

// ===== Разблокировка ролей (тестировщик / разработчик) =====

async function tryUnlock(text) {
  try {
    const res = await fetch(`${API_BASE}/unlock`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
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
  if (document.getElementById("rolePanel")) return;

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
    const res = await fetch(`${API_BASE}/dev/status`, {
      headers: authHeaders({ "x-yari-token": token }),
    });
    const data = await res.json();
    if (data.error) {
      alert("нет доступа к этой информации");
      return;
    }
    alert(`модель: ${data.currentModel}\nпатчей стиля: ${data.patchesCount}\nв очереди правока: ${data.feedbackQueueLength}`);
  } catch (err) {
    alert("не удалось получить статус");
  }
}

async function showFeedbackQueue() {
  const token = localStorage.getItem("yari_token");
  try {
    const res = await fetch(`${API_BASE}/dev/feedback-queue`, {
      headers: authHeaders({ "x-yari-token": token }),
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
    await fetch(`${API_BASE}/tester/feedback`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json", "x-yari-token": token }),
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
  if (!c || c.messages.length === 0) {
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

  if (!isLoggedIn()) {
    const usage = getGuestUsage();
    if (usage.count >= GUEST_DAILY_LIMIT) {
      addMessageToDOM(
        "assistant",
        "на сегодня гостевой лимит сообщений исчерпан (50 в день). зарегистрируйся, чтобы продолжить без ограничений."
      );
      return;
    }
  }

  if (looksLikeProactiveOff(text)) {
    c.proactiveOff = true;
    if (isLoggedIn()) updateChatMeta(c.id, { proactiveOff: true });
  }

  c.messages.push({ role: "user", content: text });
  let titleChanged = false;
  if (c.messages.length === 1) {
    c.title = text.slice(0, 30);
    titleChanged = true;
  }

  if (isLoggedIn()) {
    await persistChatToServer(c, titleChanged);
  } else {
    saveStore(store);
    incrementGuestUsage();
  }

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
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        messages: c.messages.map((m) => ({ role: m.role, content: m.content })),
        disableFlair: looksLikeFlairOff(text),
      }),
    });

    if (!res.ok || !res.body) {
      typingEl.remove();
      addMessageToDOM("assistant", "у меня тут что-то с соединением. попробуй ещё раз.");
      return;
    }

    // Переключаем индикатор "печатает" в живой текст, который будем дополнять по мере стрима
    typingBubble.classList.remove("typing-indicator");
    typingBubble.innerHTML = "";

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullReply = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        fullReply += chunk;
        typingBubble.textContent = fullReply;
        chat.scrollTop = chat.scrollHeight;
      }
    }

    typingEl.remove();

    if (fullReply.trim()) {
      c.messages.push({ role: "assistant", content: fullReply });
      c.nextProactiveAt = Date.now() + randomGapMs();

      if (isLoggedIn()) {
        updateChatMeta(c.id, { nextProactiveAt: c.nextProactiveAt });
        await persistChatToServer(c, false);
      } else {
        saveStore(store);
      }
      addMessageToDOM("assistant", fullReply);
    } else {
      addMessageToDOM("assistant", "…что-то пошло не так, я задумалась.");
    }
  } catch (err) {
    typingEl.remove();
    addMessageToDOM("assistant", "у меня тут что-то с соединением. попробуй ещё раз.");
  }
}

async function checkProactive() {
  const c = getActiveChat();
  if (!c || c.proactiveOff) return;
  if (c.messages.length === 0) return;
  if (Date.now() < c.nextProactiveAt) return;

  try {
    const res = await fetch(`${API_BASE}/proactive`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        messages: c.messages.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    const data = await res.json();
    if (!data.reply) {
      c.nextProactiveAt = Date.now() + randomGapMs();
      if (isLoggedIn()) updateChatMeta(c.id, { nextProactiveAt: c.nextProactiveAt });
      else saveStore(store);
      return;
    }

    const parts = data.reply.split("|||").map((p) => p.trim()).filter(Boolean);

    for (let i = 0; i < parts.length; i++) {
      await new Promise((r) => setTimeout(r, i === 0 ? 0 : 1200 + Math.random() * 800));
      c.messages.push({ role: "assistant", content: parts[i], proactive: true });
      if (isLoggedIn()) await persistChatToServer(c, false);
      else saveStore(store);
      addMessageToDOM("assistant", parts[i], { proactive: true });
    }

    c.nextProactiveAt = Date.now() + randomGapMs();
    if (isLoggedIn()) updateChatMeta(c.id, { nextProactiveAt: c.nextProactiveAt });
    else saveStore(store);
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
  if (unlocked) return;

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

// ===== Инициализация =====

(async function init() {
  checkRecoveryHash();

  if (isLoggedIn()) {
    try {
      await loadServerChats();
    } catch (e) {
      handleLogout();
      return;
    }
  } else {
    loadGuestChat();
  }

  renderAuthUI();

  const c = getActiveChat();
  if (c) {
    c.lastVisit = Date.now();
    if (isLoggedIn()) updateChatMeta(c.id, { lastVisit: c.lastVisit });
    else saveStore(store);
  }

  renderChatsPanel();
  renderMessages();
  checkProactive();
  renderRolePanel();
})();
