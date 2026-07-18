import {
  Fragment,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../utils/cx';
import { useBreakpoint } from '../utils/use-breakpoint';
import { Skeleton } from '../skeleton';
import { Spinner } from '../spinner';
import { InfoCard, type InfoField } from '../info-card';
import { Pagination } from '../pagination';
import { Breadcrumb } from '../breadcrumb';
import { applyQuery, applySort, paginate, type ListSort } from './list-utils';
import './list.scss';

export interface ListFetcherArgs {
  page: number;
  pageSize: number;
  query: string;
  sort: ListSort | null;
}

export type ListFetcher<T> = (args: ListFetcherArgs) => Promise<{ items: T[]; total: number }>;

export interface ListColumn<T> {
  id: string;
  label: ReactNode;
  width?: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
}

export interface ListTab {
  id: string;
  label: ReactNode;
  count?: number;
}

export interface ListBreadcrumbItem {
  label: ReactNode;
  onClick?: () => void;
}

export interface ListSearchConfig<T> {
  enabled: boolean;
  placeholder?: string;
  fields?: (keyof T)[];
}

export interface ListDetailsPanel<T> {
  title: (item: T) => ReactNode;
  fields?: (item: T) => InfoField[];
  /** Full custom panel body; wins over `fields`. */
  render?: (item: T, close: () => void) => ReactNode;
}

export interface ListViewHandle {
  /** Refetch the current page (fetcher mode). */
  refresh(): void;
  /** Set the search query programmatically (resets to page 1). */
  setQuery(q: string): void;
}

export interface ListViewProps<T extends Record<string, any>> {
  /** Static rows (client-side search/sort/pagination) or an async fetcher. */
  data: T[] | ListFetcher<T>;
  idField: keyof T;
  columns: ListColumn<T>[];
  pageSize?: number;
  paginationMode?: 'paged' | 'infinite';
  /** Full-row override. Return a `<tr>`; `defaultCells` are the rendered `<td>`s for `columns`. */
  renderRow?: (item: T, defaultCells: ReactNode[]) => ReactNode;
  title?: ReactNode;
  breadcrumb?: ListBreadcrumbItem[];
  tabs?: ListTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  /** Right-aligned actions area. */
  toolbar?: ReactNode;
  search?: ListSearchConfig<T>;
  selectable?: boolean;
  selected?: T[];
  onSelect?: (items: T[]) => void;
  detailsPanel?: ListDetailsPanel<T>;
  /** Overrides the details panel row behavior. */
  onRowClick?: (item: T) => void;
  emptyMessage?: ReactNode;
  allowPageSizeChange?: boolean;
  className?: string;
  ref?: Ref<ListViewHandle>;
  /**
   * Viewport width (px) at or below which the table switches to a stacked card layout. Default
   * 640 (matches `--uikit-breakpoint-sm`). Sorting stays desktop-only for v1 — cards have no
   * header row to click, so a previously-applied sort still orders the cards but there's no
   * mobile control to change it.
   */
  mobileBreakpoint?: number;
  /** Column ids to show per card on mobile, in `columns` order. Defaults to all `columns`. */
  mobileColumns?: string[];
  /** Override the mobile card body. `defaultCard` is the standard label/value card for the row. */
  renderMobileCard?: (item: T, defaultCard: ReactNode) => ReactNode;
  /**
   * @internal Showcase-only escape hatch that forces the mobile card layout regardless of
   * viewport width, so demos can preview it without resizing the window. Not part of the
   * supported public API — do not rely on this in application code.
   */
  forceMobile?: boolean;
}

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
const MAX_SKELETON_ROWS = 8;

export function ListView<T extends Record<string, any>>(props: ListViewProps<T>) {
  const {
    data,
    idField,
    columns,
    pageSize: pageSizeProp = 20,
    paginationMode = 'paged',
    renderRow,
    title,
    breadcrumb,
    tabs,
    activeTab,
    onTabChange,
    toolbar,
    search,
    selectable,
    selected,
    onSelect,
    detailsPanel,
    onRowClick,
    emptyMessage = 'No items',
    allowPageSizeChange = true,
    className,
    ref,
    mobileBreakpoint = 640,
    mobileColumns,
    renderMobileCard,
    forceMobile,
  } = props;

  const isStatic = Array.isArray(data);
  const isMobile = useBreakpoint(mobileBreakpoint) || !!forceMobile;

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeProp);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<ListSort | null>(null);
  const [remote, setRemote] = useState<{ items: T[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(!isStatic);
  const [hasLoaded, setHasLoaded] = useState(isStatic);
  const [error, setError] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [detailsItem, setDetailsItem] = useState<T | null>(null);
  const [internalSelected, setInternalSelected] = useState<T[]>([]);

  // Reset to page 1 when the view context changes (tab, debounced query, page size prop, mode).
  const [prevContext, setPrevContext] = useState({ activeTab, query, pageSizeProp, paginationMode });
  if (
    prevContext.activeTab !== activeTab ||
    prevContext.query !== query ||
    prevContext.pageSizeProp !== pageSizeProp ||
    prevContext.paginationMode !== paginationMode
  ) {
    if (prevContext.pageSizeProp !== pageSizeProp) setPageSize(pageSizeProp);
    setPrevContext({ activeTab, query, pageSizeProp, paginationMode });
    setPage(1);
  }

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Fetcher mode: load data whenever the request shape changes.
  const fetcherRef = useRef<ListFetcher<T> | null>(null);
  fetcherRef.current = isStatic ? null : (data as ListFetcher<T>);
  const reqIdRef = useRef(0);
  const sortKey = sort ? `${sort.field}:${sort.dir}` : '';

  useEffect(() => {
    if (isStatic) return;
    const fetcher = fetcherRef.current;
    if (!fetcher) return;
    const id = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    fetcher({ page, pageSize, query, sort })
      .then((res) => {
        if (id !== reqIdRef.current) return;
        setRemote((prev) => ({
          items: paginationMode === 'infinite' && page > 1 ? [...prev.items, ...res.items] : res.items,
          total: res.total,
        }));
        setHasLoaded(true);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (id !== reqIdRef.current) return;
        setError(err instanceof Error ? err.message : 'Failed to load');
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStatic, page, pageSize, query, sortKey, activeTab, paginationMode, refreshTick]);

  // Static mode: client-side search, sort, and pagination.
  const staticResult = useMemo(() => {
    if (!isStatic) return null;
    const rows = applySort(applyQuery(data as T[], query, search?.fields), sort);
    if (paginationMode === 'infinite') return { items: rows.slice(0, page * pageSize), total: rows.length };
    return paginate(rows, page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStatic, data, query, sort, page, pageSize, paginationMode]);

  const items = isStatic ? staticResult!.items : remote.items;
  const total = isStatic ? staticResult!.total : remote.total;

  useImperativeHandle(
    ref,
    () => ({
      refresh: () => {
        if (!isStatic && paginationMode === 'infinite') {
          setRemote({ items: [], total: 0 });
          setPage(1);
        }
        setRefreshTick((t) => t + 1);
      },
      setQuery: (q: string) => {
        setSearchInput(q);
        setQuery(q);
      },
    }),
    [isStatic, paginationMode]
  );

  // Escape closes the details panel.
  useEffect(() => {
    if (detailsItem == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDetailsItem(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [detailsItem]);

  // Infinite mode sentinel.
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadStateRef = useRef({ loading, count: items.length, total, error });
  loadStateRef.current = { loading, count: items.length, total, error };

  useEffect(() => {
    if (paginationMode !== 'infinite') return;
    const el = sentinelRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      const s = loadStateRef.current;
      if (entries.some((e) => e.isIntersecting) && !s.loading && !s.error && s.count < s.total) {
        setPage((p) => p + 1);
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [paginationMode, items.length, loading, error]);

  // Selection.
  const selectedItems = selected ?? internalSelected;
  const isItemSelected = (item: T) => selectedItems.some((s) => s[idField] === item[idField]);
  const updateSelected = (next: T[]) => {
    if (selected === undefined) setInternalSelected(next);
    onSelect?.(next);
  };
  const toggleItem = (item: T) => {
    updateSelected(
      isItemSelected(item)
        ? selectedItems.filter((s) => s[idField] !== item[idField])
        : [...selectedItems, item]
    );
  };
  const allVisibleSelected = items.length > 0 && items.every(isItemSelected);
  const someVisibleSelected = items.some(isItemSelected);
  const toggleAll = () => {
    if (allVisibleSelected) {
      const visibleIds = new Set(items.map((i) => i[idField]));
      updateSelected(selectedItems.filter((s) => !visibleIds.has(s[idField])));
    } else {
      updateSelected([...selectedItems, ...items.filter((i) => !isItemSelected(i))]);
    }
  };

  const handleSort = (col: ListColumn<T>) => {
    if (!col.sortable) return;
    setSort((prev) => {
      if (!prev || prev.field !== col.id) return { field: col.id, dir: 'asc' };
      return prev.dir === 'asc' ? { field: col.id, dir: 'desc' } : null;
    });
    setPage(1);
  };

  const closeDetails = () => setDetailsItem(null);
  const handleRowClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
      return;
    }
    if (detailsPanel) {
      setDetailsItem((cur) => (cur != null && cur[idField] === item[idField] ? null : item));
    }
  };

  const showSkeleton = loading && !hasLoaded;
  const showLoadMore = loading && paginationMode === 'infinite' && page > 1;
  const showProgress = loading && hasLoaded && !showLoadMore;
  const colCount = columns.length + (selectable ? 1 : 0);
  const rowsClickable = !!(onRowClick || detailsPanel);

  const defaultCell = (value: unknown): ReactNode => (value == null ? '—' : (value as ReactNode));

  const bodyRows = items.map((item) => {
    const cells = columns.map((col) => (
      <td className="uikit-list__td" key={col.id}>
        {col.render ? col.render(item) : defaultCell(item[col.id])}
      </td>
    ));
    if (renderRow) return <Fragment key={String(item[idField])}>{renderRow(item, cells)}</Fragment>;
    return (
      <tr
        key={String(item[idField])}
        className={cx('uikit-list__row', {
          'uikit-list__row--clickable': rowsClickable,
          'uikit-list__row--active': detailsItem != null && detailsItem[idField] === item[idField],
          'uikit-list__row--selected': !!selectable && isItemSelected(item),
        })}
        onClick={() => handleRowClick(item)}
      >
        {selectable && (
          <td className="uikit-list__td uikit-list__td--check" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              className="uikit-list__checkbox"
              checked={isItemSelected(item)}
              onChange={() => toggleItem(item)}
              aria-label="Select row"
            />
          </td>
        )}
        {cells}
      </tr>
    );
  });

  const skeletonRows = Array.from({ length: Math.min(pageSize, MAX_SKELETON_ROWS) }, (_, i) => (
    <tr className="uikit-list__row uikit-list__row--skeleton" key={i}>
      {selectable && (
        <td className="uikit-list__td uikit-list__td--check">
          <Skeleton variant="rect" width={16} height={16} />
        </td>
      )}
      {columns.map((col, j) => (
        <td className="uikit-list__td" key={col.id}>
          <Skeleton width={`${45 + ((i * 17 + j * 23) % 40)}%`} />
        </td>
      ))}
    </tr>
  ));

  // Mobile card layout: same columns/render functions as the table, one card per row.
  const mobileCols = mobileColumns && mobileColumns.length > 0
    ? columns.filter((col) => mobileColumns.includes(col.id))
    : columns;

  const buildDefaultCard = (item: T): ReactNode => (
    <div className="uikit-list__card-fields">
      {mobileCols.map((col) => (
        <div className="uikit-list__card-field" key={col.id}>
          <span className="uikit-list__card-label">{col.label}</span>
          <span className="uikit-list__card-value">{col.render ? col.render(item) : defaultCell(item[col.id])}</span>
        </div>
      ))}
    </div>
  );

  const mobileCards = items.map((item) => {
    const defaultCard = buildDefaultCard(item);
    return (
      <div
        key={String(item[idField])}
        className={cx('uikit-list__card', {
          'uikit-list__card--clickable': rowsClickable,
          'uikit-list__card--active': detailsItem != null && detailsItem[idField] === item[idField],
          'uikit-list__card--selected': !!selectable && isItemSelected(item),
        })}
        onClick={() => handleRowClick(item)}
      >
        {selectable && (
          <input
            type="checkbox"
            className="uikit-list__card-checkbox"
            checked={isItemSelected(item)}
            onChange={() => toggleItem(item)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Select row"
          />
        )}
        {renderMobileCard ? renderMobileCard(item, defaultCard) : defaultCard}
      </div>
    );
  });

  const mobileSkeletonCards = Array.from({ length: Math.min(pageSize, MAX_SKELETON_ROWS) }, (_, i) => (
    <div className="uikit-list__card uikit-list__card--skeleton" key={i}>
      {selectable && <Skeleton className="uikit-list__card-checkbox" variant="rect" width={15} height={15} />}
      <div className="uikit-list__card-fields">
        {mobileCols.map((col, j) => (
          <div className="uikit-list__card-field" key={col.id}>
            <span className="uikit-list__card-label">{col.label}</span>
            <Skeleton width={`${45 + ((i * 17 + j * 23) % 40)}%`} />
          </div>
        ))}
      </div>
    </div>
  ));

  return (
    <div className={cx('uikit-list', className)}>
      {(title != null || (breadcrumb && breadcrumb.length > 0) || toolbar != null) && (
        <div className="uikit-list__head">
          <div className="uikit-list__head-main">
            {breadcrumb && breadcrumb.length > 0 && (
              <Breadcrumb
                className="uikit-list__breadcrumb"
                items={breadcrumb.map((crumb) => ({ label: crumb.label, onClick: crumb.onClick }))}
              />
            )}
            {title != null && <h2 className="uikit-list__title">{title}</h2>}
          </div>
          {toolbar != null && <div className="uikit-list__toolbar">{toolbar}</div>}
        </div>
      )}

      {tabs && tabs.length > 0 && (
        <div className="uikit-list__tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === activeTab}
              className={cx('uikit-list__tab', { 'uikit-list__tab--active': tab.id === activeTab })}
              onClick={() => onTabChange?.(tab.id)}
            >
              {tab.label}
              {tab.count != null && <span className="uikit-list__tab-count">{tab.count}</span>}
            </button>
          ))}
        </div>
      )}

      {search?.enabled && (
        <div className="uikit-list__search">
          <input
            type="search"
            className="uikit-list__search-input"
            placeholder={search.placeholder ?? 'Search…'}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search list"
          />
        </div>
      )}

      <div className="uikit-list__body">
        <div className="uikit-list__main">
          {showProgress && (
            <div className="uikit-list__progress" role="progressbar" aria-label="Loading">
              <span />
            </div>
          )}

          {error != null ? (
            <div className="uikit-list__error" role="alert">
              <p className="uikit-list__error-message">{error}</p>
              <button type="button" className="uikit-list__retry" onClick={() => setRefreshTick((t) => t + 1)}>
                Retry
              </button>
            </div>
          ) : isMobile ? (
            <div className="uikit-list__cards">
              {showSkeleton ? (
                mobileSkeletonCards
              ) : items.length === 0 && !loading ? (
                <div className="uikit-list__empty uikit-list__empty--cards">{emptyMessage}</div>
              ) : (
                mobileCards
              )}
            </div>
          ) : (
            <div className="uikit-list__table-wrap">
              <table className="uikit-list__table">
                <thead>
                  <tr>
                    {selectable && (
                      <th className="uikit-list__th uikit-list__th--check">
                        <input
                          type="checkbox"
                          className="uikit-list__checkbox"
                          checked={allVisibleSelected}
                          ref={(el) => {
                            if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                          }}
                          onChange={toggleAll}
                          aria-label="Select all rows"
                        />
                      </th>
                    )}
                    {columns.map((col) => (
                      <th
                        key={col.id}
                        className={cx('uikit-list__th', { 'uikit-list__th--sortable': !!col.sortable })}
                        style={col.width ? { width: col.width } : undefined}
                        aria-sort={
                          col.sortable
                            ? sort?.field === col.id
                              ? sort.dir === 'asc'
                                ? 'ascending'
                                : 'descending'
                              : 'none'
                            : undefined
                        }
                        onClick={() => handleSort(col)}
                      >
                        <span className="uikit-list__th-inner">
                          {col.label}
                          {col.sortable && (
                            <span
                              className={cx('uikit-list__sort', sort?.field === col.id && `uikit-list__sort--${sort.dir}`)}
                              aria-hidden="true"
                            />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {showSkeleton ? (
                    skeletonRows
                  ) : items.length === 0 && !loading ? (
                    <tr>
                      <td className="uikit-list__empty" colSpan={colCount}>
                        {emptyMessage}
                      </td>
                    </tr>
                  ) : (
                    bodyRows
                  )}
                </tbody>
              </table>
            </div>
          )}

          {paginationMode === 'paged' && error == null && (
            <Pagination
              className="uikit-list__pagination"
              page={page}
              pageSize={pageSize}
              total={total}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              allowPageSizeChange={allowPageSizeChange}
            />
          )}

          {paginationMode === 'infinite' && error == null && (
            <>
              {showLoadMore && (
                <div className="uikit-list__load-more">
                  <Spinner size="sm" label="Loading more…" />
                </div>
              )}
              <div ref={sentinelRef} className="uikit-list__sentinel" aria-hidden="true" />
            </>
          )}
        </div>

        {detailsPanel && detailsItem != null && (
          <aside className={cx('uikit-list__panel', { 'uikit-list__panel--mobile': isMobile })} aria-label="Details">
            <div className="uikit-list__panel-head">
              <div className="uikit-list__panel-title">{detailsPanel.title(detailsItem)}</div>
              <button type="button" className="uikit-list__panel-close" onClick={closeDetails} aria-label="Close details">
                ×
              </button>
            </div>
            <div className="uikit-list__panel-body">
              {detailsPanel.render ? (
                detailsPanel.render(detailsItem, closeDetails)
              ) : (
                <InfoCard fields={detailsPanel.fields?.(detailsItem) ?? []} columns={1} />
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
