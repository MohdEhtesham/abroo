import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value`. Useful for search inputs where we
 * don't want to fire an API call on every keystroke.
 *
 * Example:
 *   const debounced = useDebouncedValue(query, 300);
 *   useEffect(() => { search(debounced); }, [debounced]);
 */
export function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
