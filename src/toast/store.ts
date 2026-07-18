import type { ReactNode } from 'react';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';

export interface ToastConfig {
  position: ToastPosition;
  duration: number;
}

export type ToastInput =
  | string
  | { title?: string; message: ReactNode; duration?: number; dismissible?: boolean };

export interface ToastItem {
  id: string;
  tone: ToastTone;
  title?: string;
  message: ReactNode;
  duration: number;
  dismissible: boolean;
  /** True while the exit animation plays; removed from the store shortly after. */
  exiting: boolean;
}

export interface ToastState {
  toasts: ToastItem[];
  config: ToastConfig;
}

/** How long the exit animation runs before the toast is removed from the store. */
export const TOAST_EXIT_MS = 200;

const DEFAULT_CONFIG: ToastConfig = { position: 'bottom-right', duration: 5000 };

type Listener = () => void;

let state: ToastState = { toasts: [], config: DEFAULT_CONFIG };
const listeners = new Set<Listener>();
let counter = 0;

function setState(next: ToastState) {
  state = next;
  listeners.forEach((l) => l());
}

export function getToastState(): ToastState {
  return state;
}

export function subscribeToasts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function addToast(tone: ToastTone, input: ToastInput): string {
  const opts = typeof input === 'string' ? { message: input } : input;
  const id = `uikit-toast-${++counter}`;
  const item: ToastItem = {
    id,
    tone,
    title: opts.title,
    message: opts.message,
    duration: opts.duration ?? state.config.duration,
    dismissible: opts.dismissible ?? true,
    exiting: false,
  };
  setState({ ...state, toasts: [...state.toasts, item] });
  return id;
}

/** Start the exit animation, then remove the toast from the store. */
export function dismissToast(id: string) {
  const item = state.toasts.find((t) => t.id === id);
  if (!item || item.exiting) return;
  setState({
    ...state,
    toasts: state.toasts.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
  });
  setTimeout(() => removeToast(id), TOAST_EXIT_MS);
}

export function removeToast(id: string) {
  if (!state.toasts.some((t) => t.id === id)) return;
  setState({ ...state, toasts: state.toasts.filter((t) => t.id !== id) });
}

export function configureToasts(opts: Partial<ToastConfig>) {
  setState({ ...state, config: { ...state.config, ...opts } });
}

/** Test helper — clears all toasts and restores default configuration. */
export function resetToastStore() {
  setState({ toasts: [], config: DEFAULT_CONFIG });
}
