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
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
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
