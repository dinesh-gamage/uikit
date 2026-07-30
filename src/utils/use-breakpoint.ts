import { useSyncExternalStore } from 'react';

/**
 * SSR-safe media query hook. Returns `true` when the viewport matches
 * `(max-width: ${maxWidthPx}px)`.
 *
 * Backed by `useSyncExternalStore` so that on a client mount (including client-side route changes)
 * the value is read from `matchMedia` synchronously on the first render — no `false`-then-`true`
 * flip, so a responsive branch (e.g. ListView's desktop table vs. mobile cards) never paints the
 * wrong layout for a frame. During SSR and the hydration pass the server snapshot is `false`, so the
 * hydrated markup still matches the server; React reconciles to the real value right after hydration
 * without a mismatch warning.
 */
export function useBreakpoint(maxWidthPx: number): boolean {
  const query = `(max-width: ${maxWidthPx}px)`;

  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () =>
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia(query).matches
        : false,
    () => false,
  );
}
