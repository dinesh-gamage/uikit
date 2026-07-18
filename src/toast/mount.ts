import { createRoot } from 'react-dom/client';
import type { ReactElement } from 'react';

const mounted = new Set<string>();

/**
 * Lazily mount a singleton host component in its own container on document.body.
 * Subsequent calls with the same id are no-ops, as is any call during SSR.
 */
export function mountSingleton(id: string, element: ReactElement): void {
  if (typeof document === 'undefined') return;
  if (mounted.has(id)) return;
  mounted.add(id);
  const container = document.createElement('div');
  container.setAttribute('data-uikit-root', id);
  document.body.appendChild(container);
  createRoot(container).render(element);
}
