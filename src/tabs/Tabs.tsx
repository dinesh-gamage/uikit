import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Dropdown, DropdownIndicator } from '../dropdown';
import './tabs.scss';

export interface TabDef {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  /** Badge count shown next to the label. */
  count?: number;
  disabled?: boolean;
  content?: ReactNode;
}

export type TabsVariant = 'underline' | 'pills';
export type TabsSize = 'sm' | 'md';

export interface TabsProps {
  tabs: TabDef[];
  active: string;
  onChange: (id: string) => void;
  variant?: TabsVariant;
  size?: TabsSize;
  /** Keep all tab panels mounted, hiding inactive ones with CSS. Default false (only active is mounted). */
  keepMounted?: boolean;
  /** Render the panel content below the header. Defaults to true when any tab has `content`. */
  renderContent?: boolean;
  /** Extra content slot at the start of the header row (e.g. a context switcher), before the tabs. */
  leftContent?: ReactNode;
  /** Extra content slot at the end of the header row (e.g. actions). */
  rightContent?: ReactNode;
  /** Draw a thin vertical divider between `leftContent`/`rightContent` and the tab list. */
  separator?: boolean;
  className?: string;
}

const GAP = 4;

export function Tabs({ tabs, active, onChange, variant = 'underline', size = 'md', keepMounted = false, renderContent, leftContent, rightContent, separator, className }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const moreMeasureRef = useRef<HTMLButtonElement>(null);
  const moreBtnRef = useRef<HTMLButtonElement>(null);
  const measureRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  const [containerWidth, setContainerWidth] = useState(0);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(() => new Set(tabs.map((t) => t.id)));
  const [moreOpen, setMoreOpen] = useState(false);
  const [focusedId, setFocusedId] = useState(active);

  useEffect(() => setFocusedId(active), [active]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w != null) setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Recompute which tabs fit in the header, giving priority to the active tab (it's always kept visible).
  useLayoutEffect(() => {
    if (!containerWidth) return;
    const rightW = rightRef.current?.offsetWidth ?? 0;
    const leftW = leftRef.current?.offsetWidth ?? 0;
    const moreW = moreMeasureRef.current?.offsetWidth ?? 0;
    // The left/right slots (and the header's 8px gaps around them) eat into the width the tab
    // list has to work with — subtract them or the list overflows into "More" too eagerly.
    const available = containerWidth - rightW - leftW;

    let used = 0;
    const fitIdx = new Set<number>();
    for (let i = 0; i < tabs.length; i++) {
      const el = measureRefs.current.get(tabs[i].id);
      const w = el?.offsetWidth ?? 0;
      const withGap = w + (i > 0 ? GAP : 0);
      const isLast = i === tabs.length - 1;
      const reserve = isLast ? 0 : moreW + GAP;
      if (used + withGap + reserve <= available) {
        fitIdx.add(i);
        used += withGap;
      } else {
        break;
      }
    }

    const activeIdx = tabs.findIndex((t) => t.id === active);
    if (activeIdx >= 0 && !fitIdx.has(activeIdx)) {
      let lastFit = -1;
      for (const idx of fitIdx) lastFit = Math.max(lastFit, idx);
      if (lastFit >= 0) fitIdx.delete(lastFit);
      fitIdx.add(activeIdx);
    }

    const allFit = fitIdx.size === tabs.length;
    const nextVisible = allFit ? new Set(tabs.map((t) => t.id)) : new Set(Array.from(fitIdx).map((i) => tabs[i].id));

    setVisibleIds((prev) => {
      if (prev.size === nextVisible.size && [...prev].every((id) => nextVisible.has(id))) return prev;
      return nextVisible;
    });
  }, [containerWidth, tabs, active]);

  const visibleTabs = tabs.filter((t) => visibleIds.has(t.id));
  const overflowTabs = tabs.filter((t) => !visibleIds.has(t.id));
  const shouldRenderContent = renderContent ?? tabs.some((t) => t.content !== undefined);

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const enabledVisible = visibleTabs.filter((t) => !t.disabled);
    if (enabledVisible.length === 0) return;
    const currentIdx = enabledVisible.findIndex((t) => t.id === focusedId);
    let nextIdx = currentIdx;
    if (e.key === 'ArrowRight') nextIdx = currentIdx < 0 ? 0 : (currentIdx + 1) % enabledVisible.length;
    else if (e.key === 'ArrowLeft') nextIdx = currentIdx < 0 ? 0 : (currentIdx - 1 + enabledVisible.length) % enabledVisible.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = enabledVisible.length - 1;
    else return;
    e.preventDefault();
    const nextTab = enabledVisible[nextIdx];
    setFocusedId(nextTab.id);
    tabRefs.current.get(nextTab.id)?.focus();
  };

  const tabButtonClass = (tab: TabDef) =>
    cx('uikit-tabs__tab', { 'uikit-tabs__tab--active': tab.id === active, 'uikit-tabs__tab--disabled': !!tab.disabled });

  const renderTabContents = (tab: TabDef) => (
    <>
      {tab.icon != null && <span className="uikit-tabs__icon">{tab.icon}</span>}
      <span className="uikit-tabs__label">{tab.label}</span>
      {tab.count != null && <span className="uikit-tabs__badge">{tab.count}</span>}
    </>
  );

  return (
    <div className={cx('uikit-tabs', `uikit-tabs--${variant}`, `uikit-tabs--${size}`, className)}>
      <div className="uikit-tabs__header" ref={containerRef}>
        {leftContent != null && (
          <div className="uikit-tabs__left" ref={leftRef}>
            {leftContent}
            {separator && <span className="uikit-tabs__sep" aria-hidden="true" />}
          </div>
        )}
        <div role="tablist" className="uikit-tabs__list" onKeyDown={onListKeyDown}>
          {visibleTabs.map((tab) => (
            <button
              key={tab.id}
              ref={(el) => {
                if (el) tabRefs.current.set(tab.id, el);
                else tabRefs.current.delete(tab.id);
              }}
              type="button"
              role="tab"
              id={`uikit-tab-${tab.id}`}
              aria-selected={tab.id === active}
              aria-controls={shouldRenderContent ? `uikit-tabpanel-${tab.id}` : undefined}
              aria-disabled={tab.disabled || undefined}
              disabled={tab.disabled}
              tabIndex={tab.id === focusedId ? 0 : -1}
              className={tabButtonClass(tab)}
              onClick={() => !tab.disabled && onChange(tab.id)}
            >
              {renderTabContents(tab)}
            </button>
          ))}

          {overflowTabs.length > 0 && (
            <div className="uikit-tabs__more-wrap">
              <button
                ref={moreBtnRef}
                type="button"
                className="uikit-tabs__more"
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                onClick={() => setMoreOpen((o) => !o)}
              >
                More
                <DropdownIndicator open={moreOpen} />
              </button>
              <Dropdown open={moreOpen} onClose={() => setMoreOpen(false)} anchorRef={moreBtnRef} position="bottom-end" minWidth={160}>
                <div className="uikit-tabs__menu" role="menu">
                  {overflowTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      role="menuitem"
                      disabled={tab.disabled}
                      className={cx('uikit-tabs__menu-item', { 'uikit-tabs__menu-item--active': tab.id === active })}
                      onClick={() => {
                        if (tab.disabled) return;
                        onChange(tab.id);
                        setMoreOpen(false);
                      }}
                    >
                      {renderTabContents(tab)}
                    </button>
                  ))}
                </div>
              </Dropdown>
            </div>
          )}
        </div>

        {rightContent != null && (
          <div className="uikit-tabs__right" ref={rightRef}>
            {separator && <span className="uikit-tabs__sep" aria-hidden="true" />}
            {rightContent}
          </div>
        )}
      </div>

      {/* Off-screen measurement row: mirrors every tab's real markup so we can read natural widths. */}
      <div className="uikit-tabs__measure" aria-hidden="true">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            ref={(el) => {
              if (el) measureRefs.current.set(tab.id, el);
              else measureRefs.current.delete(tab.id);
            }}
            type="button"
            tabIndex={-1}
            className={tabButtonClass(tab)}
          >
            {renderTabContents(tab)}
          </button>
        ))}
        <button ref={moreMeasureRef} type="button" tabIndex={-1} className="uikit-tabs__more">
          More
          <DropdownIndicator open={false} />
        </button>
      </div>

      {shouldRenderContent &&
        tabs.map((tab) => {
          const isActive = tab.id === active;
          if (!keepMounted && !isActive) return null;
          return (
            <div
              key={tab.id}
              role="tabpanel"
              id={`uikit-tabpanel-${tab.id}`}
              aria-labelledby={`uikit-tab-${tab.id}`}
              hidden={keepMounted && !isActive}
              className="uikit-tabs__panel"
            >
              {tab.content}
            </div>
          );
        })}
    </div>
  );
}
