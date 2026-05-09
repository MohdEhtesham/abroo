import axios, { AxiosError } from 'axios';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'https://backenddeploy-e010.onrender.com';

const TOKEN_KEY = 'aabroo_admin_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t: string | null) => {
  if (t) localStorage.setItem(TOKEN_KEY, t);
  else localStorage.removeItem(TOKEN_KEY);
};

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 45000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use(config => {
  const t = getToken();
  if (t) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${t}`;
  }
  return config;
});

api.interceptors.response.use(
  res => res,
  (err: AxiosError) => {
    if (err.response?.status === 401) {
      setToken(null);
      // Force a hard reload to bring the user back to /login.
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);

// Friendly error message extractor — same idea as the mobile getErrorMessage.
export const errMsg = (err: unknown, fallback = 'Something went wrong'): string => {
  const e = err as AxiosError<{ message?: string; error?: string }>;
  const server = e?.response?.data?.message ?? e?.response?.data?.error;
  if (typeof server === 'string' && server.trim()) return server;
  if (e?.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (e?.message && e.message !== 'Network Error') return e.message;
  if (e?.message === 'Network Error') return 'No internet connection. Please check your network.';
  return fallback;
};

// Shared envelope unwrapping ({ success, data }) so callers get plain payloads.
type Envelope<T> = { success: boolean; data: T; message?: string };
export const apiGet = <T>(url: string, params?: Record<string, unknown>) =>
  api.get<Envelope<T>>(url, { params }).then(r => r.data.data);
export const apiPost = <T>(url: string, body?: unknown) =>
  api.post<Envelope<T>>(url, body).then(r => r.data.data);
export const apiPut = <T>(url: string, body?: unknown) =>
  api.put<Envelope<T>>(url, body).then(r => r.data.data);
export const apiDelete = <T>(url: string) =>
  api.delete<Envelope<T>>(url).then(r => r.data.data);

// Domain types — mirror the backend toPublic() shapes loosely.
export interface PageResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
