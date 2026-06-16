// ================= SERVERS =================
const SERVERS = {
  SEIF: "https://uncompetently-indefeasible-alfredo.ngrok-free.dev",
  SALMA: "https://diaphysial-solenoidally-rosalyn.ngrok-free.dev",
  Published: "https://greenmind.runasp.net",
};

// ================= BASE URL =================
export const BASE_URL = SERVERS.Published;

// ================= API ENDPOINTS =================
export const API_ENDPOINTS = {
  // ---------- AUTH ----------
  REGISTER: `${BASE_URL}/api/Auth/register`,
  LOGIN: `${BASE_URL}/api/Auth/login`,
  FORGOT_PASSWORD: `${BASE_URL}/api/Auth/forgot-password`,
  RESET_PASSWORD: `${BASE_URL}/api/Auth/reset-password`,
  CHANGE_PASSWORD: `${BASE_URL}/api/Auth/change-password`,

  // ---------- SOCIAL LOGIN ----------
  GOOGLE_LOGIN: `${BASE_URL}/api/Auth/google`,
  FACEBOOK_LOGIN: `${BASE_URL}/api/Auth/facebook`,

  // ---------- PROFILE ----------
  GET_PROFILE: `${BASE_URL}/api/User/profile`,
  UPDATE_PROFILE: `${BASE_URL}/api/User/profile`,

  // ---------- ARTICLES ----------
  GET_ARTICLES: `${BASE_URL}/articles/api`,

  // ---------- AI ----------
  CROP_RECOMMENDATION: `${BASE_URL}/api/AI/recommend-crop`,
  FERTILIZER_RECOMMENDATION: `${BASE_URL}/api/AI/recommend-fertilizer`,
  DETECT_DISEASE: `${BASE_URL}/api/AI/detect-disease`,

  DETECT_HISTORY: (type) => `${BASE_URL}/api/AI/user-ai-history/${type}`,

  // ---------- CHATBOT ----------
  CHAT_SEND: `${BASE_URL}/chat/send`,

  CHAT_MESSAGES: (sessionId) => `${BASE_URL}/chat/messages/${sessionId}`,

  CHAT_HISTORY: (userId) => `${BASE_URL}/chat/history/${userId}`,

  CHAT_NEW: `${BASE_URL}/chat/new`,

  CHAT_GENERATE_TITLE: (sessionId) =>
    `${BASE_URL}/chat/generate-title/${sessionId}`,

  // ---------- HISTORY ----------
  HISTORY: `${BASE_URL}/api/History`,

  // ---------- REVIEWS ----------
  REVIEWS: `${BASE_URL}/api/Reviews`,

  // ---------- ADMIN ----------
  DASHBOARD_SUMMARY: `${BASE_URL}/api/admin/home-summary`,

  PRODUCTS: `${BASE_URL}/api/admin/products`,
  PRODUCT_BY_ID: (id) => `${BASE_URL}/api/admin/products/${id}`,

  USER_ACTIVITIES: `${BASE_URL}/api/admin/user-activities`,
  ORDERS: `${BASE_URL}/api/admin/orders/`,
};
