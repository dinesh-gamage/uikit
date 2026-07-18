import { useEffect, useRef, useSyncExternalStore } from 'react';
import { cx } from '../utils/cx';
import type { Tone } from '../types';
import { ToneIcon, CloseIcon } from '../notification-block/tone-icons';
import { dismissToast, getToastState, subscribeToasts, type ToastItem, type ToastTone } from './store';
import './toast.scss';

const TONE_MAP: Record<ToastTone, Tone> = {
  success: 'success',
  error: 'danger',
  warning: 'warning',
  info: 'info',
};

function ToastView({ item }: { item: ToastItem }) {
  const timerRef = useRef<number | undefined>(undefined);
  const startedAtRef = useRef(0);
  const remainingRef = useRef(item.duration);

  const clear = () => {
    if (timerRef.current !== undefined) {
      window.clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
  };

  const start = () => {
    if (item.duration <= 0 || remainingRef.current <= 0) return;
    startedAtRef.current = Date.now();
    timerRef.current = window.setTimeout(() => dismissToast(item.id), remainingRef.current);
  };

  useEffect(() => {
    start();
    return clear;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pause = () => {
    if (timerRef.current === undefined) return;
    remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedAtRef.current));
    clear();
  };

  const resume = () => {
    if (timerRef.current === undefined && !item.exiting) start();
  };

  return (
    <div
      className={cx('uikit-toast', `uikit-toast--${item.tone}`, { 'uikit-toast--exiting': item.exiting })}
      role="status"
      onMouseEnter={pause}
      onMouseLeave={resume}
    >
      <span className="uikit-toast__icon">
        <ToneIcon tone={TONE_MAP[item.tone]} />
      </span>
      <div className="uikit-toast__content">
        {item.title != null && <div className="uikit-toast__title">{item.title}</div>}
        <div className="uikit-toast__message">{item.message}</div>
      </div>
      {item.dismissible && (
        <button
          type="button"
          className="uikit-toast__close"
          aria-label="Dismiss notification"
          onClick={() => dismissToast(item.id)}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}

/** Mounted once (lazily) on document.body; renders the toast stack. */
export function ToastHost() {
  const state = useSyncExternalStore(subscribeToasts, getToastState, getToastState);
  if (state.toasts.length === 0) return null;
  return (
    <div className={`uikit-toast-stack uikit-toast-stack--${state.config.position}`}>
      {state.toasts.map((t) => (
        <ToastView key={t.id} item={t} />
      ))}
    </div>
  );
}
