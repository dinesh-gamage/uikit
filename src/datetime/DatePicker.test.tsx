import { useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { DatePicker } from './DatePicker';

beforeEach(() => {
  // jsdom's requestAnimationFrame is backed by setTimeout; run it synchronously so the
  // Dropdown's measure-then-position two-phase render (used by the calendar popover) settles
  // immediately for these tests.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function ControlledDatePicker() {
  const [value, setValue] = useState<Date | null>(null);
  return <DatePicker label="Date" value={value} onChange={setValue} />;
}

describe('DatePicker calendar buttons', () => {
  it('renders day cells and month-nav buttons as type="button" (no implicit form submission)', () => {
    render(<ControlledDatePicker />);
    fireEvent.click(screen.getByLabelText('Date'));

    const dayCells = screen.getAllByRole('gridcell');
    expect(dayCells.length).toBeGreaterThan(0);
    for (const cell of dayCells) {
      expect(cell.tagName).toBe('BUTTON');
      expect(cell.getAttribute('type')).toBe('button');
    }

    expect(screen.getByLabelText('Previous month').getAttribute('type')).toBe('button');
    expect(screen.getByLabelText('Next month').getAttribute('type')).toBe('button');
  });
});

describe('DatePicker Enter key', () => {
  it('preventDefaults Enter in the text input so it cannot submit an enclosing form', () => {
    render(<ControlledDatePicker />);
    const input = screen.getByLabelText('Date');
    fireEvent.click(input);

    // dispatchEvent (which fireEvent wraps) returns false when the event was canceled via
    // preventDefault — i.e. exactly what stops the browser's implicit-submit-on-Enter default
    // action for a text input inside a <form>.
    const notCanceled = fireEvent.keyDown(input, { key: 'Enter' });
    expect(notCanceled).toBe(false);
  });

  it('still commits the typed value and closes the popover on Enter', () => {
    render(<ControlledDatePicker />);
    const input = screen.getByLabelText('Date') as HTMLInputElement;
    fireEvent.click(input);
    fireEvent.change(input, { target: { value: '2026-07-19' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe('2026-07-19');
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
