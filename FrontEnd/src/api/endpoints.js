//   السيرفرات المتاحة
const SERVERS = {
    SEIF: 'https://uncompetently-indefeasible-alfredo.ngrok-free.dev',
    SALMA: 'https://diaphysial-solenoidally-rosalyn.ngrok-free.dev'
};

//  تحديد السيرفر 
// export const BASE_URL = SERVERS.SEIF; 
export const BASE_URL = SERVERS.SALMA; 

// Endpoints 
export const API_ENDPOINTS = {
    
    // Auth
    REGISTER: `${BASE_URL}/api/Auth/register`,
    LOGIN: `${BASE_URL}/api/Auth/login`,
    FORGOT_PASSWORD: `${BASE_URL}/api/Auth/forgot-password`,
    RESET_PASSWORD: `${BASE_URL}/api/Auth/reset-password`,

    // Google and Facebook
    GOOGLE_LOGIN: `${BASE_URL}/api/Auth/google`,
    FACEBOOK_LOGIN: `${BASE_URL}/api/Auth/facebook`,

    // Profile
    GET_PROFILE: `${BASE_URL}/api/User/profile`,
    UPDATE_PROFILE: `${BASE_URL}/api/User/profile`,
    CHANGE_PASSWORD: `${BASE_URL}/api/Auth/change-password`,

    // Articles Page 
    GET_ARTICLES: `${BASE_URL}/articles/api`,

    // Admin Dashboards
    
    // 1. Home Dashboard
    DASHBOARD_SUMMARY: `${BASE_URL}/api/admin/home-summary`, 
    
    // 2. Products Dashboard
    PRODUCTS: `${BASE_URL}/api/admin/products`, 
    PRODUCT_BY_ID: (id) => `${BASE_URL}/api/admin/products/${id}`,

    // 3. User Activity Dashboard
    USER_ACTIVITIES: `${BASE_URL}/api/admin/user-activities`,

    // 4. Orders Dashboard
    ORDERS: `${BASE_URL}/api/admin/orders/`,
    
};