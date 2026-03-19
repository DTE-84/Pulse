import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';
const API = axios.create({
    baseURL: API_BASE_URL,
});
// Add auth token to requests
API.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
const novaAPI = axios.create({
    baseURL: API_BASE_URL,
});
export const authAPI = {
    login: (data) => API.post('/api/auth/login', data),
    signup: (data) => API.post('/api/auth/signup', data),
    me: () => API.get('/api/auth/me'),
    updateProfile: (data) => API.patch('/api/auth/update', data),
};
export const transactionsAPI = {
    getAll: (params) => API.get('/api/finance/transactions', { params }),
    uploadReceipt: (formData) => API.post('/api/finance/upload-receipt', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};
export const accountsAPI = {
    getAll: () => API.get('/api/finance/accounts'),
    getBalances: () => API.get('/api/finance/balances'),
};
export const statsAPI = {
    get: () => API.get('/api/stats'),
};
export const plaidAPI = {
    createLinkToken: () => API.post('/api/plaid/create-link-token'),
    exchangeToken: (data) => API.post('/api/plaid/exchange-token', data),
    getLinkedBanks: () => API.get('/api/plaid/banks'),
    unlinkBank: (itemId) => API.delete(`/api/plaid/banks/${itemId}`),
};
export const stripeAPI = {
    createCheckout: () => API.post('/api/stripe/create-checkout'),
    createPortal: () => API.post('/api/stripe/create-portal'),
    subscriptionStatus: () => API.get('/api/stripe/status'),
};
export const novaServiceAPI = {
    chat: (message, context) => API.post('/api/nova/chat', { message, context }),
    getInsights: () => API.get('/api/nova/insights'),
};
export { API, novaAPI };
