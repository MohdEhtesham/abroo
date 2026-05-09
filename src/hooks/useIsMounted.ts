import { useCallback, useEffect, useRef } from 'react';

/**
 * Returns a stable function `isMounted()` that reports whether the component
 * is still in the tree. Use to gate setState calls inside async tasks so we
 * never call setState after unmount (a frequent crash + memory-leak warning).
 *
 * Example:
 *   const isMounted = useIsMounted();
 *   useEffect(() => {
 *     fetchUser().then(u => { if (isMounted()) setUser(u); });
 *   }, [isMounted]);
 */
export function useIsMounted() {
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return useCallback(() => mountedRef.current, []);
}
