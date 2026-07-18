import { useEffect, useRef, useSyncExternalStore } from 'react';
import { cx } from '../utils/cx';
import { getCurrentDialog, settleCurrent, subscribeAlerts, type AlertDialogItem } from './store';
import './alert.scss';

function AlertDialog({ item }: { item: AlertDialogItem }) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Focus the confirm button on open, restore previous focus on close.
  useEffect(() => {
    const previous = document.activeElement;
    confirmRef.current?.focus();
    return () => {
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        settleCurrent(false);
      } else if (e.key === 'Enter') {
        // Let a focused button handle its own activation (e.g. Cancel).
        if (e.target instanceof HTMLButtonElement) return;
        e.preventDefault();
        settleCurrent(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const isConfirm = item.kind === 'confirm';

  return (
    <div className="uikit-alert">
      <div className="uikit-alert__backdrop" onClick={() => settleCurrent(false)} />
      <div
        className="uikit-alert__panel"
        role={isConfirm ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-label={item.title ?? undefined}
      >
        {item.title != null && <h2 className="uikit-alert__title">{item.title}</h2>}
        <div className="uikit-alert__message">{item.message}</div>
        <div className="uikit-alert__actions">
          {isConfirm && (
            <button type="button" className="uikit-alert__button" onClick={() => settleCurrent(false)}>
              {item.cancelLabel ?? 'Cancel'}
            </button>
          )}
          <button
            ref={confirmRef}
            type="button"
            className={cx('uikit-alert__button', 'uikit-alert__button--confirm', {
              'uikit-alert__button--danger': item.tone === 'danger',
            })}
            onClick={() => settleCurrent(true)}
          >
            {isConfirm ? item.confirmLabel ?? 'Confirm' : item.okLabel ?? 'OK'}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Mounted once (lazily) on document.body; renders one dialog at a time. */
export function AlertHost() {
  const current = useSyncExternalStore(subscribeAlerts, getCurrentDialog, getCurrentDialog);
  if (!current) return null;
  return <AlertDialog key={current.id} item={current} />;
}
