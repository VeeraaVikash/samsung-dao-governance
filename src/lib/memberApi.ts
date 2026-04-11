import axios from 'axios';
import { useAuthStore } from '@/stores/useAuthStore';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3001/api/v1';

export const memberApi = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

memberApi.interceptors.request.use(async (config) => {
  const token = await useAuthStore.getState().freshToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
