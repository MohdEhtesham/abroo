import { useCallback, useRef } from 'react';

/**
 * Returns a stable callback that ignores invocations while the previous one
 * is still within the cooldown window. Use this on navigation triggers and
 * one-shot actions to prevent multi-tap bugs (double-pushed screens, dup form
 * submissions, etc).
 *
 * Example:
 *   const goDetail = useThrottledCallback((id: string) => {
 *     navigation.navigate('Detail', { id });
 *   }, 600);
 */
export function useThrottledCallback<T extends (...args: any[]) => void>(
  fn: T,
  cooldownMs = 600,
): T {
  const lastFiredRef = useRef(0);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback(
    ((...args: any[]) => {
      const now = Date.now();
      if (now - lastFiredRef.current < cooldownMs) return;
      lastFiredRef.current = now;
      fnRef.current(...args);
    }) as T,
    [cooldownMs],
  );
}
