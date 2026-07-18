import type { ReactNode } from 'react';
import type { Tone } from '../types';

export interface AlertDialogOptions {
  title?: string;
  message: ReactNode;
  /** `danger` styles the confirm button destructively. */
  tone?: Tone;
  confirmLabel?: string;
  cancelLabel?: string;
  okLabel?: string;
}

export type AlertOptions = string | AlertDialogOptions;

export interface AlertDialogItem extends AlertDialogOptions {
  id: string;
  kind: 'confirm' | 'show';
  resolve: (value: boolean) => void;
}

type Listener = () => void;

let current: AlertDialogItem | null = null;
const queue: AlertDialogItem[] = [];
const listeners = new Set<Listener>();
let counter = 0;

function notify() {
  listeners.forEach((l) => l());
}

export function getCurrentDialog(): AlertDialogItem | null {
  return current;
}

export function subscribeAlerts(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Show the dialog now, or queue it if one is already open. */
export function enqueueDialog(
  kind: 'confirm' | 'show',
  options: AlertOptions,
  resolve: (value: boolean) => void
): string {
  const opts = typeof options === 'string' ? { message: options } : options;
  const item: AlertDialogItem = { ...opts, id: `uikit-alert-${++counter}`, kind, resolve };
  if (current) {
    queue.push(item);
  } else {
    current = item;
    notify();
  }
  return item.id;
}

/** Resolve the open dialog and advance to the next queued one, if any. */
export function settleCurrent(value: boolean) {
  if (!current) return;
  const item = current;
  current = queue.shift() ?? null;
  notify();
  item.resolve(value);
}
