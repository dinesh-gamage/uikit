import { act } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Tooltip } from './Tooltip';

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom's requestAnimationFrame is itself backed by (now-faked) setTimeout, which makes the
  // component's measure-then-position two-phase render flaky under fake timers. Stub it to run
  // synchronously so `advance()` below deterministically settles the whole show sequence.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

// Advances fake timers inside `act` so React flushes the resulting state updates (and the
// synchronous rAF stub above) before the assertion runs.
function advance(ms: number) {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}

function renderTooltip(props: Partial<React.ComponentProps<typeof Tooltip>> = {}) {
  render(
    <Tooltip content="Helpful hint" delayMs={400} {...props}>
      <button type="button">trigger</button>
    </Tooltip>,
  );
  return screen.getByText('trigger').closest('.uikit-tooltip-anchor') as HTMLElement;
}

describe('Tooltip', () => {
  it('does not show immediately on hover, then shows after delayMs', () => {
    const anchor = renderTooltip();
    fireEvent.mouseEnter(anchor);
    expect(screen.queryByRole('tooltip')).toBeNull();

    advance(399);
    expect(screen.queryByRole('tooltip')).toBeNull();

    advance(1);
    expect(screen.getByRole('tooltip').textContent).toBe('Helpful hint');
  });

  it('hides immediately on mouseleave, and cancels a pending (not-yet-shown) show', () => {
    const anchor = renderTooltip();

    // Cancel before the delay elapses — should never show.
    fireEvent.mouseEnter(anchor);
    advance(200);
    fireEvent.mouseLeave(anchor);
    advance(400);
    expect(screen.queryByRole('tooltip')).toBeNull();

    // Show, then hide — should disappear immediately, no delay.
    fireEvent.mouseEnter(anchor);
    advance(400);
    expect(screen.getByRole('tooltip')).toBeTruthy();
    fireEvent.mouseLeave(anchor);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('shows on focus and hides on blur', () => {
    renderTooltip();
    const trigger = screen.getByText('trigger');
    // React delegates onFocus/onBlur via native focusin/focusout (which bubble); plain
    // focus/blur events don't bubble and won't reach the wrapper span's handlers.
    fireEvent.focusIn(trigger);
    advance(400);
    expect(screen.getByRole('tooltip')).toBeTruthy();

    fireEvent.focusOut(trigger);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('never shows when disabled', () => {
    const anchor = renderTooltip({ disabled: true });
    fireEvent.mouseEnter(anchor);
    advance(1000);
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('hides on Escape', () => {
    const anchor = renderTooltip();
    fireEvent.mouseEnter(anchor);
    advance(400);
    expect(screen.getByRole('tooltip')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('wires aria-describedby onto the child while shown, and clears it when hidden', () => {
    const anchor = renderTooltip();
    const trigger = screen.getByText('trigger');
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);

    fireEvent.mouseEnter(anchor);
    advance(400);
    const tooltip = screen.getByRole('tooltip');
    expect(trigger.getAttribute('aria-describedby')).toBe(tooltip.id);

    fireEvent.mouseLeave(anchor);
    expect(trigger.hasAttribute('aria-describedby')).toBe(false);
  });
});
