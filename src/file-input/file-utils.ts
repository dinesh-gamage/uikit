/** True when the file matches any accept entry (mime wildcard 'image/*', exact mime, or '.ext'). */
export function matchesAccept(file: File, accept?: string[]): boolean {
  if (!accept || accept.length === 0) return true;
  const name = file.name.toLowerCase();
  const type = (file.type || '').toLowerCase();
  return accept.some((entry) => {
    const a = entry.trim().toLowerCase();
    if (!a) return false;
    if (a.startsWith('.')) return name.endsWith(a);
    if (a.endsWith('/*')) return type.startsWith(a.slice(0, -1));
    return type === a;
  });
}

export function exceedsMaxSize(file: File, maxSize?: number): boolean {
  return maxSize != null && file.size > maxSize;
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '0 B';
  if (n < 1024) return `${n} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let value = n;
  let i = -1;
  do {
    value /= 1024;
    i++;
  } while (value >= 1024 && i < units.length - 1);
  const rounded = value >= 10 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[i]}`;
}

/** Returns an error message when the file fails accept or size validation, else null. */
export function validateFile(file: File, accept?: string[], maxSize?: number): string | null {
  if (!matchesAccept(file, accept)) return `"${file.name}" is not an accepted file type`;
  if (exceedsMaxSize(file, maxSize)) return `"${file.name}" exceeds the ${formatBytes(maxSize as number)} limit`;
  return null;
}
