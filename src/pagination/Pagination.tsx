import { cx } from '../utils/cx';
import { Skeleton } from '../skeleton';
import { Select } from '../select';
import { computeRange } from './pagination-utils';
import './pagination.scss';

export interface PaginationProps {
  /** 1-based current page. */
  page: number;
  pageSize: number;
  /** Total item count. Omit for unknown-total ("load more"-style) pagination. */
  total?: number;
  /** Item count actually rendered on the current page — used when `total` is unknown. */
  pageLength?: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  /** Defaults to `true` when `onPageSizeChange` is given. */
  allowPageSizeChange?: boolean;
  loading?: boolean;
  /** Hides the range label, keeping just the controls. */
  compact?: boolean;
  className?: string;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

function ChevronIcon({ direction }: { direction: 'prev' | 'next' }) {
  const d = direction === 'prev' ? 'M10 3L5 8l5 5' : 'M6 3l5 5-5 5';
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d={d} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  pageLength,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  allowPageSizeChange = onPageSizeChange != null,
  loading,
  compact,
  className,
}: PaginationProps) {
  if (loading) {
    return (
      <div className={cx('uikit-pagination', 'uikit-pagination--loading', className)}>
        {!compact && <Skeleton width={110} height={14} />}
        <Skeleton width={allowPageSizeChange ? 150 : 76} height={28} />
      </div>
    );
  }

  const range = computeRange(page, pageSize, total, pageLength);
  const prevDisabled = page <= 1;
  const nextDisabled = !range.hasNext;

  return (
    <div className={cx('uikit-pagination', { 'uikit-pagination--compact': !!compact }, className)}>
      {!compact && <span className="uikit-pagination__range">{range.label}</span>}
      <div className="uikit-pagination__controls">
        {allowPageSizeChange && (
          <div className="uikit-pagination__page-size">
            <span>Rows</span>
            <Select
              options={pageSizeOptions.map((n) => ({ value: n, label: String(n) }))}
              value={pageSize}
              onChange={(v) => onPageSizeChange?.(Number(v))}
              size="sm"
              pill
              clearable={false}
              searchable={false}
            />
          </div>
        )}
        <button
          type="button"
          className="uikit-pagination__btn"
          disabled={prevDisabled}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronIcon direction="prev" />
        </button>
        <button
          type="button"
          className="uikit-pagination__btn"
          disabled={nextDisabled}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronIcon direction="next" />
        </button>
      </div>
    </div>
  );
}
