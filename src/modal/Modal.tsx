import { useEffect, useRef, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '../utils/cx';
import { useBackDismiss } from '../utils/use-back-dismiss';
import './modal.scss';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  /** Right-aligned action row under the body. */
  footer?: ReactNode;
  /** Whether clicking the backdrop closes the modal. */
  closeOnBackdrop?: boolean;
  /** Whether the browser/hardware Back button closes the modal (owns a history entry). Default true. */
  dismissOnBack?: boolean;
  children: ReactNode;
  className?: string;
}

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Module-scoped counter so nested modals only lock/restore scroll once, at the outermost open/close.
let lockCount = 0;
let previousOverflow = '';

function lockScroll() {
  if (lockCount === 0) {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  }
  lockCount++;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.style.overflow = previousOverflow;
  }
}

/** Controlled dialog, portaled to document.body. Not a singleton — mount one per usage, driven by `open`. */
export function Modal({
  open,
  onClose,
  title,
  size = 'md',
  footer,
  closeOnBackdrop = true,
  dismissOnBack = true,
  children,
  className,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useBackDismiss(dismissOnBack && open, onClose, 'modal');

  useEffect(() => {
    if (!open) return;
    lockScroll();
    return () => unlockScroll();
  }, [open]);

  // Focus the panel (or its first focusable descendant) on open; restore the previously
  // focused element on close.
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const panel = panelRef.current;
    const focusable = panel?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable ?? panel)?.focus();
    return () => {
      previous?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    // Only the backdrop itself (not a bubbled click from the panel) should close.
    if (e.target !== e.currentTarget) return;
    if (closeOnBackdrop) onClose();
  };

  return createPortal(
    <div className="uikit-modal" onMouseDown={handleBackdropClick}>
      <div
        ref={panelRef}
        className={cx('uikit-modal__panel', `uikit-modal__panel--${size}`, className)}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
      >
        <div className="uikit-modal__header">
          {title != null && <h2 className="uikit-modal__title">{title}</h2>}
          <button type="button" className="uikit-modal__close" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="uikit-modal__body">{children}</div>
        {footer != null && <div className="uikit-modal__footer">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
