import type { ApiError } from '../services/apiClient';

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null;

const isApiError = (v: unknown): v is ApiError =>
  isObj(v) &&
  typeof (v as any).message === 'string' &&
  typeof (v as any).kind === 'string' &&
  ['network', 'timeout', 'server', 'auth', 'unknown'].includes((v as any).kind);

/**
 * Pull a human-readable, user-safe message out of whatever shape the error
 * landed in (ApiError from our axios pipeline, raw axios error, plain Error,
 * a thrown string, etc.).
 *
 * Use everywhere a thunk catches an error or a screen wants to surface one.
 * Never just hand the user `'Login failed'` — let the actual server reason
 * (e.g. "Phone already registered", "Listing quota exceeded — upgrade your
 * plan") through, with a graceful fallback only when nothing better exists.
 */
export const getErrorMessage = (err: unknown, fallback = 'Something went wrong'): string => {
  if (!err) return fallback;

  // Already normalized by apiClient.
  if (isApiError(err)) return err.message || fallback;

  // Raw axios error: { response: { data: { message } } } — prefer server text.
  if (isObj(err)) {
    const e = err as any;
    const serverMsg = e.response?.data?.message ?? e.response?.data?.error;
    if (typeof serverMsg === 'string' && serverMsg.trim()) return serverMsg;
    if (typeof e.message === 'string' && e.message.trim() && e.message !== 'Network Error') {
      return e.message;
    }
  }

  if (typeof err === 'string' && err.trim()) return err;

  return fallback;
};
