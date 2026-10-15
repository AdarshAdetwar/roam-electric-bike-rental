import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const baseURL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('roam.token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const authApi = {
  login: async (body) => (await api.post('/auth/login', body)).data,
  register: async (body) => (await api.post('/auth/register', body)).data,
  forgotPassword: async (body) => (await api.post('/auth/forgot-password', body)).data,
  resetPassword: async (body) => (await api.post('/auth/reset-password', body)).data
};

export const profileApi = {
  get: async () => (await api.get('/profile')).data
};

export const assetApi = {
  list: async () => (await api.get('/assets')).data,
  get: async (id) => (await api.get(`/assets/${id}`)).data
};

export const rentalApi = {
  active: async () => (await api.get('/rentals/active')).data,
  history: async () => (await api.get('/rentals/history')).data,
  start: async (motorbikeId) => (await api.post('/rentals', { motorbikeId })).data,
  end: async (id) => (await api.patch(`/rentals/${id}/end`)).data
};

export const issueApi = {
  report: async (body) => (await api.post('/issues', body)).data
};
