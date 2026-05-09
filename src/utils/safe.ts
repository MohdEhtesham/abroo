/**
 * Defensive helpers for tightening service contracts.
 *
 * Real APIs occasionally return null, undefined, or non-array data when callers
 * expect an array. These helpers guarantee the shape and prevent ".map of
 * undefined" crashes deep in render code.
 */

/** Always returns an array. If `value` isn't one, returns []. */
export function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

/** Returns the value if non-nullish, else the fallback. */
export function safeValue<T>(value: T | null | undefined, fallback: T): T {
  return value == null ? fallback : value;
}

/** Returns `null` instead of throwing on a malformed response. */
export async function safeAsync<T>(p: Promise<T>): Promise<T | null> {
  try {
    return await p;
  } catch {
    return null;
  }
}
