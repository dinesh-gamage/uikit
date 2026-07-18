import { useEffect, useState } from 'react';

/**
 * SSR-safe media query hook. Returns `true` once the viewport matches
 * `(max-width: ${maxWidthPx}px)`. Always `false` during SSR and on the initial client render
 * (before effects run), so the hydrated markup matches the server-rendered markup; the real value
 * is applied on mount and kept in sync via `matchMedia`'s `change` event.
 */
export function useBreakpoint(maxWidthPx: number): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(`(max-width: ${maxWidthPx}px)`);
    const onChange = () => setMatches(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [maxWidthPx]);

  return matches;
}
