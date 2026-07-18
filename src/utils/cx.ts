export type ClassValue = string | number | null | false | undefined | Record<string, boolean | null | undefined>;

export function cx(...args: ClassValue[]): string {
  const out: string[] = [];
  for (const a of args) {
    if (!a && a !== 0) continue;
    if (typeof a === 'string' || typeof a === 'number') {
      out.push(String(a));
    } else if (typeof a === 'object') {
      for (const k in a) if (a[k]) out.push(k);
    }
  }
  return out.join(' ');
}
