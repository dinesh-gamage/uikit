import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, cleanup } from '@testing-library/react';
import { useBackDismiss } from './use-back-dismiss';

/** Simulate the browser delivering a Back (popstate) event. */
function back() {
  window.dispatchEvent(new PopStateEvent('popstate'));
}

afterEach(() => cleanup());

describe('useBackDismiss', () => {
  it('pushes a marker entry on open (merging existing state) and closes on Back', () => {
    const push = vi.spyOn(window.history, 'pushState');
    window.history.replaceState({ router: 'keep' }, '');
    const onClose = vi.fn();

    const { rerender } = renderHook(({ open }) => useBackDismiss(open, onClose, 'a'), {
      initialProps: { open: false },
    });
    expect(push).not.toHaveBeenCalled();

    rerender({ open: true });
    expect(push).toHaveBeenCalledTimes(1);
    const [state] = push.mock.calls[0];
    expect(state).toMatchObject({ router: 'keep', __uikitOverlay: 'a' });

    back();
    expect(onClose).toHaveBeenCalledTimes(1);
    push.mockRestore();
  });

  it('steps history back once on a programmatic close', () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const onClose = vi.fn();

    const { rerender } = renderHook(({ open }) => useBackDismiss(open, onClose, 'b'), {
      initialProps: { open: true },
    });
    rerender({ open: false });
    expect(backSpy).toHaveBeenCalledTimes(1);
    // onClose is NOT re-fired by our own back(): the popstate it triggers is suppressed.
    back();
    expect(onClose).not.toHaveBeenCalled();
    backSpy.mockRestore();
  });

  it('does not step history back when a navigation moved off the marker', () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    const onClose = vi.fn();
    const { rerender } = renderHook(({ open }) => useBackDismiss(open, onClose, 'nav'), {
      initialProps: { open: true },
    });
    // Simulate a link inside the overlay navigating away (marker no longer current).
    window.history.replaceState({ some: 'route' }, '');
    rerender({ open: false });
    expect(backSpy).not.toHaveBeenCalled();
    backSpy.mockRestore();
  });

  it('closes only the top-most overlay on a nested Back', () => {
    const closeA = vi.fn();
    const closeB = vi.fn();
    renderHook(() => useBackDismiss(true, closeA, 'A'));
    renderHook(() => useBackDismiss(true, closeB, 'B'));

    back(); // pops B (opened last)
    expect(closeB).toHaveBeenCalledTimes(1);
    expect(closeA).not.toHaveBeenCalled();

    back(); // pops A
    expect(closeA).toHaveBeenCalledTimes(1);
  });
});
