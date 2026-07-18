import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Dropdown } from '../dropdown';
import './breadcrumb.scss';

export interface BreadcrumbItem {
  label: ReactNode;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /** Collapse the middle into an ellipsis menu once `items.length` exceeds this. Default 4. */
  maxItems?: number;
  separator?: ReactNode;
  className?: string;
}

type Entry = BreadcrumbItem | { collapsed: BreadcrumbItem[] };

function isCollapsedEntry(entry: Entry): entry is { collapsed: BreadcrumbItem[] } {
  return 'collapsed' in entry;
}

function DefaultSeparator() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
      <path d="M6 3l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CrumbContent({ item }: { item: BreadcrumbItem }) {
  return (
    <>
      {item.icon != null && <span className="uikit-breadcrumb__icon">{item.icon}</span>}
      <span className="uikit-breadcrumb__label">{item.label}</span>
    </>
  );
}

function Crumb({ item, current }: { item: BreadcrumbItem; current: boolean }) {
  if (current) {
    return (
      <span className="uikit-breadcrumb__crumb uikit-breadcrumb__crumb--current" aria-current="page">
        <CrumbContent item={item} />
      </span>
    );
  }
  if (item.href) {
    return (
      <a className="uikit-breadcrumb__crumb" href={item.href} onClick={item.onClick}>
        <CrumbContent item={item} />
      </a>
    );
  }
  if (item.onClick) {
    return (
      <button type="button" className="uikit-breadcrumb__crumb uikit-breadcrumb__crumb--link" onClick={item.onClick}>
        <CrumbContent item={item} />
      </button>
    );
  }
  return (
    <span className="uikit-breadcrumb__crumb">
      <CrumbContent item={item} />
    </span>
  );
}

function MenuRow({ item, onNavigate }: { item: BreadcrumbItem; onNavigate: () => void }) {
  const content = (
    <>
      {item.icon != null && <span className="uikit-breadcrumb__icon">{item.icon}</span>}
      <span>{item.label}</span>
    </>
  );
  const handleClick = (e: MouseEvent) => {
    item.onClick?.();
    onNavigate();
    if (!item.href) e.preventDefault();
  };
  if (item.href) {
    return (
      <a role="menuitem" className="uikit-breadcrumb__menu-item" href={item.href} onClick={handleClick}>
        {content}
      </a>
    );
  }
  return (
    <button type="button" role="menuitem" className="uikit-breadcrumb__menu-item" onClick={handleClick}>
      {content}
    </button>
  );
}

function CollapsedMenu({ items }: { items: BreadcrumbItem[] }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        type="button"
        ref={anchorRef}
        className="uikit-breadcrumb__ellipsis"
        aria-label="Show hidden breadcrumb items"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        …
      </button>
      <Dropdown open={open} onClose={() => setOpen(false)} anchorRef={anchorRef} position="bottom-start" minWidth={160}>
        <div className="uikit-breadcrumb__menu" role="menu">
          {items.map((item, i) => (
            <MenuRow key={i} item={item} onNavigate={() => setOpen(false)} />
          ))}
        </div>
      </Dropdown>
    </>
  );
}

export function Breadcrumb({ items, maxItems = 4, separator, className }: BreadcrumbProps) {
  const sep = separator ?? <DefaultSeparator />;
  const shouldCollapse = items.length > maxItems;
  const visible: Entry[] = shouldCollapse
    ? [items[0], { collapsed: items.slice(1, items.length - 2) }, ...items.slice(items.length - 2)]
    : items;

  return (
    <nav className={cx('uikit-breadcrumb', className)} aria-label="Breadcrumb">
      <ol className="uikit-breadcrumb__list">
        {visible.map((entry, i) => {
          const isLast = i === visible.length - 1;
          return (
            <li className="uikit-breadcrumb__item" key={i}>
              {isCollapsedEntry(entry) ? <CollapsedMenu items={entry.collapsed} /> : <Crumb item={entry} current={isLast} />}
              {!isLast && (
                <span className="uikit-breadcrumb__sep" aria-hidden="true">
                  {sep}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
