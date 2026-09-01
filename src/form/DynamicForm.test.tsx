import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { DynamicForm } from './DynamicForm';
import type { FormSchema } from './types';

beforeEach(() => {
  // jsdom's requestAnimationFrame is backed by setTimeout; run it synchronously so the
  // Dropdown's measure-then-position two-phase render settles immediately.
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

describe('DynamicForm option renderers', () => {
  it('forwards renderOption to a select field', () => {
    const schema: FormSchema = {
      sections: [
        {
          fields: [
            {
              name: 'calendar',
              type: 'select',
              label: 'Calendar',
              options: [
                { value: 'work', label: 'Work' },
                { value: 'home', label: 'Home' },
              ],
              renderOption: (option) => <span data-testid="custom-option">◆ {option.label}</span>,
            },
          ],
        },
      ],
    };

    render(<DynamicForm schema={schema} onSubmit={() => {}} />);
    fireEvent.click(screen.getByRole('combobox'));

    const listbox = screen.getByRole('listbox');
    const custom = within(listbox).getAllByTestId('custom-option');
    expect(custom.map((el) => el.textContent)).toEqual(['◆ Work', '◆ Home']);
  });
});
