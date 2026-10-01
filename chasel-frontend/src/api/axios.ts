import axios from 'axios';

const apiBaseUrl =
  import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: apiBaseUrl,
});

// Authentication is intentionally memory-only. A fresh load of the app starts
// as a guest, so another checkout on localhost can never inherit an account.
let activeToken: string | null = null;

export const setApiToken = (token: string | null) => {
  activeToken = token;
};

// Automatically attach the token to every request, if one exists
api.interceptors.request.use((config) => {
  if (activeToken) {
    config.headers.Authorization = `Bearer ${activeToken}`;
  }
  return config;
});

export default api;
