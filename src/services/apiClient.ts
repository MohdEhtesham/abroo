import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { API_BASE_URL, API_TIMEOUT_MS } from '../config/env';

let authToken: string | null = null;

export const setAuthToken = (token: string | null) => {
  authToken = token;
};

export const getAuthToken = () => authToken;

export const apiClient: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: API_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(config => {
  if (authToken) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${authToken}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  res => res,
  err => {
    const status = err?.response?.status;
    const message = err?.response?.data?.message ?? err?.message ?? 'Network error';
    return Promise.reject({ status, message, raw: err });
  },
);

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
