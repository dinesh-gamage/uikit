import {
  cloneElement,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils/cx';
import { computeTooltipPlacement, type TooltipPosition } from './position';
import './tooltip.scss';

export type { TooltipPosition };

export interface TooltipProps {
  content: ReactNode;
  /** Single child. Wrapped in an inline-flex span so it works even for disabled buttons. */
  children: ReactElement;
  position?: TooltipPosition;
  /** Hover/focus delay before showing, in ms. Hiding is always immediate. */
  delayMs?: number;
  disabled?: boolean;
}

type Phase = 'measuring' | 'positioned';

export function Tooltip({ content, children, position = 'top', delayMs = 400, disabled }: TooltipProps) {
  const id = useId();
  const anchorRef = useRef<HTMLSpanElement>(null);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const showTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('measuring');
  const [style, setStyle] = useState<CSSProperties>({});

  const hasContent = content != null && content !== false;

  const clearShowTimer = () => {
    if (showTimer.current != null) {
      clearTimeout(showTimer.current);
      showTimer.current = undefined;
    }
  };

  const show = () => {
    if (disabled || !hasContent) return;
    clearShowTimer();
    showTimer.current = setTimeout(() => setOpen(true), delayMs);
  };

  const hide = () => {
    clearShowTimer();
    setOpen(false);
  };

  useEffect(() => clearShowTimer, []);

  useEffect(() => {
    if (disabled) hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled]);

  // Reset to the measuring phase every time the tooltip opens.
  useLayoutEffect(() => {
    if (open) setPhase('measuring');
  }, [open]);

  // Measure the (invisible, fixed) bubble on the next frame, then place it.
  useEffect(() => {
    if (!open || phase !== 'measuring') return;
    const raf = requestAnimationFrame(() => {
      const anchor = anchorRef.current;
      const bubble = bubbleRef.current;
      if (!anchor || !bubble) return;
      const anchorRect = anchor.getBoundingClientRect();
      const bubbleRect = bubble.getBoundingClientRect();
      const placement = computeTooltipPlacement(
        anchorRect,
        bubbleRect,
        { width: window.innerWidth, height: window.innerHeight },
        position,
      );
      setStyle({ top: placement.top, left: placement.left });
      setPhase('positioned');
    });
    return () => cancelAnimationFrame(raf);
  }, [open, phase, position]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  const describedChild = cloneElement(children, {
    'aria-describedby': open ? id : (children.props as { 'aria-describedby'?: string })['aria-describedby'],
  } as { 'aria-describedby'?: string });

  return (
    <span
      ref={anchorRef}
      className="uikit-tooltip-anchor"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {describedChild}
      {open &&
        hasContent &&
        createPortal(
          <div
            ref={bubbleRef}
            id={id}
            role="tooltip"
            className={cx('uikit-tooltip', `uikit-tooltip--${phase}`)}
            style={style}
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}
