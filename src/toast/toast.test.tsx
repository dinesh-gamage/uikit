import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { toast } from './toast';
import { getToastState, resetToastStore, TOAST_EXIT_MS } from './store';

describe('toast store', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetToastStore();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('adds a toast with the right tone from a string message', () => {
    const id = toast.success('Saved');
    const { toasts } = getToastState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].tone).toBe('success');
    expect(toasts[0].message).toBe('Saved');
    expect(toasts[0].dismissible).toBe(true);
    expect(toasts[0].duration).toBe(5000);
  });

  it('maps each method to its tone', () => {
    toast.success('a');
    toast.error('b');
    toast.warning('c');
    toast.info('d');
    expect(getToastState().toasts.map((t) => t.tone)).toEqual(['success', 'error', 'warning', 'info']);
  });

  it('accepts an options object with title, duration and dismissible', () => {
    toast.error({ title: 'Failed', message: 'Try again', duration: 8000, dismissible: false });
    const [item] = getToastState().toasts;
    expect(item.title).toBe('Failed');
    expect(item.message).toBe('Try again');
    expect(item.duration).toBe(8000);
    expect(item.dismissible).toBe(false);
  });

  it('dismiss marks the toast exiting, then removes it after the exit delay', () => {
    const id = toast.info('bye');
    toast.dismiss(id);
    expect(getToastState().toasts[0].exiting).toBe(true);
    vi.advanceTimersByTime(TOAST_EXIT_MS + 50);
    expect(getToastState().toasts).toHaveLength(0);
  });

  it('dismissing an unknown id is a no-op', () => {
    toast.success('keep');
    toast.dismiss('nope');
    vi.advanceTimersByTime(TOAST_EXIT_MS + 50);
    expect(getToastState().toasts).toHaveLength(1);
  });

  it('configure changes the default position and duration', () => {
    toast.configure({ position: 'top-left', duration: 1200 });
    expect(getToastState().config).toEqual({ position: 'top-left', duration: 1200 });
    toast.info('hi');
    expect(getToastState().toasts[0].duration).toBe(1200);
  });

  it('per-toast duration overrides the configured default', () => {
    toast.configure({ duration: 1200 });
    toast.info({ message: 'hi', duration: 9000 });
    expect(getToastState().toasts[0].duration).toBe(9000);
  });
});
