import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/env';

let authToken: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

/**
 * Register a callback that fires when the server returns 401. Wire this in
 * App.tsx after the store is created so we can dispatch logoutThunk and clear
 * the persisted auth automatically — without coupling apiClient to redux.
 */
export const setOnUnauthorized = (cb: (() => void) | null) => {
  onUnauthorized = cb;
};

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authToken) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${authToken}`;
  }
  return config;
});

// ---- Error normalization ----------------------------------------------------

export interface ApiError {
  status: number | null;
  /** Human-readable message safe to surface to the user. */
  message: string;
  /** Internal kind for code branching. */
  kind: 'network' | 'timeout' | 'server' | 'auth' | 'unknown';
  /** Original axios error, only for dev logging — never surface. */
  raw?: unknown;
}

function normalizeError(err: unknown): ApiError {
  if (!axios.isAxiosError(err)) {
    return { status: null, message: 'Unexpected error', kind: 'unknown', raw: err };
  }

  const ax = err as AxiosError<{ message?: string }>;
  const status = ax.response?.status ?? null;

  if (ax.code === 'ECONNABORTED' || /timeout/i.test(ax.message)) {
    return {
      status,
      message: 'Request timed out. Please try again.',
      kind: 'timeout',
      raw: ax,
    };
  }
  if (!ax.response) {
    return {
      status: null,
      message: 'No internet connection. Please check your network.',
      kind: 'network',
      raw: ax,
    };
  }
  if (status === 401) {
    return {
      status,
      message: ax.response?.data?.message ?? 'Session expired. Please log in again.',
      kind: 'auth',
      raw: ax,
    };
  }
  if (status && status >= 500) {
    return {
      status,
      message: 'Server is busy. Please try again in a moment.',
      kind: 'server',
      raw: ax,
    };
  }
  return {
    status,
    message: ax.response?.data?.message ?? ax.message ?? 'Something went wrong',
    kind: 'unknown',
    raw: ax,
  };
}

// ---- Retry on transient failures -------------------------------------------

const RETRYABLE_KINDS = new Set<ApiError['kind']>(['network', 'timeout', 'server']);
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 600;
const RETRYABLE_METHODS = new Set(['get', 'head', 'options']);

interface RequestConfigWithRetry extends AxiosRequestConfig {
  __retryCount?: number;
  /** Skip retry for this specific call. */
  noRetry?: boolean;
}

apiClient.interceptors.response.use(
  res => res,
  async (err: AxiosError) => {
    const config = (err.config ?? {}) as RequestConfigWithRetry;
    const normalized = normalizeError(err);

    // Auth: notify the app once so it can drop persisted state + redirect to login.
    if (normalized.kind === 'auth') {
      onUnauthorized?.();
      return Promise.reject(normalized);
    }

    const method = (config.method ?? 'get').toLowerCase();
    const canRetry =
      !config.noRetry &&
      RETRYABLE_METHODS.has(method) &&
      RETRYABLE_KINDS.has(normalized.kind) &&
      (config.__retryCount ?? 0) < MAX_RETRIES;

    if (canRetry) {
      config.__retryCount = (config.__retryCount ?? 0) + 1;
      const wait = RETRY_BASE_MS * Math.pow(2, config.__retryCount - 1);
      await new Promise<void>(r => setTimeout(r, wait));
      return apiClient.request(config);
    }

    return Promise.reject(normalized);
  },
);

// ---- Convenience helpers ----------------------------------------------------

export type ApiEnvelope<T> = { success: boolean; data: T; message?: string };

const unwrap = <T>(p: Promise<{ data: ApiEnvelope<T> }>) => p.then(r => r.data.data);

export const apiGet = <T>(url: string, config?: AxiosRequestConfig) =>
  unwrap<T>(apiClient.get(url, config));

export const apiPost = <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
  unwrap<T>(apiClient.post(url, body, config));

export const apiPut = <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
  unwrap<T>(apiClient.put(url, body, config));

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig) =>
  unwrap<T>(apiClient.delete(url, config));

/**
 * Make a request that's automatically aborted if the caller's signal fires.
 * Use with useEffect cleanup to cancel inflight requests on unmount.
 *
 * Example:
 *   useEffect(() => {
 *     const ctrl = new AbortController();
 *     apiGet<Foo>('/foo', { signal: ctrl.signal }).then(setFoo).catch(() => {});
 *     return () => ctrl.abort();
 *   }, []);
 */
