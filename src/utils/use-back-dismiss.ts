import { useEffect, useRef } from 'react';

/**
 * Makes an open overlay own one browser history entry, so the Back button (or an
 * Android WebView's hardware back, which maps to browser back) dismisses the overlay
 * instead of navigating the page away.
 *
 * While `open` is true the hook pushes a marker history entry; pressing Back fires
 * `popstate`, which calls `onClose`. A programmatic close (X / backdrop / Escape flips
 * `open` to false) steps history back to remove the entry the hook added, so history
 * and UI stay in lockstep.
 *
 * A module-level LIFO registry coordinates nested overlays: a single `popstate` only
 * closes the top-most overlay, leaving the ones beneath it open. `window.history.state`
 * is merged (not replaced) on push so a host router's own history state survives.
 *
 * ponytail: assumes overlays close top-down (the common case). Programmatically closing
 * a lower overlay while a higher one is still open pops the wrong browser entry — upgrade
 * to per-entry index tracking only if that pattern actually appears.
 */

interface Entry {
  id: string;
  close: () => void;
  /** Set by the popstate handler so the close effect knows history was already unwound. */
  poppedByBack: boolean;
}

const registry: Entry[] = [];
let boundPopstate = false;
// True only while we call history.back() ourselves during a programmatic close, so the
// resulting popstate just drops the registry entry rather than firing another close.
let suppressCloseOnNextPop = false;

function onPopState() {
  const entry = registry.pop();
  if (!entry) return;
  if (suppressCloseOnNextPop) {
    suppressCloseOnNextPop = false;
    return;
  }
  entry.poppedByBack = true;
  entry.close();
}

function ensureBound() {
  if (boundPopstate || typeof window === 'undefined') return;
  window.addEventListener('popstate', onPopState);
  boundPopstate = true;
}

export function useBackDismiss(open: boolean, onClose: () => void, id = 'overlay'): void {
  // Keep the latest onClose without re-running the open/close effect on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const entryRef = useRef<Entry | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (open && !entryRef.current) {
      // Opening: register + push a marker entry (same URL, host router state preserved).
      ensureBound();
      const entry: Entry = { id, poppedByBack: false, close: () => onCloseRef.current() };
      entryRef.current = entry;
      registry.push(entry);
      window.history.pushState({ ...window.history.state, __uikitOverlay: id }, '');
    } else if (!open && entryRef.current) {
      // Closing. If Back already unwound our entry, nothing to do.
      const entry = entryRef.current;
      entryRef.current = null;
      if (entry.poppedByBack) return;

      const state = window.history.state as { __uikitOverlay?: string } | null;
      if (state && state.__uikitOverlay === id) {
        // Still sitting on our marker → step back to drop it.
        suppressCloseOnNextPop = true;
        window.history.back();
      } else {
        // A navigation moved us off the marker (e.g. a link inside the overlay). Don't fight
        // it with history.back(); just drop our registry slot. The orphaned marker shares the
        // prior URL, so it's harmless.
        const idx = registry.lastIndexOf(entry);
        if (idx !== -1) registry.splice(idx, 1);
      }
    }
  }, [open, id]);

  // Unmount while still open (e.g. a navigation tears the overlay down): drop our registry
  // slot without touching history — the navigation itself already moved history along.
  useEffect(() => {
    return () => {
      const entry = entryRef.current;
      if (!entry) return;
      const idx = registry.lastIndexOf(entry);
      if (idx !== -1) registry.splice(idx, 1);
      entryRef.current = null;
    };
  }, []);
}
