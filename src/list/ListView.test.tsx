import { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { ListView, type ListFetcherArgs } from './ListView';

interface Row {
  id: number;
  name: string;
  city: string;
}

afterEach(() => cleanup());

const columns = [
  { id: 'name', label: 'Name' },
  { id: 'city', label: 'City' },
];

describe('ListView details panel selection', () => {
  it('re-derives the selected item from fresh static data instead of showing a stale snapshot', () => {
    const initial: Row[] = [{ id: 1, name: 'Ava', city: 'Colombo' }];
    const updated: Row[] = [{ id: 1, name: 'Ava Perera', city: 'Kandy' }];

    function Harness() {
      const [rows, setRows] = useState(initial);
      return (
        <>
          <button type="button" onClick={() => setRows(updated)}>
            refresh
          </button>
          <ListView
            data={rows}
            idField="id"
            columns={columns}
            detailsPanel={{ title: (r) => r.name, fields: (r) => [{ label: 'City', value: r.city }] }}
          />
        </>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByText('Ava'));
    expect(screen.getByLabelText('Details').textContent).toContain('Colombo');

    fireEvent.click(screen.getByText('refresh'));

    // The panel is still open, but now reflects the refreshed row instead of the stale object
    // captured at click time.
    expect(screen.getByLabelText('Details').textContent).toContain('Kandy');
    expect(screen.getByLabelText('Details').textContent).toContain('Ava Perera');
  });

  it('closes the panel when the selected id vanishes from static data', () => {
    const initial: Row[] = [
      { id: 1, name: 'Ava', city: 'Colombo' },
      { id: 2, name: 'Liam', city: 'Berlin' },
    ];

    function Harness() {
      const [rows, setRows] = useState(initial);
      return (
        <>
          <button type="button" onClick={() => setRows(rows.filter((r) => r.id !== 1))}>
            delete
          </button>
          <ListView data={rows} idField="id" columns={columns} detailsPanel={{ title: (r) => r.name }} />
        </>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByText('Ava'));
    expect(screen.queryByLabelText('Details')).toBeTruthy();

    fireEvent.click(screen.getByText('delete'));
    expect(screen.queryByLabelText('Details')).toBeNull();
  });

  it('keeps showing the last-known item in fetcher mode when it is paged out (not deleted)', async () => {
    const rows: Row[] = Array.from({ length: 3 }, (_, i) => ({ id: i + 1, name: `Row ${i + 1}`, city: 'X' }));
    const fetcher = async ({ page, pageSize }: ListFetcherArgs) => {
      const start = (page - 1) * pageSize;
      return { items: rows.slice(start, start + pageSize), total: rows.length };
    };

    render(
      <ListView
        data={fetcher}
        idField="id"
        columns={columns}
        pageSize={1}
        detailsPanel={{ title: (r) => r.name }}
      />,
    );

    await waitFor(() => expect(screen.getByText('Row 1')).toBeTruthy());
    fireEvent.click(screen.getByText('Row 1'));
    expect(screen.getByLabelText('Details').textContent).toContain('Row 1');

    // Page to a page that doesn't include row 1 — it's paged out, not deleted.
    fireEvent.click(screen.getByLabelText('Next page'));
    await waitFor(() => expect(screen.getByText('Row 2')).toBeTruthy());

    // Panel stays open showing the last-known data for row 1 rather than closing or blanking.
    expect(screen.queryByLabelText('Details')).toBeTruthy();
    expect(screen.getByLabelText('Details').textContent).toContain('Row 1');
  });

  it('calls onSelectionChange on select, on close, and when a selection auto-closes', () => {
    const initial: Row[] = [
      { id: 1, name: 'Ava', city: 'Colombo' },
      { id: 2, name: 'Liam', city: 'Berlin' },
    ];
    const onSelectionChange = vi.fn();

    function Harness() {
      const [rows, setRows] = useState(initial);
      return (
        <>
          <button type="button" onClick={() => setRows(rows.filter((r) => r.id !== 1))}>
            delete
          </button>
          <ListView
            data={rows}
            idField="id"
            columns={columns}
            detailsPanel={{ title: (r) => r.name }}
            onSelectionChange={onSelectionChange}
          />
        </>
      );
    }

    render(<Harness />);
    expect(onSelectionChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByText('Ava')[0]);
    expect(onSelectionChange).toHaveBeenCalledTimes(1);
    expect(onSelectionChange.mock.calls[0][0]).toMatchObject({ id: 1, name: 'Ava' });

    // Re-clicking the same row closes the panel (deselect).
    fireEvent.click(screen.getAllByText('Ava')[0]);
    expect(onSelectionChange).toHaveBeenCalledTimes(2);
    expect(onSelectionChange.mock.calls[1][0]).toBeNull();

    fireEvent.click(screen.getByText('Liam'));
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
    expect(onSelectionChange.mock.calls[2][0]).toMatchObject({ id: 2 });

    act(() => {
      fireEvent.click(screen.getByText('delete'));
    });
    // Deleting the OTHER (non-selected) row should not affect the current selection.
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
  });
});
