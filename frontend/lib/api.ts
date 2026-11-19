import axios from 'axios';
import Cookies from 'js-cookie';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = Cookies.get('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Code HTTP et message « detail » d'une erreur d'appel API
export function apiError(e: unknown): { status?: number; detail?: string } {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { detail?: string } | undefined;
    return { status: e.response?.status, detail: data?.detail };
  }
  return {};
}

// Un seul rafraîchissement en cours, partagé par les requêtes en échec simultanées
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refresh = Cookies.get('admin_refresh');
  if (!refresh) return null;
  try {
    const res = await axios.post(`${API_URL}/auth/refresh/`, { refresh });
    Cookies.set('admin_token', res.data.access, { expires: 1 / 48, sameSite: 'lax' });
    return res.data.access;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/admin') && path !== '/admin/login') {
        // Tenter une fois de renouveler le token avant de déconnecter
        if (original && !original._retry) {
          original._retry = true;
          refreshing = refreshing || refreshAccessToken().finally(() => { refreshing = null; });
          const token = await refreshing;
          if (token) {
            original.headers.Authorization = `Bearer ${token}`;
            return api(original);
          }
        }
        Cookies.remove('admin_token');
        Cookies.remove('admin_refresh');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(err);
  }
);