export interface PaginationRange {
  /** 1-based index of the first item shown, 0 when the page is empty. */
  start: number;
  /** 1-based index of the last item shown, 0 when the page is empty. */
  end: number;
  /** "start–end of total" (known total) or "start–end" (unknown total). */
  label: string;
  hasNext: boolean;
}

/**
 * Pure helper behind `Pagination`'s range label and next-button state.
 *
 * - Known `total`: range is derived directly from `page`/`pageSize`/`total`.
 * - Unknown `total`: `pageLength` (item count actually rendered on this page) drives
 *   the range end and whether a next page might exist — a full page (`pageLength >=
 *   pageSize`) assumes there could be more; a short page means this is the last one.
 *   When `pageLength` is omitted, a full page is assumed.
 */
export function computeRange(page: number, pageSize: number, total?: number, pageLength?: number): PaginationRange {
  if (typeof total === 'number') {
    if (total <= 0) return { start: 0, end: 0, label: '0 of 0', hasNext: false };
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return { start, end, label: `${start}–${end} of ${total}`, hasNext: end < total };
  }

  const length = pageLength ?? pageSize;
  if (length <= 0) return { start: 0, end: 0, label: '0 of 0', hasNext: false };
  const start = (page - 1) * pageSize + 1;
  const end = start + length - 1;
  return { start, end, label: `${start}–${end}`, hasNext: length >= pageSize };
}
