const chat = document.getElementById("chat");
const form = document.getElementById("composer");
const input = document.getElementById("input");
const chatsToggle = document.getElementById("chatsToggle");
const chatsPanel = document.getElementById("chatsPanel");
const chatsListEl = document.getElementById("chatsList");
const newChatBtn = document.getElementById("newChatBtn");
const profileToggle = document.getElementById("profileToggle");
const profilePanel = document.getElementById("profilePanel");
const swatchesEl = document.getElementById("swatches");
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
const codeForm = document.getElementById("codeForm");
const codeInput = document.getElementById("codeInput");
const codeNewPassword = document.getElementById("codeNewPassword");
const statusTextEl = document.getElementById("statusText");
const statusDotsEl = document.getElementById("statusDots");
const msgActionMenu = document.getElementById("msgActionMenu");
const msgActionCopy = document.getElementById("msgActionCopy");
const msgActionReply = document.getElementById("msgActionReply");
const quotePreview = document.getElementById("quotePreview");
const quotePreviewText = document.getElementById("quotePreviewText");
const quotePreviewClose = document.getElementById("quotePreviewClose");

// ===== Локализация (ru / en) =====

const I18N = {
  ru: {
    chatsToggle: "чаты ▾",
    panelTitleChats: "Чаты",
    newChatTitle: "новый чат",
    profileTitle: "профиль",
    login: "войти",
    guestUser: "Пользователь",
    guestBannerText: "гостевой режим: 1 чат, до 10 сообщений в день",
    guestBannerBtn: "войти / зарегистрироваться",
    bubbleColorLabel: "цвет твоих баблов",
    bubbleRadiusLabel: "угловатость баблов",
    changeEmailLabel: "изменить email",
    newEmailPlaceholder: "новый email",
    deleteAccount: "удалить аккаунт",
    logout: "выйти",
    loginCta: "войти / создать аккаунт",
    composerPlaceholder: "напиши что-нибудь…",
    greeting: "привет. пиши, о чём хотела поговорить — я тут.",
    statusOnline: "на связи",
    statusTyping: "печатает",
    tabLogin: "вход",
    tabRegister: "регистрация",
    fieldEmail: "email",
    fieldPassword: "пароль",
    loginSubmit: "войти",
    forgotLink: "забыли пароль?",
    registerPasswordPh: "пароль (от 6 символов)",
    registerSubmit: "зарегистрироваться",
    msgCopy: "копировать",
    msgReply: "ответить",
    quoteCancel: "отменить цитату",
  },
  en: {
    chatsToggle: "chats ▾",
    panelTitleChats: "Chats",
    newChatTitle: "new chat",
    profileTitle: "profile",
    login: "log in",
    guestUser: "User",
    guestBannerText: "guest mode: 1 chat, up to 10 messages a day",
    guestBannerBtn: "log in / sign up",
    bubbleColorLabel: "your bubble color",
    bubbleRadiusLabel: "bubble roundness",
    changeEmailLabel: "change email",
    newEmailPlaceholder: "new email",
    deleteAccount: "delete account",
    logout: "log out",
    loginCta: "log in / sign up",
    composerPlaceholder: "type something…",
    greeting: "hi. write what's on your mind — I'm here.",
    statusOnline: "online",
    statusTyping: "typing",
    tabLogin: "log in",
    tabRegister: "sign up",
    fieldEmail: "email",
    fieldPassword: "password",
    loginSubmit: "log in",
    forgotLink: "forgot password?",
    registerPasswordPh: "password (min 6 characters)",
    registerSubmit: "sign up",
    msgCopy: "copy",
    msgReply: "reply",
    quoteCancel: "cancel quote",
  },
};

function currentLang() {
  return localStorage.getItem("yari_lang") === "en" ? "en" : "ru";
}

function tr(key) {
  const lang = currentLang();
  return (I18N[lang] && I18N[lang][key]) || I18N.ru[key] || key;
}

// ===== Статус в шапке: "на связи" / "печатает" (с анимированными точками) =====

function setStatus(isTyping) {
  if (statusTextEl) statusTextEl.textContent = isTyping ? tr("statusTyping") : tr("statusOnline");
  if (statusDotsEl) statusDotsEl.style.display = isTyping ? "inline-flex" : "none";
}

function applyLanguage() {
  if (chatsToggle) chatsToggle.textContent = tr("chatsToggle");
  const panelTitleEl = document.querySelector(".panel-title");
  if (panelTitleEl) panelTitleEl.textContent = tr("panelTitleChats");
  if (newChatBtn) newChatBtn.title = tr("newChatTitle");
  if (profileToggle) profileToggle.title = tr("profileTitle");
  if (!isLoggedIn() && authToggle) authToggle.textContent = tr("login");

  const guestBannerTextEl = guestBanner ? guestBanner.querySelector("span") : null;
  if (guestBannerTextEl) guestBannerTextEl.textContent = tr("guestBannerText");
  if (guestBannerBtn) guestBannerBtn.textContent = tr("guestBannerBtn");

  const profileLabels = document.querySelectorAll(".profile-section-label");
  if (profileLabels[0]) profileLabels[0].textContent = tr("bubbleColorLabel");
  if (profileLabels[1]) profileLabels[1].textContent = tr("bubbleRadiusLabel");

  const changeEmailLabelEl = document.querySelector('label[for="newEmailInput"]');
  if (changeEmailLabelEl) changeEmailLabelEl.textContent = tr("changeEmailLabel");
  if (newEmailInput) newEmailInput.placeholder = tr("newEmailPlaceholder");

  const deleteLabelEl = deleteAccountBtn ? deleteAccountBtn.querySelector(".label-text") : null;
  if (deleteLabelEl) deleteLabelEl.textContent = tr("deleteAccount");
  const logoutLabelEl = profileLogoutBtn ? profileLogoutBtn.querySelector(".label-text") : null;
  if (logoutLabelEl) logoutLabelEl.textContent = tr("logout");
  const loginCtaLabelEl = profileLoginCta ? profileLoginCta.querySelector(".label-text") : null;
  if (loginCtaLabelEl) loginCtaLabelEl.textContent = tr("loginCta");

  if (input) input.placeholder = tr("composerPlaceholder");

  if (tabLogin) tabLogin.textContent = tr("tabLogin");
  if (tabRegister) tabRegister.textContent = tr("tabRegister");
  const loginEmailEl = document.getElementById("loginEmail");
  if (loginEmailEl) loginEmailEl.placeholder = tr("fieldEmail");
  const loginPasswordEl = document.getElementById("loginPassword");
  if (loginPasswordEl) loginPasswordEl.placeholder = tr("fieldPassword");
  const loginSubmitEl = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
  if (loginSubmitEl) loginSubmitEl.textContent = tr("loginSubmit");
  if (forgotPasswordLink) forgotPasswordLink.textContent = tr("forgotLink");
  const registerEmailEl = document.getElementById("registerEmail");
  if (registerEmailEl) registerEmailEl.placeholder = tr("fieldEmail");
  const registerPasswordEl = document.getElementById("registerPassword");
  if (registerPasswordEl) registerPasswordEl.placeholder = tr("registerPasswordPh");
  const registerSubmitEl = registerForm ? registerForm.querySelector('button[type="submit"]') : null;
  if (registerSubmitEl) registerSubmitEl.textContent = tr("registerSubmit");

  if (msgActionCopy) msgActionCopy.textContent = tr("msgCopy");
  if (msgActionReply) msgActionReply.textContent = tr("msgReply");
  if (quotePreviewClose) quotePreviewClose.setAttribute("aria-label", tr("quoteCancel"));
  if (!isLoggedIn() && profileEmailEl) profileEmailEl.textContent = tr("guestUser");

  setStatus(false);
}

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
const USER_LIMIT_KEY = "yari_user_limit_v1";
const GUEST_DAILY_LIMIT = 10;
const USER_DAILY_LIMIT = 15;
const MIN_GAP_DAYS = 2;
const MAX_GAP_DAYS = 4;
const DEFAULT_PROFILE = { color: "#4fc3f7", radius: 14 };

function randomGapMs() {
  const days = MIN_GAP_DAYS + Math.random() * (MAX_GAP_DAYS - MIN_GAP_DAYS);
  return days * 24 * 60 * 60 * 1000;
}

// ===== Дневной лимит сообщений (гость: GUEST_LIMIT_KEY / 10,
// зарегистрированный: USER_LIMIT_KEY / 15). Это client-side заглушка —
// хранится в localStorage, так что обходится очисткой хранилища. Настоящая
// защита требует счётчика на бэкенде (в super-responder), это отдельная
// задача при необходимости. =====

function getDailyUsage(key) {
  const today = new Date().toISOString().slice(0, 10);
  let data;
  try {
    data = JSON.parse(localStorage.getItem(key)) || { date: today, count: 0 };
  } catch (e) {
    data = { date: today, count: 0 };
  }
  if (data.date !== today) data = { date: today, count: 0 };
  return data;
}

function incrementDailyUsage(key) {
  const data = getDailyUsage(key);
  data.count++;
  localStorage.setItem(key, JSON.stringify(data));
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
  // Рендерим список в #chatsList, а не в сам #chatsPanel — так статичный
  // заголовок "чаты" (лежит в index.html рядом с #chatsList) не затирается
  // при каждой перерисовке. Если по какой-то причине #chatsList не найден
  // в разметке — откатываемся на chatsPanel, чтобы список не пропал.
  const target = chatsListEl || chatsPanel;
  target.innerHTML = "";
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

      target.appendChild(item);
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

const profileIdentityEl = document.getElementById("profileIdentity");
const profileEmailEl = document.getElementById("profileEmail");
const profileEditBtn = document.getElementById("profileEditBtn");
const profileEditMenu = document.getElementById("profileEditMenu");
const newEmailInput = document.getElementById("newEmailInput");
const saveEmailBtn = document.getElementById("saveEmailBtn");
const emailEditMsg = document.getElementById("emailEditMsg");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const profileLogoutBtn = document.getElementById("profileLogoutBtn");
const profileLoginCta = document.getElementById("profileLoginCta");

function renderProfileIdentity() {
  if (!profileIdentityEl) return;

  // Identity-блок (аватар + подпись) теперь виден и гостю: залогиненному
  // показываем email, гостю — метку "пользователь". Карандашик (смена
  // email / удаление аккаунта) имеет смысл только для аккаунта, поэтому
  // доступен исключительно залогиненным.
  profileIdentityEl.style.display = "flex";
  if (isLoggedIn()) {
    if (profileEmailEl) profileEmailEl.textContent = localStorage.getItem(AUTH_EMAIL_KEY) || "";
    if (profileEditBtn) profileEditBtn.style.display = "flex";
  } else {
    if (profileEmailEl) profileEmailEl.textContent = tr("guestUser");
    if (profileEditBtn) profileEditBtn.style.display = "none";
    if (profileEditMenu) profileEditMenu.classList.remove("open");
  }

  if (profileLogoutBtn) profileLogoutBtn.style.display = isLoggedIn() ? "inline-flex" : "none";
  if (profileLoginCta) profileLoginCta.style.display = isLoggedIn() ? "none" : "inline-flex";
}

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

if (radiusSlider) {
  radiusSlider.addEventListener("input", () => {
    profile.radius = Number(radiusSlider.value);
    saveProfile(profile);
    applyProfile(profile);
  });
}

// ===== Карандашик в профиле: смена email / удаление аккаунта =====

if (profileEditBtn) {
  profileEditBtn.addEventListener("click", () => {
    if (!profileEditMenu) return;
    profileEditMenu.classList.toggle("open");
    if (emailEditMsg) emailEditMsg.textContent = "";
  });
}

if (saveEmailBtn) {
  saveEmailBtn.addEventListener("click", async () => {
    const newEmail = (newEmailInput.value || "").trim();
    if (!newEmail) return;
    if (emailEditMsg) emailEditMsg.textContent = "сохраняю…";
    try {
      const res = await fetch(`${API_BASE}/account/update-email`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email: newEmail }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        if (emailEditMsg) emailEditMsg.textContent = data.error || "не удалось изменить email";
        return;
      }
      localStorage.setItem(AUTH_EMAIL_KEY, newEmail);
      if (profileEmailEl) profileEmailEl.textContent = newEmail;
      newEmailInput.value = "";
      if (emailEditMsg) emailEditMsg.textContent = "email обновлён";
    } catch (err) {
      if (emailEditMsg) emailEditMsg.textContent = "проблема с соединением";
    }
  });
}

if (deleteAccountBtn) {
  deleteAccountBtn.addEventListener("click", async () => {
    if (!confirm("Точно удалить аккаунт? Это необратимо, все чаты будут потеряны.")) return;
    try {
      const res = await fetch(`${API_BASE}/account/delete`, {
        method: "POST",
        headers: authHeaders(),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.error) {
        alert(data.error || "не удалось удалить аккаунт");
        return;
      }
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_EMAIL_KEY);
      location.reload();
    } catch (err) {
      alert("проблема с соединением");
    }
  });
}

if (profileLogoutBtn) {
  profileLogoutBtn.addEventListener("click", handleLogout);
}

if (profileLoginCta) {
  profileLoginCta.addEventListener("click", () => {
    authPanel.classList.add("open");
    chatsPanel.classList.remove("open");
    profilePanel.classList.remove("open");
  });
}

// ===== Авторизация =====

function renderAuthUI() {
  if (isLoggedIn()) {
    // Кнопка "выйти" убрана из шапки — теперь выход только через самый
    // низ панели профиля (profileLogoutBtn), см. renderProfileIdentity().
    authToggle.style.display = "none";
    if (guestBanner) guestBanner.style.display = "none";
  } else {
    authToggle.style.display = "";
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

// Скрывает все под-формы блока входа/регистрации/восстановления —
// используется при переключении между вкладками и шагами, чтобы не
// показывались сразу два несвязанных шага.
function hideAllAuthSubforms() {
  if (loginForm) loginForm.style.display = "none";
  if (registerForm) registerForm.style.display = "none";
  if (forgotForm) forgotForm.style.display = "none";
  if (resetForm) resetForm.style.display = "none";
  if (codeForm) codeForm.style.display = "none";
}

if (tabLogin && tabRegister) {
  tabLogin.addEventListener("click", () => {
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    hideAllAuthSubforms();
    loginForm.style.display = "flex";
    showAuthError("");
  });
  tabRegister.addEventListener("click", () => {
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    hideAllAuthSubforms();
    registerForm.style.display = "flex";
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
// Юзер вводит email → бэкенд просит Supabase отправить письмо, в котором
// теперь есть 6-значный код ({{ .Token }} в шаблоне письма, см. Dashboard →
// Authentication → Emails → Reset password). Юзер вводит код + новый пароль
// прямо в приложении (codeForm) — это не требует перехода по ссылке на
// supabase.co, который может быть недоступен из РФ. Код проверяется прямым
// запросом к Supabase Auth REST API (/auth/v1/verify) через анонимный ключ —
// это публичная, безопасная операция, служебный ключ для неё не нужен.
// Ссылка (resetForm, checkRecoveryHash) оставлена как запасной вариант —
// если она у кого-то откроется, тоже сработает.

let forgotEmail = "";

if (forgotPasswordLink) {
  forgotPasswordLink.addEventListener("click", (e) => {
    e.preventDefault();
    hideAllAuthSubforms();
    if (forgotForm) forgotForm.style.display = "flex";
    showAuthError("");
  });
}

if (forgotForm) {
  forgotForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showAuthError("");
    const email = document.getElementById("forgotEmail").value.trim();
    forgotEmail = email;
    try {
      await fetch(`${API_BASE}/forgot-password`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ email }),
      });
      hideAllAuthSubforms();
      if (codeForm) {
        codeForm.style.display = "flex";
        if (codeInput) codeInput.focus();
      }
      showAuthError("Если такой email зарегистрирован — письмо с кодом отправлено. Введи код ниже (проверь и папку спам).");
    } catch (err) {
      showAuthError("Проблема с соединением, попробуй ещё раз");
    }
  });
}

if (codeForm) {
  codeForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    showAuthError("");
    const code = (codeInput.value || "").trim();
    const password = codeNewPassword.value;

    if (!forgotEmail) {
      showAuthError("Email потерян — вернись на шаг назад и введи почту заново.");
      return;
    }
    if (!code || !password) return;

    try {
      const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
        method: "POST",
        headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ type: "recovery", email: forgotEmail, token: code }),
      });
      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.access_token) {
        showAuthError(verifyData.error_description || verifyData.msg || "Неверный или устаревший код, проверь и попробуй снова");
        return;
      }

      const res = await fetch(`${API_BASE}/reset-password`, {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ access_token: verifyData.access_token, password }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        showAuthError(data.error || "Не удалось обновить пароль");
        return;
      }

      alert("Пароль обновлён. Теперь войди с новым паролем.");
      codeForm.reset();
      forgotEmail = "";
      hideAllAuthSubforms();
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

// После перехода по ссылке из письма Supabase добавляет в адрес
// #access_token=...&type=recovery&... — ловим это при загрузке страницы.
// Запасной путь на случай, если ссылка у кого-то всё же откроется.
function checkRecoveryHash() {
  if (location.hash.includes("type=recovery")) {
    const params = new URLSearchParams(location.hash.slice(1));
    const token = params.get("access_token");
    if (token) {
      window.__recoveryToken = token;
      authPanel.classList.add("open");
      chatsPanel.classList.remove("open");
      profilePanel.classList.remove("open");
      hideAllAuthSubforms();
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

// ===== Разблокировка роли разработчика =====

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
  if (role !== "dev") return;
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

  const queueBtn = document.createElement("button");
  queueBtn.className = "chats-toggle";
  queueBtn.textContent = "очередь";
  queueBtn.addEventListener("click", showFeedbackQueue);
  panel.appendChild(queueBtn);

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
    await fetch(`${API_BASE}/dev/feedback`, {
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
  if (role === "assistant" && userRole === "dev") {
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
    addMessageToDOM("assistant", tr("greeting"));
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

  const limitKey = isLoggedIn() ? USER_LIMIT_KEY : GUEST_LIMIT_KEY;
  const dailyLimit = isLoggedIn() ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT;
  const usage = getDailyUsage(limitKey);
  if (usage.count >= dailyLimit) {
    addMessageToDOM(
      "assistant",
      isLoggedIn()
        ? `на сегодня лимит сообщений исчерпан (${USER_DAILY_LIMIT} в день) — общий бюджет ии на день небольшой, возвращайся завтра.`
        : `на сегодня гостевой лимит сообщений исчерпан (${GUEST_DAILY_LIMIT} в день). зарегистрируйся — с аккаунтом лимит выше (${USER_DAILY_LIMIT} в день).`
    );
    return;
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
  }
  incrementDailyUsage(limitKey);

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
    '<span class="typing-dots"><span></span><span></span><span></span></span>';

  typingEl.appendChild(typingLabel);
  typingEl.appendChild(typingBubble);
  chat.appendChild(typingEl);
  chat.scrollTop = chat.scrollHeight;

  setStatus(true);

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: authHeaders({ "Content-Type": "application/json" }),
      body: JSON.stringify({
        messages: c.messages.map((m) => ({ role: m.role, content: m.content })),
        disableFlair: looksLikeFlairOff(text),
      }),
    });

    if (!res.ok) {
      typingEl.remove();
      addMessageToDOM("assistant", `у меня тут что-то с соединением (код ${res.status}). попробуй ещё раз.`);
      return;
    }

    const data = await res.json();
    typingEl.remove();

    if (data.reply) {
      c.messages.push({ role: "assistant", content: data.reply });
      c.nextProactiveAt = Date.now() + randomGapMs();

      if (isLoggedIn()) {
        updateChatMeta(c.id, { nextProactiveAt: c.nextProactiveAt });
        await persistChatToServer(c, false);
      } else {
        saveStore(store);
      }
      addMessageToDOM("assistant", data.reply);
    } else {
      addMessageToDOM("assistant", "…что-то пошло не так, я задумалась.");
    }
  } catch (err) {
    typingEl.remove();
    addMessageToDOM("assistant", `у меня тут что-то с соединением: ${err && err.message ? err.message : err}. попробуй ещё раз.`);
  } finally {
    setStatus(false);
  }
}

async function checkProactive() {
  const c = getActiveChat();
  if (!c || c.proactiveOff) return;
  if (c.messages.length === 0) return;
  if (Date.now() < c.nextProactiveAt) return;

  setStatus(true);

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
  } finally {
    setStatus(false);
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

  let finalText = text;
  if (pendingQuote) {
    const quoted = pendingQuote
      .split("\n")
      .map((line) => "» " + line)
      .join("\n");
    finalText = `${quoted}\n\n${text}`;
  }
  clearQuote();

  sendMessage(finalText);
});

input.addEventListener("input", () => {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 120) + "px";
});

// ===== Действия над сообщением: копировать / ответить (с цитатой) =====
// Долгий тап по баблу целиком — меню для всего текста сообщения.
// Выделение куска текста внутри бабла — то же меню, но только для
// выделенного фрагмента (чтобы не копировать/цитировать лишнее).

let pendingQuote = null;

function setQuote(text) {
  pendingQuote = text;
  if (quotePreviewText) {
    quotePreviewText.textContent = text.length > 140 ? text.slice(0, 140) + "…" : text;
  }
  if (quotePreview) quotePreview.style.display = "flex";
  if (input) input.focus();
}

function clearQuote() {
  pendingQuote = null;
  if (quotePreview) quotePreview.style.display = "none";
}

if (quotePreviewClose) {
  quotePreviewClose.addEventListener("click", clearQuote);
}

let msgActionText = "";

function showMsgActionMenu(x, y, text) {
  if (!msgActionMenu || !text) return;
  msgActionText = text;
  msgActionMenu.style.display = "flex";
  const menuWidth = msgActionMenu.offsetWidth || 160;
  const clampedX = Math.max(8, Math.min(x, window.innerWidth - menuWidth - 8));
  const clampedY = Math.max(8, y);
  msgActionMenu.style.left = clampedX + "px";
  msgActionMenu.style.top = clampedY + "px";
}

function hideMsgActionMenu() {
  if (!msgActionMenu) return;
  msgActionMenu.style.display = "none";
  msgActionText = "";
}

if (msgActionCopy) {
  msgActionCopy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(msgActionText);
    } catch (err) {
      // буфер обмена недоступен — тихо промолчим
    }
    hideMsgActionMenu();
  });
}

if (msgActionReply) {
  msgActionReply.addEventListener("click", () => {
    setQuote(msgActionText);
    hideMsgActionMenu();
  });
}

document.addEventListener("click", (e) => {
  if (msgActionMenu && msgActionMenu.style.display !== "none" && !msgActionMenu.contains(e.target)) {
    hideMsgActionMenu();
  }
});

// Долгий тап (или долгое нажатие мышью) по баблу целиком
let pressTimer = null;
let pressStart = null;

chat.addEventListener("pointerdown", (e) => {
  const bubble = e.target.closest(".msg-bubble");
  if (!bubble) return;
  pressStart = { x: e.clientX, y: e.clientY };
  pressTimer = setTimeout(() => {
    pressTimer = null;
    showMsgActionMenu(e.clientX, Math.max(e.clientY - 56, 8), bubble.textContent);
  }, 450);
});

chat.addEventListener("pointermove", (e) => {
  if (!pressTimer || !pressStart) return;
  const dx = Math.abs(e.clientX - pressStart.x);
  const dy = Math.abs(e.clientY - pressStart.y);
  if (dx > 8 || dy > 8) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
});

chat.addEventListener("pointerup", () => {
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
});

chat.addEventListener("pointercancel", () => {
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
});

// Выделение фрагмента текста внутри бабла — показываем то же меню,
// но только для выделенного куска
document.addEventListener("selectionchange", () => {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return;

  const range = sel.getRangeAt(0);
  const anchorNode = range.commonAncestorContainer;
  const anchorEl = anchorNode.nodeType === 1 ? anchorNode : anchorNode.parentElement;
  const bubble = anchorEl ? anchorEl.closest(".msg-bubble") : null;
  if (!bubble) return;

  const text = sel.toString().trim();
  if (!text) return;

  const rect = range.getBoundingClientRect();
  if (!rect || (rect.width === 0 && rect.height === 0)) return;
  showMsgActionMenu(rect.left, Math.max(rect.top - 52, 8), text);
});

// ===== Приветствие / выбор языка для новых гостей =====

const LANG_CHOSEN_KEY = "yari_lang_chosen";

function showLanguageWelcomeIfNeeded() {
  if (isLoggedIn()) return;
  if (localStorage.getItem(LANG_CHOSEN_KEY)) return;
  const c = getActiveChat();
  if (c && c.messages.length > 0) return; // уже не новый юзер

  const overlay = document.createElement("div");
  overlay.id = "langWelcomeOverlay";
  overlay.style.cssText =
    "position:fixed;inset:0;background:rgba(0,0,0,0.75);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;";

  const card = document.createElement("div");
  card.style.cssText =
    "background:#1d1620;border:1px solid #362a37;border-radius:16px;padding:32px 24px;max-width:360px;width:100%;text-align:center;color:#f4eef2;font-family:inherit;";

  const title = document.createElement("div");
  title.style.cssText =
    "font-family:'Fraunces',serif;font-style:italic;font-weight:600;font-size:24px;margin-bottom:8px;color:#f4eef2;";
  title.textContent = "Yari";

  const text = document.createElement("div");
  text.style.cssText = "font-size:15px;line-height:1.5;margin-bottom:24px;color:#9a8b98;";
  text.innerHTML = "Welcome! Choose your language.<br>Добро пожаловать! Выберите язык.";

  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:12px;justify-content:center;";

  function chooseLang(lang) {
    localStorage.setItem(LANG_CHOSEN_KEY, "1");
    localStorage.setItem("yari_lang", lang);
    overlay.remove();
    applyLanguage();
    renderMessages();
  }

  const ruBtn = document.createElement("button");
  ruBtn.textContent = "Русский";
  ruBtn.style.cssText =
    "flex:1;padding:12px;border-radius:10px;border:none;background:linear-gradient(135deg,#f3a6bd,#b9a6e8);color:#110d13;font-weight:600;cursor:pointer;";
  ruBtn.addEventListener("click", () => chooseLang("ru"));

  const enBtn = document.createElement("button");
  enBtn.textContent = "English";
  enBtn.style.cssText =
    "flex:1;padding:12px;border-radius:10px;border:1px solid #b9a6e8;background:transparent;color:#f4eef2;font-weight:600;cursor:pointer;";
  enBtn.addEventListener("click", () => chooseLang("en"));

  btnRow.appendChild(ruBtn);
  btnRow.appendChild(enBtn);
  card.appendChild(title);
  card.appendChild(text);
  card.appendChild(btnRow);
  overlay.appendChild(card);
  document.body.appendChild(overlay);
}

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
  renderProfileIdentity();

  // ВАЖНО: раньше здесь стояло "if (c) {...}", но переменная c нигде не
  // была объявлена в этой области видимости — это кидало ReferenceError
  // и обрывало весь init() на этой строке. Из-за этого renderChatsPanel()
  // и renderMessages() ниже вообще не вызывались после reload/логаута —
  // именно поэтому казалось, что диалоги "слетают" при обновлении
  // страницы (на самом деле данные были целы, просто не отрисовывались).
  const activeChat = getActiveChat();
  if (activeChat) {
    activeChat.lastVisit = Date.now();
    if (isLoggedIn()) updateChatMeta(activeChat.id, { lastVisit: activeChat.lastVisit });
    else saveStore(store);
  }

  renderChatsPanel();
  renderMessages();
  checkProactive();
  renderRolePanel();
  applyLanguage();
  showLanguageWelcomeIfNeeded();
})();
