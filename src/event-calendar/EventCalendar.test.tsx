import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { EventCalendar } from './EventCalendar';
import type { DateRange, SlotArgs } from './event-calendar-utils';

interface Meeting {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

// 1 Sep 2026 is a Tuesday, so a Monday-start month grid begins on 31 Aug.
const DATE = new Date(2026, 8, 15);

const EVENTS: Meeting[] = [
  { id: 'a', title: 'Standup', start: new Date(2026, 8, 1, 9, 0), end: new Date(2026, 8, 1, 9, 15) },
  { id: 'b', title: 'Offsite', start: new Date(2026, 8, 3), end: new Date(2026, 8, 6), allDay: true },
];

function renderCalendar(overrides: Partial<React.ComponentProps<typeof EventCalendar<Meeting>>> = {}) {
  const props = {
    events: EVENTS,
    eventId: (e: Meeting) => e.id,
    eventStart: (e: Meeting) => e.start,
    eventEnd: (e: Meeting) => e.end,
    eventTitle: (e: Meeting) => e.title,
    eventAllDay: (e: Meeting) => !!e.allDay,
    view: 'month' as const,
    onViewChange: vi.fn(),
    date: DATE,
    onDateChange: vi.fn(),
    locale: 'en-GB',
    ...overrides,
  };
  return { ...render(<EventCalendar<Meeting> {...props} />), props };
}

beforeEach(() => {
  // Tabs (the view switcher) observes its own width; jsdom has no ResizeObserver.
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  // The Dropdown's measure-then-position pass settles synchronously.
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

describe('EventCalendar month view', () => {
  it('renders a 6x7 grid with the range label and the events', () => {
    renderCalendar();
    expect(screen.getByText('September 2026')).toBeTruthy();
    expect(screen.getAllByRole('row')).toHaveLength(6);
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
    expect(screen.getByLabelText('Standup, 09:00–09:15')).toBeTruthy();
    expect(screen.getByLabelText('Offsite, all day')).toBeTruthy();
  });

  it('marks today with aria-current and uses a roving tabIndex', () => {
    renderCalendar();
    const cells = screen.getAllByRole('gridcell');
    expect(cells.filter((c) => c.getAttribute('tabindex') === '0')).toHaveLength(1);
    expect(cells.filter((c) => c.getAttribute('tabindex') === '-1')).toHaveLength(41);
  });

  it('reports the full 6x7 range on mount', () => {
    const onVisibleRangeChange = vi.fn();
    renderCalendar({ onVisibleRangeChange });
    expect(onVisibleRangeChange).toHaveBeenCalledTimes(1);
    const range: DateRange = onVisibleRangeChange.mock.calls[0][0];
    expect(range.start.getTime()).toBe(new Date(2026, 7, 31).getTime());
    expect(range.end.getTime()).toBe(new Date(2026, 9, 12).getTime());
  });

  it('clicking an empty cell reports an all-day midnight-to-midnight slot', () => {
    const onSlotClick = vi.fn();
    renderCalendar({ onSlotClick });
    // 10 Sep 2026 has no events: row 2 (index 1), Thursday (index 3).
    fireEvent.click(screen.getByLabelText(/Thursday,? 10 September 2026/));
    expect(onSlotClick).toHaveBeenCalledTimes(1);
    const args: SlotArgs = onSlotClick.mock.calls[0][0];
    expect(args.allDay).toBe(true);
    expect(args.start.getTime()).toBe(new Date(2026, 8, 10).getTime());
    expect(args.end.getTime()).toBe(new Date(2026, 8, 11).getTime());
  });

  it('Enter on the focused cell reports the same slot as a click', () => {
    const onSlotClick = vi.fn();
    renderCalendar({ onSlotClick });
    fireEvent.keyDown(screen.getAllByRole('gridcell')[0].parentElement!.parentElement!, { key: 'Enter' });
    expect(onSlotClick).toHaveBeenCalledTimes(1);
    expect(onSlotClick.mock.calls[0][0].start.getTime()).toBe(new Date(2026, 8, 15).getTime());
  });

  it('arrow keys move the focused day and cross the month boundary', () => {
    const onDateChange = vi.fn();
    renderCalendar({ onDateChange });
    const grid = screen.getAllByRole('gridcell')[0].parentElement!.parentElement!;
    fireEvent.keyDown(grid, { key: 'ArrowRight' });
    expect(screen.getByLabelText(/Wednesday,? 16 September 2026/).getAttribute('tabindex')).toBe('0');
    expect(onDateChange).not.toHaveBeenCalled();

    fireEvent.keyDown(grid, { key: 'PageDown' });
    expect(onDateChange).toHaveBeenCalledTimes(1);
    expect(onDateChange.mock.calls[0][0].getMonth()).toBe(9);
  });

  it('clicking an event reports it with its anchor element', () => {
    const onEventClick = vi.fn();
    renderCalendar({ onEventClick });
    const chip = screen.getByLabelText('Standup, 09:00–09:15');
    fireEvent.click(chip);
    expect(onEventClick).toHaveBeenCalledTimes(1);
    expect(onEventClick.mock.calls[0][0].id).toBe('a');
    expect(onEventClick.mock.calls[0][1]).toBe(chip);
  });
});

describe('EventCalendar view switching', () => {
  it('the pills switcher reports the picked view', () => {
    const onViewChange = vi.fn();
    renderCalendar({ onViewChange });
    fireEvent.click(screen.getByRole('tab', { name: 'Week' }));
    expect(onViewChange).toHaveBeenCalledWith('week');
  });

  it('the mobile switcher opens a menu and reports the picked view', () => {
    const onViewChange = vi.fn();
    renderCalendar({ onViewChange, forceMobile: true });
    fireEvent.click(screen.getByLabelText('View: Month'));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Agenda' }));
    expect(onViewChange).toHaveBeenCalledWith('agenda');
  });

  it('renders the week grid with an all-day strip and hour labels', () => {
    renderCalendar({ view: 'week' });
    expect(screen.getByText('All day')).toBeTruthy();
    expect(screen.getByText('09:00')).toBeTruthy();
    expect(screen.getByLabelText(/Tuesday,? 15 September 2026/)).toBeTruthy();
  });

  it('renders the agenda grouped by day', () => {
    renderCalendar({ view: 'agenda', date: new Date(2026, 8, 1), agendaDays: 7 });
    expect(screen.getByText(/Tuesday,? 1 September 2026/)).toBeTruthy();
    expect(screen.getAllByText('Offsite')).toHaveLength(3);
  });

  it('shows emptyMessage when the agenda has nothing', () => {
    renderCalendar({ view: 'agenda', events: [], emptyMessage: 'Nothing planned' });
    expect(screen.getByText('Nothing planned')).toBeTruthy();
  });
});

describe('EventCalendar mobile month', () => {
  it('renders the compact dot grid and the tapped day list', () => {
    const { container } = renderCalendar({ forceMobile: true, date: new Date(2026, 8, 1) });
    expect(container.querySelector('.uikit-event-calendar__month--compact')).toBeTruthy();
    expect(container.querySelectorAll('.uikit-event-calendar__month-dot').length).toBeGreaterThan(0);
    // The tapped day's events are listed below the grid as agenda rows.
    expect(screen.getByText(/Tuesday,? 1 September 2026/)).toBeTruthy();
    expect(screen.getByLabelText('Standup, 09:00–09:15')).toBeTruthy();
  });

  it('tapping a day selects it rather than opening a slot', () => {
    const onDateChange = vi.fn();
    const onSlotClick = vi.fn();
    renderCalendar({ forceMobile: true, onDateChange, onSlotClick });
    fireEvent.click(screen.getByLabelText(/Thursday,? 10 September 2026/));
    expect(onDateChange).toHaveBeenCalledTimes(1);
    expect(onSlotClick).not.toHaveBeenCalled();
  });
});

describe('EventCalendar mobile header', () => {
  it('puts the range label on its own row above one toolbar row', () => {
    const { container } = renderCalendar({
      forceMobile: true,
      headerLeft: <button type="button">Menu</button>,
      headerRight: <button type="button">New event</button>,
    });

    const header = container.querySelector('.uikit-event-calendar__header--mobile')!;
    expect(header).toBeTruthy();

    const label = header.querySelector('.uikit-event-calendar__label')!;
    const toolbar = header.querySelector('.uikit-event-calendar__toolbar')!;
    const nav = header.querySelector('.uikit-event-calendar__nav')!;
    expect(label.compareDocumentPosition(toolbar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(label.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(toolbar.contains(nav)).toBe(true);
  });

  it('renders headerLeft and headerRight inside the toolbar row', () => {
    const { container } = renderCalendar({
      forceMobile: true,
      headerLeft: <button type="button">Menu</button>,
      headerRight: <button type="button">New event</button>,
    });

    const toolbar = container.querySelector('.uikit-event-calendar__toolbar')!;
    expect(toolbar.contains(screen.getByText('Menu'))).toBe(true);
    const end = toolbar.querySelector('.uikit-event-calendar__toolbar-end')!;
    expect(end.contains(screen.getByText('New event'))).toBe(true);
    expect(toolbar.contains(screen.getByLabelText('View: Month'))).toBe(true);
  });
});

describe('EventCalendar navigation', () => {
  it('steps by month, and Today jumps to the current day', () => {
    const onDateChange = vi.fn();
    renderCalendar({ onDateChange });
    fireEvent.click(screen.getByLabelText('Next'));
    expect(onDateChange.mock.calls[0][0].getMonth()).toBe(9);
    fireEvent.click(screen.getByLabelText('Previous'));
    expect(onDateChange.mock.calls[1][0].getMonth()).toBe(7);
    fireEvent.click(screen.getByText('Today'));
    expect(onDateChange.mock.calls[2][0].getHours()).toBe(0);
  });

  it('steps by week in the week view', () => {
    const onDateChange = vi.fn();
    renderCalendar({ view: 'week', onDateChange });
    fireEvent.click(screen.getByLabelText('Next'));
    expect(onDateChange.mock.calls[0][0].getDate()).toBe(22);
  });

  it('renders a loading overlay without unmounting the grid', () => {
    const { container } = renderCalendar({ loading: true });
    expect(container.querySelector('.uikit-event-calendar__loading')).toBeTruthy();
    expect(screen.getAllByRole('gridcell')).toHaveLength(42);
  });
});
