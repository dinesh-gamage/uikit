import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils/cx';
import { computePlacement, type DropdownPosition } from './position-utils';
import './dropdown.scss';

export type { DropdownPosition };

export interface DropdownProps {
  open: boolean;
  onClose: () => void;
  /** External trigger element the dropdown is anchored to. */
  anchorRef: RefObject<HTMLElement | null>;
  children: ReactNode;
  position?: DropdownPosition;
  /** Force the panel to the same width as the anchor. */
  matchTriggerWidth?: boolean;
  minWidth?: number | string;
  maxWidth?: number | string;
  maxHeight?: number;
  className?: string;
  /** Enter animation duration in ms. */
  duration?: number;
}

const GAP = 8;

type Phase = 'measuring' | 'positioned' | 'entered';

// Module-level registry of currently-open Dropdown instances' close callbacks. Any
// Dropdown-based popover (Select, MultiSelect, date/time pickers, ColorPicker, Tabs' overflow
// menu, Breadcrumb's overflow menu, ...) shares this, so opening one closes any others still
// open — the smallest mechanism that keeps only one floating panel on screen at a time. This is
// what fixes two date fields in the same modal leaving both calendars open/stacked.
const openPopovers = new Map<HTMLElement, OpenPopover>();

interface OpenPopover {
  close: () => void;
  anchor: () => HTMLElement | null;
}

/**
 * True when `target` is inside `panel` — directly, or via a popover that is *nested* in it
 * (e.g. a Select's listbox opened from inside a Dropdown panel). Nested popovers are portalled
 * to body, so `panel.contains(target)` alone can't see them; walk the open registry instead.
 */
function panelContains(panel: HTMLElement, target: Node): boolean {
  if (panel.contains(target)) return true;
  for (const [childPanel, child] of openPopovers) {
    if (childPanel === panel) continue;
    const anchor = child.anchor();
    if (anchor && panel.contains(anchor) && panelContains(childPanel, target)) return true;
  }
  return false;
}

/**
 * Anchored floating panel rendered in a body portal. Uses a two-phase measure: the panel is
 * first rendered with `position: fixed` and its width constraints already applied but
 * `visibility: hidden`, so its real (constrained) box can be measured on the next frame before
 * it's placed. This is what makes positioning correct — measuring an unconstrained, unpositioned
 * block element (as a naive single-pass approach would) yields a width close to the full
 * viewport, which throws off every downstream placement calculation.
 */
export function Dropdown({
  open,
  onClose,
  anchorRef,
  children,
  position = 'bottom-start',
  matchTriggerWidth,
  minWidth,
  maxWidth,
  maxHeight = 320,
  className,
  duration = 150,
}: DropdownProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<Phase>('measuring');
  const [style, setStyle] = useState<CSSProperties>({});

  // Keep the latest `onClose` available to the registry effect below without making it
  // re-run (and re-register) on every render — `onClose` is typically a fresh inline closure
  // per render (e.g. `onClose={() => setOpen(false)}`), so this effect deliberately only
  // depends on `open`.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Register this instance while open, closing any other open instance first — except an
  // ancestor whose panel contains this popover's anchor (a Select inside a Dropdown panel must
  // not dismiss the panel it lives in).
  useEffect(() => {
    if (!open) return;
    const self: OpenPopover = { close: () => onCloseRef.current(), anchor: () => anchorRef.current };
    const ownAnchor = anchorRef.current;
    for (const [panel, other] of openPopovers) {
      if (ownAnchor && panelContains(panel, ownAnchor)) continue;
      other.close();
    }
    // Key by the panel element once it exists; until then a placeholder keeps the entry stable.
    const key = panelRef.current ?? document.createElement('div');
    openPopovers.set(key, self);
    return () => {
      openPopovers.delete(key);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const reposition = () => {
    const anchor = anchorRef.current;
    const panel = panelRef.current;
    if (!anchor || !panel) return;
    const anchorRect = anchor.getBoundingClientRect();
    const panelRect = panel.getBoundingClientRect();
    const placement = computePlacement(
      { top: anchorRect.top, left: anchorRect.left, width: anchorRect.width, height: anchorRect.height },
      { top: panelRect.top, left: panelRect.left, width: panelRect.width, height: panelRect.height },
      { width: window.innerWidth, height: window.innerHeight },
      position,
      GAP,
    );
    const resolvedMaxHeight = placement.maxHeight != null ? Math.min(placement.maxHeight, maxHeight) : maxHeight;
    // `placement.maxWidth` is the viewport-derived clamp (only set when the panel would
    // otherwise overflow horizontally). It only combines with a numeric `maxWidth` prop — a
    // string prop (e.g. '90%') is an explicit author choice we leave alone.
    const resolvedMaxWidth =
      placement.maxWidth != null
        ? typeof maxWidth === 'number'
          ? Math.min(maxWidth, placement.maxWidth)
          : (maxWidth ?? placement.maxWidth)
        : maxWidth;
    setStyle({
      position: 'fixed',
      top: placement.top,
      left: placement.left,
      width: matchTriggerWidth ? anchorRect.width : undefined,
      minWidth,
      maxWidth: resolvedMaxWidth,
      maxHeight: resolvedMaxHeight,
    });
    setPhase((p) => (p === 'measuring' ? 'positioned' : p));
  };

  // Reset to the measuring phase every time the dropdown opens.
  useLayoutEffect(() => {
    if (open) setPhase('measuring');
  }, [open]);

  // Phase 1 -> 2: measure the (already width-constrained, invisible) panel and place it.
  useLayoutEffect(() => {
    if (!open || phase !== 'measuring') return;
    const raf = requestAnimationFrame(reposition);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase]);

  // Phase 2 -> 3: flip to the entered state on the next frame so the CSS transition plays.
  useEffect(() => {
    if (phase !== 'positioned') return;
    const raf = requestAnimationFrame(() => setPhase('entered'));
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  // Reposition (never close) on window resize, any ancestor scroll, or the panel's own content
  // resizing — the latter matters because async option lists change panel height after load.
  useEffect(() => {
    if (!open || phase === 'measuring') return;
    const onViewportChange = () => reposition();
    window.addEventListener('resize', onViewportChange);
    window.addEventListener('scroll', onViewportChange, true);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined' && panelRef.current) {
      ro = new ResizeObserver(() => reposition());
      ro.observe(panelRef.current);
    }
    return () => {
      window.removeEventListener('resize', onViewportChange);
      window.removeEventListener('scroll', onViewportChange, true);
      ro?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, position, matchTriggerWidth, minWidth, maxWidth, maxHeight]);

  useEffect(() => {
    if (!open) return;
    // Primary outside-interaction close: pointerdown (covers mouse, touch, and pen in one
    // listener, and fires before the browser's mousedown default action runs — see the
    // focusin guard below for why that ordering matters).
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if ((panelRef.current && panelContains(panelRef.current, t)) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    // Keyboard-driven focus moving to a real element outside the anchor/panel (e.g. Tab-ing to
    // the next field) closes the popover too. This must NOT fire for focus landing on
    // document/body/html: a mousedown on a panel element that the browser doesn't natively
    // focus on click (e.g. Safari's long-standing behavior of not focusing <button> from a
    // mouse click) still blurs whatever was previously focused, and per the focus-fixup
    // algorithm that blur falls back to the document/body with its own focusin event. That
    // fallback target is never "outside" in any meaningful sense — it's an artifact of the
    // click, not a real focus-away — so treating it as an outside signal here would close (and
    // unmount) the panel mid-click, before the click event that follows the pointerdown can
    // reach the element the user actually clicked. The same fallback-to-body/html pattern also
    // covers the window regaining OS-level focus.
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as Node | null;
      if (t === null || t === document.body || t === document.documentElement || (t as unknown) === document) return;
      if ((panelRef.current && panelContains(panelRef.current, t)) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    // Escape closes only this popover. Listening in the capture phase and calling
    // stopPropagation ensures this fires — and stops the event — before it can reach a
    // bubble-phase document listener registered by an ancestor (e.g. Modal's Escape handler),
    // so Escape doesn't fall through and close a modal the popover happens to be inside.
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('keydown', onKey, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  const measuringStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    visibility: 'hidden',
    width: matchTriggerWidth ? anchorRef.current?.getBoundingClientRect().width : undefined,
    minWidth,
    maxWidth,
    maxHeight,
  };

  return createPortal(
    <div
      ref={panelRef}
      className={cx('uikit-dropdown', `uikit-dropdown--${phase}`, className)}
      style={{
        ...(phase === 'measuring' ? measuringStyle : style),
        '--uikit-dropdown-duration': `${duration}ms`,
      } as CSSProperties}
      role="dialog"
    >
      {children}
    </div>,
    document.body,
  );
}
