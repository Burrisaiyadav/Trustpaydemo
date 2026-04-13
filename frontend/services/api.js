// ══════════════════════════════════════════════════════
//  TRUSTPAY FRONTEND API CLIENT
//  Supports both Real Backend and MOCK_MODE for local testing
// ══════════════════════════════════════════════════════

import { TrustpayDB, TrustpayComputed, TrustpayAI } from '../data/TrustpayData.js';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const MOCK_MODE = false; // Connect to backend, but hybrid fallback if it fails

// ── TOKEN MANAGEMENT ──
const TOKEN_KEY = 'trustpay_token';

const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
const getToken = () => localStorage.getItem(TOKEN_KEY);
const clearToken = () => localStorage.removeItem(TOKEN_KEY);

// ── MOCK HANDLER ──
const mockHandler = async (method, path, data) => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Network delay simulation

  if (path === '/auth/me' || path === '/users/me') {
    let localUserStr = localStorage.getItem('tp_user');
    let localUser = {};
    try { if (localUserStr) localUser = JSON.parse(localUserStr); } catch(e) {}

    if (method === 'PUT') {
      const updatedLocalUser = { ...localUser, ...data };
      localStorage.setItem('tp_user', JSON.stringify(updatedLocalUser));
      return { success: true, user: { ...TrustpayDB.currentUser, ...updatedLocalUser }, policy: TrustpayComputed.currentPlan() };
    } else {
      const mergedUser = { ...TrustpayDB.currentUser, ...localUser };
      return { user: mergedUser, policy: TrustpayComputed.currentPlan() };
    }
  }
  if (path === '/claims/stats') {
    return {
      thisWeekEarnings: TrustpayComputed.thisWeekEarnings(),
      thisWeekProtected: TrustpayComputed.thisWeekProtected(),
      totalPaid: TrustpayComputed.totalClaimsReturned(),
      claimSuccessRate: TrustpayComputed.claimSuccessRate(),
      totalClaims: TrustpayDB.claims.length,
      recentClaims: TrustpayDB.claims.slice(0, 5),
    };
  }
  if (path === '/ai/earnings-forecast') {
    return { forecast: TrustpayAI.getEarningsForecast() };
  }
  if (path === '/ai/insights') {
    return TrustpayAI.getDashboardInsight();
  }
  if (path.startsWith('/claims/history')) {
    return { claims: TrustpayDB.claims };
  }
  if (path === '/policies/my-policy' || path === '/policies/plans') { // handled properly later maybe, but my-policy specifically
    if (path === '/policies/plans') return { plans: TrustpayDB.plans };
    return { policy: TrustpayComputed.currentPlan() };
  }
  if (path === '/location' || path === '/location/update-live') {
    return { success: true };
  }
  if (path === '/users/login' || path === '/auth/signup' || path === '/users/register') {
    let localUserStr = localStorage.getItem('tp_user');
    let localUser = {};
    try { if (localUserStr) localUser = JSON.parse(localUserStr); } catch(e) {}
    const mergedUser = { ...TrustpayDB.currentUser, ...localUser };
    return { token: 'mock_token_123', user: mergedUser };
  }
  if (path.startsWith('/admin/metrics')) {
    return TrustpayDB.adminMetrics;
  }
  if (path.startsWith('/fraud')) {
    return { cases: TrustpayDB.fraudCases || [] };
  }
  
  console.warn(`[MOCK API] Unmocked endpoint hit: ${method} ${path}`);
  return { success: true, message: "Mock response" };
};

// ── CORE REQUEST (HYBRID CONNECT) ──
const request = async (method, path, data = null) => {
  if (MOCK_MODE) {
    console.log(`[MOCK API] ${method} ${path}`);
    return mockHandler(method, path, data);
  }

  // Path mapping for Java Backend routes vs Frontend
  let apiPath = path;
  if (path === '/users/login') apiPath = '/auth/login';
  if (path === '/users/register' || path === '/auth/signup') apiPath = '/auth/register';

  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const requestBody = data ? { ...data } : null;
  if (requestBody && requestBody.identifier) {
      requestBody.username = requestBody.identifier; // map identifier for AuthRequest
  }
  if (requestBody && requestBody.fullName && apiPath === '/auth/register') {
      requestBody.username = requestBody.fullName; 
  }

  const options = { method, headers };
  
  if (data instanceof FormData) {
    // For FormData, Browser sets boundary automatically, so remove Content-Type header
    delete headers['Content-Type'];
    options.body = data;
  } else if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE}${apiPath}`, options);

    // Handle 401: clear token and redirect to auth
    if (response.status === 401) {
      clearToken();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      throw new Error('Session expired.');
    }

    if (!response.ok) {
       throw new Error(`Real backend HTTP ${response.status}`);
    }

    const text = await response.text();
    // Some backend paths return empty responses
    if (!text) return { success: true };
    return JSON.parse(text);
  } catch (err) {
    console.warn(`[HYBRID MODE] Backend connection failed for ${apiPath}: ${err.message}. Seamlessly falling back to Mock Data.`);
    return mockHandler(method, path, data);
  }
};

// ══════════════════════════════════════════════════════
//  API METHODS
// ══════════════════════════════════════════════════════
const api = {
  // Token helpers
  setToken,
  getToken,
  clearToken,
  isAuthenticated: () => !!getToken(),
  request,

  // ── AUTH ──
  register: (data) => request('POST', '/users/register', data),
  login: (data) => request('POST', '/users/login', data),
  signup: (data) => request('POST', '/auth/signup', data),
  getMe: () => request('GET', '/auth/me'),
  updateProfile: (data) => request('PUT', '/auth/me', data),
  logout: async () => {
    try { await request('POST', '/auth/logout'); } catch (_) { }
    clearToken();
  },
  submitProof: (formData) => request('POST', '/auth/submit-proof', formData),

  // ── PLATFORM CONNECTION (NEW) ──
  sendPlatformOTP: (platform, phone) => request('POST', '/login/platform/send-otp', { platform, phone }),
  verifyPlatformOTP: (platform, phone, otp) => request('POST', '/login/platform/verify-otp', { platform, phone, otp }),

  // ── POLICIES ──
  getPlans: () => request('GET', '/policies/plans'),
  activatePlan: (planType, upiID) => request('POST', '/policies/activate', { planType, upiID }),
  confirmPayment: (data) => request('POST', '/policies/payment-success', data),
  getMyPolicy: () => request('GET', '/policies/my-policy'),
  cancelPolicy: () => request('POST', '/policies/cancel'),
  getAdminPending: () => request('GET', '/admin/pending-verifications'),
  verifyUser: (userId, approve, reason) => request('POST', `/admin/verify-user/${userId}?approve=${approve}${reason ? `&reason=${reason}` : ''}`),

  // ── CLAIMS ──
  initiateClaim: (data) => request('POST', '/claims/initiate', data),
  confirmClaim: (claimID) => request('POST', '/claims/confirm', { claimID }),
  getClaimHistory: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/claims/history${qs ? '?' + qs : ''}`);
  },
  getClaimStats: () => request('GET', '/claims/stats'),
  getClaim: (claimID) => request('GET', `/claims/${claimID}`),

  // ── WEATHER ──
  getWeather: (lat, lng) => request('GET', `/weather/current?lat=${lat}&lng=${lng}`),
  getWeatherForecast: (lat, lng) => request('GET', `/weather/forecast?lat=${lat}&lng=${lng}`),
  getWeatherRiskTimeline: (zone) => request('GET', `/weather/risk-timeline?zone=${encodeURIComponent(zone)}`),

  // ── LOCATION ──
  verifyLocation: (lat, lng, accuracy) => request('POST', '/location/verify', { lat, lng, accuracy }),
  updateLiveLocation: (lat, lng, claimID) => request('POST', '/location/update-live', { lat, lng, claimID }),

  // ── AI ──
  getInsights: () => request('GET', '/ai/insights'),
  getEarningsForecast: () => request('GET', '/ai/earnings-forecast'),
  runPrediction: (data) => request('POST', '/ai/predict', data),

  // ── PAYMENTS ──
  createPaymentOrder: (planType) => request('POST', '/payments/create-order', { planType }),
  verifyPaymentSignature: (data) => request('POST', '/payments/verify-signature', data),

  // ── ADMIN ──
  getAdminMetrics: () => request('GET', '/admin/metrics'),
  getAdminClaims: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request('GET', `/admin/claims${qs ? '?' + qs : ''}`);
  },
  getAdminUsers: (params = {}) => request('GET', `/admin/users?${new URLSearchParams(params)}`),

  // ── PRODUCTION UPGRADE APIs ──
  getLiveDisruptions: () => request('GET', '/disruptions/live'),
  getWorkerZone: (lat, lng) => request('POST', '/worker/zone', { lat, lng }),
  checkTrigger: (workerID, zoneID) => request('POST', '/trigger/check', { workerID, zoneID }),
  evaluateClaim: (data) => request('POST', '/claim/evaluate', data),
  createClaim: (data) => request('POST', '/claim/create', data),
  processPayout: (claimID, amount) => request('POST', '/payout/process', { claimID, amount }),
  calculatePremium: (plan, features) => request('POST', '/premium/calculate', { plan, features }),

  // ── SIMULATION TOOLS ──
  simulateRain: () => request('POST', '/simulate/rain'),
  simulateAQI: () => request('POST', '/simulate/aqi'),

  getFraudCases: (status) => request('GET', `/fraud${status ? `?status=${status}` : ''}`),
  updateFraudCase: (caseID, action) => request('POST', `/fraud/${caseID}/action`, { action }),
};

export default api;

// ══════════════════════════════════════════════════════
//  NAMED EXPORTS — backward compat with existing imports
// ══════════════════════════════════════════════════════
export const fetchUserData = async () => {
  const res = await api.getMe();
  return { ...res.user, policy: res.policy };
};

export const fetchWeeklyEarnings = async () => {
  const res = await api.getClaimStats();
  return { weeklyEarnings: res.thisWeekEarnings || 0, weeklyProtected: res.thisWeekProtected || 0 };
};

export const fetchClaimsHistory = async () => {
  const res = await api.getClaimHistory({ limit: 20 });
  return res.claims || [];
};

export const fetchActivePolicy = async () => {
  const res = await api.getMyPolicy();
  return res.policy;
};

export const updateUserSettings = async (userId, data) => {
  return api.updateProfile(data);
};
