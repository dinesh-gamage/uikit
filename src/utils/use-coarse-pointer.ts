import { useEffect, useState } from 'react';

/**
 * SSR-safe hook: `true` on touch / non-hover pointers (phones, tablets). Uses
 * `(hover: none), (pointer: coarse)`. Always `false` during SSR and the initial client render
 * (so hydration matches), then the real value is applied on mount. Used to suppress hover-only
 * affordances like tooltips on touch devices.
 */
export function useCoarsePointer(): boolean {
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia('(hover: none), (pointer: coarse)');
    const onChange = () => setCoarse(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return coarse;
}
