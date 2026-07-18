import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils/cx';
import './popover.scss';

export interface PopoverProps {
  open: boolean;
  /** Element the popover is anchored to. */
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  children: ReactNode;
  /** Match the anchor's width. */
  matchWidth?: boolean;
  align?: 'start' | 'end';
  maxHeight?: number;
  className?: string;
}

const GAP = 4;

/** Anchored floating panel rendered in a body portal. Flips above when out of space. */
export function Popover({ open, anchorRef, onClose, children, matchWidth, align = 'start', maxHeight = 320, className }: PopoverProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  useLayoutEffect(() => {
    if (!open) return;
    const position = () => {
      const anchor = anchorRef.current;
      const panel = panelRef.current;
      if (!anchor || !panel) return;
      const rect = anchor.getBoundingClientRect();
      const panelH = panel.offsetHeight;
      const panelW = matchWidth ? rect.width : panel.offsetWidth;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < panelH + GAP && rect.top > panelH + GAP;
      let left = align === 'end' ? rect.right - panelW : rect.left;
      left = Math.max(8, Math.min(left, window.innerWidth - panelW - 8));
      setStyle({
        position: 'fixed',
        top: openUp ? rect.top - panelH - GAP : rect.bottom + GAP,
        left,
        width: matchWidth ? rect.width : undefined,
        maxHeight,
      });
    };
    position();
    window.addEventListener('resize', position);
    window.addEventListener('scroll', position, true);
    return () => {
      window.removeEventListener('resize', position);
      window.removeEventListener('scroll', position, true);
    };
  }, [open, anchorRef, matchWidth, align, maxHeight, children]);

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
  return createPortal(
    <div ref={panelRef} className={cx('uikit-popover', className)} style={style} role="dialog">
      {children}
    </div>,
    document.body,
  );
}
