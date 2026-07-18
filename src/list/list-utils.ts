export interface ListSort {
  field: string;
  dir: 'asc' | 'desc';
}

/** Case-insensitive substring filter over the given fields (all own keys when fields omitted). */
export function applyQuery<T extends Record<string, any>>(items: T[], query: string, fields?: (keyof T)[]): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const keys = fields && fields.length > 0 ? fields : (Object.keys(item) as (keyof T)[]);
    return keys.some((key) => {
      const value = item[key];
      return value != null && String(value).toLowerCase().includes(q);
    });
  });
}

/** Stable, non-mutating sort. Numbers compare numerically, everything else as locale strings. Nulls sort last. */
export function applySort<T extends Record<string, any>>(items: T[], sort: ListSort | null): T[] {
  if (!sort) return items;
  const mul = sort.dir === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => {
    const av = a[sort.field];
    const bv = b[sort.field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul;
    return String(av).localeCompare(String(bv)) * mul;
  });
}

/** Slice out one page (1-based). */
export function paginate<T>(items: T[], page: number, pageSize: number): { items: T[]; total: number } {
  const start = (page - 1) * pageSize;
  return { items: items.slice(start, start + pageSize), total: items.length };
}
