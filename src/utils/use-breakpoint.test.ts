import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useBreakpoint } from './use-breakpoint';

/** Minimal matchMedia mock whose `.matches` we control and can fire `change` on. */
function mockMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<() => void>();
  vi.stubGlobal('matchMedia', (_query: string) => ({
    get matches() {
      return matches;
    },
    addEventListener: (_: string, cb: () => void) => listeners.add(cb),
    removeEventListener: (_: string, cb: () => void) => listeners.delete(cb),
  }));
  return {
    set(v: boolean) {
      matches = v;
      listeners.forEach((cb) => cb());
    },
  };
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('useBreakpoint', () => {
  it('reads matchMedia synchronously on first render (no false-then-true flip)', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useBreakpoint(960));
    // If it seeded from useState(false) this would be false on first render.
    expect(result.current).toBe(true);
  });

  it('updates when the media query changes', () => {
    const mq = mockMatchMedia(false);
    const { result } = renderHook(() => useBreakpoint(960));
    expect(result.current).toBe(false);
    act(() => mq.set(true));
    expect(result.current).toBe(true);
  });
});
