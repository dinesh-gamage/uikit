import { useEffect, useMemo, useState } from 'react';
import { EventCalendar, type CalendarView, type WeekStartsOn } from '../../src/event-calendar';
import { toast } from '../../src/toast';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import './demo-widgets.scss';

interface Meeting {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  color?: string;
  locked?: boolean;
}

function day(offset: number, hours = 0, minutes = 0): Date {
  const base = new Date();
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, hours, minutes);
}

function initialEvents(): Meeting[] {
  return [
    { id: 'e1', title: 'Standup', start: day(0, 9, 0), end: day(0, 9, 15), color: '#4f6df5' },
    { id: 'e2', title: 'Design review', start: day(0, 10, 0), end: day(0, 11, 30), color: '#a855f7' },
    { id: 'e3', title: 'Pairing: billing webhook', start: day(0, 10, 30), end: day(0, 12, 0), color: '#06b6d4' },
    { id: 'e4', title: 'Lunch with Priya', start: day(0, 12, 30), end: day(0, 13, 30), color: '#f59e0b' },
    { id: 'e5', title: 'Company all-hands', start: day(1, 0, 0), end: day(2, 0, 0), allDay: true, color: '#22c55e' },
    { id: 'e6', title: 'Roadmap workshop', start: day(1, 14, 0), end: day(1, 16, 0), color: '#ec4899' },
    { id: 'e7', title: 'Offsite', start: day(3, 0, 0), end: day(6, 0, 0), allDay: true, color: '#0091ff' },
    { id: 'e8', title: 'Payroll cut-off', start: day(-2, 16, 0), end: day(-2, 16, 30), color: '#e5484d', locked: true },
    { id: 'e9', title: '1:1 with Sam', start: day(2, 9, 30), end: day(2, 10, 0), color: '#4f6df5' },
    { id: 'e10', title: 'Retro', start: day(4, 15, 0), end: day(4, 16, 0), color: '#a855f7' },
  ];
}

function Preview({ values }: { values: ControlValues }) {
  const [events, setEvents] = useState<Meeting[]>(initialEvents);
  const [view, setView] = useState<CalendarView>((values.view as CalendarView) ?? 'week');
  const [date, setDate] = useState(() => new Date());

  // The `view` control drives the component; switching views inside the demo keeps working
  // because the component is controlled from this state.
  useEffect(() => setView(values.view as CalendarView), [values.view]);

  const weekStartsOn = Number(values.weekStartsOn ?? 1) as WeekStartsOn;
  const slotMinutes = Number(values.slotMinutes ?? 30) as 15 | 30 | 60;
  const containerClass = useMemo(
    () => (values.forceMobile ? 'sc-event-calendar-container sc-event-calendar-container--mobile' : 'sc-event-calendar-container'),
    [values.forceMobile],
  );

  const patch = (id: string, changes: Partial<Meeting>) =>
    setEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...changes } : e)));

  return (
    <div className={containerClass}>
      <EventCalendar<Meeting>
        events={events}
        eventId={(e) => e.id}
        eventStart={(e) => e.start}
        eventEnd={(e) => e.end}
        eventTitle={(e) => e.title}
        eventAllDay={(e) => !!e.allDay}
        eventColor={(e) => e.color}
        eventEditable={(e) => !e.locked}
        view={view}
        onViewChange={setView}
        date={date}
        onDateChange={setDate}
        weekStartsOn={weekStartsOn}
        slotMinutes={slotMinutes}
        timeFormat={(values.timeFormat as '12h' | '24h') ?? '24h'}
        locale="en-GB"
        loading={!!values.loading}
        forceMobile={!!values.forceMobile}
        onEventClick={(e) => toast.info({ message: `Opened "${e.title}"`, duration: 2000 })}
        onSlotClick={({ start, allDay }) =>
          toast.info({ message: `New ${allDay ? 'all-day ' : ''}event at ${start.toLocaleString('en-GB')}`, duration: 2500 })
        }
        onRangeSelect={({ start, end, allDay }) => {
          const id = `new-${Date.now()}`;
          setEvents((prev) => [...prev, { id, title: 'New event', start, end, allDay, color: '#30a46c' }]);
          toast.success({ message: 'Created an event from the selection', duration: 2000 });
        }}
        onEventMove={({ event, start, end, allDay }) => {
          patch(event.id, { start, end, allDay });
          toast.info({ message: `Moved "${event.title}"`, duration: 1500 });
        }}
        onEventResize={({ event, start, end }) => {
          patch(event.id, { start, end });
          toast.info({ message: `Resized "${event.title}"`, duration: 1500 });
        }}
      />
    </div>
  );
}

const demo: DemoDef = {
  title: 'Event Calendar',
  description:
    'Generic controlled calendar with month, week, day and agenda views. Events are read through accessor props, so any row shape works. Click empty space to create, drag an event to move it, drag its top/bottom edge to resize, and drag across empty space to select a range. The "Payroll cut-off" event is read-only (eventEditable returns false) so it refuses drags. Turn on forceMobile to see the compact month grid with the tapped day listed below it.',
  controls: [
    { type: 'select', name: 'view', label: 'view', options: ['week', 'month', 'day', 'agenda'], defaultValue: 'week' },
    { type: 'select', name: 'weekStartsOn', label: 'weekStartsOn', options: ['1', '0'], defaultValue: '1' },
    { type: 'select', name: 'slotMinutes', label: 'slotMinutes', options: ['30', '15', '60'], defaultValue: '30' },
    { type: 'select', name: 'timeFormat', label: 'timeFormat', options: ['24h', '12h'], defaultValue: '24h' },
    { type: 'boolean', name: 'forceMobile', label: 'forceMobile', defaultValue: false },
    { type: 'boolean', name: 'loading', label: 'loading', defaultValue: false },
  ],
  render: (values) => <Preview values={values} />,
  code: (values) => `import { EventCalendar, getVisibleRange, type CalendarView } from '@dinesh-gamage/uikit/event-calendar';

const [view, setView] = useState<CalendarView>('${values.view}');
const [date, setDate] = useState(() => new Date());
const [events, setEvents] = useState<Meeting[]>([]);

<EventCalendar<Meeting>
  events={events}
  eventId={(e) => e.id}
  eventStart={(e) => e.start}
  eventEnd={(e) => e.end}
  eventTitle={(e) => e.title}
  eventAllDay={(e) => !!e.allDay}
  eventColor={(e) => e.color}
  eventEditable={(e) => !e.locked}
  view={view}
  onViewChange={setView}
  date={date}
  onDateChange={setDate}
  weekStartsOn={${values.weekStartsOn}}
  slotMinutes={${values.slotMinutes}}
  timeFormat="${values.timeFormat}"
  onVisibleRangeChange={({ start, end }) => fetchEvents(start, end)}
  onEventClick={(e, anchor) => openDetails(e, anchor)}
  onSlotClick={({ start, end, allDay }) => openCreateModal({ start, end, allDay })}
  onRangeSelect={({ start, end, allDay }) => openCreateModal({ start, end, allDay })}
  onEventMove={({ event, start, end, allDay }) => save({ ...event, start, end, allDay })}
  onEventResize={({ event, start, end }) => save({ ...event, start, end })}
/>`,
};

export default function EventCalendarDemo() {
  return <DemoPage demo={demo} />;
}
