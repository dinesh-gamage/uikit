import { useRef, useState, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Dropdown } from '../dropdown';
import { Tabs } from '../tabs';
import { ChevronGlyph } from '../datetime/glyphs';
import type { CalendarView } from './event-calendar-utils';

const VIEW_LABELS: Record<CalendarView, string> = {
  month: 'Month',
  week: 'Week',
  day: 'Day',
  agenda: 'Agenda',
};

const VIEWS: CalendarView[] = ['month', 'week', 'day', 'agenda'];

export interface CalendarHeaderProps {
  view: CalendarView;
  onViewChange: (view: CalendarView) => void;
  /** Human range label, e.g. 'September 2026'. */
  label: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  mobile: boolean;
  headerLeft?: ReactNode;
  headerRight?: ReactNode;
}

export function CalendarHeader({
  view,
  onViewChange,
  label,
  onPrev,
  onNext,
  onToday,
  mobile,
  headerLeft,
  headerRight,
}: CalendarHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);

  const nav = (
    <div className="uikit-event-calendar__nav">
      <button type="button" className="uikit-event-calendar__nav-button" aria-label="Previous" onClick={onPrev}>
        <ChevronGlyph direction="left" />
      </button>
      <button type="button" className="uikit-event-calendar__today" onClick={onToday}>
        Today
      </button>
      <button type="button" className="uikit-event-calendar__nav-button" aria-label="Next" onClick={onNext}>
        <ChevronGlyph direction="right" />
      </button>
    </div>
  );

  const rangeLabel = (
    <div className="uikit-event-calendar__label" aria-live="polite">
      {label}
    </div>
  );

  const viewMenu = (
    <>
      <button
        type="button"
        ref={menuAnchorRef}
        className="uikit-event-calendar__view-trigger"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={`View: ${VIEW_LABELS[view]}`}
        onClick={() => setMenuOpen((o) => !o)}
      >
        {VIEW_LABELS[view]}
        <ChevronGlyph direction="right" />
      </button>
      {menuOpen && (
        <Dropdown open onClose={() => setMenuOpen(false)} anchorRef={menuAnchorRef} position="bottom-end" minWidth={140}>
          <div className="uikit-event-calendar__view-menu" role="menu">
            {VIEWS.map((v) => (
              <button
                key={v}
                type="button"
                role="menuitemradio"
                aria-checked={v === view}
                className={cx('uikit-event-calendar__view-menu-item', {
                  'uikit-event-calendar__view-menu-item--active': v === view,
                })}
                onClick={() => {
                  onViewChange(v);
                  setMenuOpen(false);
                }}
              >
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
        </Dropdown>
      )}
    </>
  );

  // Mobile: the range label gets its own row so the controls all fit one toolbar row below it.
  if (mobile) {
    return (
      <div className="uikit-event-calendar__header uikit-event-calendar__header--mobile">
        {rangeLabel}
        <div className="uikit-event-calendar__toolbar">
          {headerLeft}
          {nav}
          {viewMenu}
          <div className="uikit-event-calendar__toolbar-end">{headerRight}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="uikit-event-calendar__header">
      <div className="uikit-event-calendar__header-left">
        {headerLeft}
        {nav}
        {rangeLabel}
      </div>

      <div className="uikit-event-calendar__header-right">
        <div className="uikit-event-calendar__views">
          <Tabs
            variant="pills"
            size="sm"
            active={view}
            onChange={(id) => onViewChange(id as CalendarView)}
            tabs={VIEWS.map((v) => ({ id: v, label: VIEW_LABELS[v] }))}
          />
        </div>
        {headerRight}
      </div>
    </div>
  );
}
