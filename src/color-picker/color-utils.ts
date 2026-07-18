export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function hexPairToInt(hex: string): number {
  return parseInt(hex, 16);
}

/** Parses 3/4/6/8-digit hex (with or without '#') into RGBA, or null if invalid. */
export function hexToRgb(hex: string): RGBA | null {
  const raw = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]+$/.test(raw)) return null;

  if (raw.length === 3 || raw.length === 4) {
    const r = hexPairToInt(raw[0] + raw[0]);
    const g = hexPairToInt(raw[1] + raw[1]);
    const b = hexPairToInt(raw[2] + raw[2]);
    const a = raw.length === 4 ? hexPairToInt(raw[3] + raw[3]) / 255 : 1;
    return { r, g, b, a };
  }

  if (raw.length === 6 || raw.length === 8) {
    const r = hexPairToInt(raw.slice(0, 2));
    const g = hexPairToInt(raw.slice(2, 4));
    const b = hexPairToInt(raw.slice(4, 6));
    const a = raw.length === 8 ? hexPairToInt(raw.slice(6, 8)) / 255 : 1;
    return { r, g, b, a };
  }

  return null;
}

/** Formats RGB(A) as hex. Includes the alpha channel only when includeAlpha is true or a < 1. */
export function rgbToHex(rgba: RGBA, includeAlpha?: boolean): string {
  const toHexPair = (n: number) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
  const base = `#${toHexPair(rgba.r)}${toHexPair(rgba.g)}${toHexPair(rgba.b)}`;
  const wantsAlpha = includeAlpha ?? rgba.a < 1;
  return wantsAlpha ? `${base}${toHexPair(rgba.a * 255)}` : base;
}

/** Converts RGB (0-255) to HSV (h: 0-360, s/v: 0-100). */
export function rgbToHsv(r: number, g: number, b: number): HSV {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / delta) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / delta + 2);
    else h = 60 * ((rn - gn) / delta + 4);
  }
  if (h < 0) h += 360;

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s: s * 100, v: v * 100 };
}

/** Converts HSV (h: 0-360, s/v: 0-100) to RGB (0-255 integers). */
export function hsvToRgb(h: number, s: number, v: number): { r: number; g: number; b: number } {
  const hn = ((h % 360) + 360) % 360;
  const sn = clamp(s, 0, 100) / 100;
  const vn = clamp(v, 0, 100) / 100;

  const c = vn * sn;
  const x = c * (1 - Math.abs(((hn / 60) % 2) - 1));
  const m = vn - c;

  let rp = 0;
  let gp = 0;
  let bp = 0;
  if (hn < 60) [rp, gp, bp] = [c, x, 0];
  else if (hn < 120) [rp, gp, bp] = [x, c, 0];
  else if (hn < 180) [rp, gp, bp] = [0, c, x];
  else if (hn < 240) [rp, gp, bp] = [0, x, c];
  else if (hn < 300) [rp, gp, bp] = [x, 0, c];
  else [rp, gp, bp] = [c, 0, x];

  return {
    r: Math.round((rp + m) * 255),
    g: Math.round((gp + m) * 255),
    b: Math.round((bp + m) * 255),
  };
}

/** Parses hex ('#rgb', '#rgba', '#rrggbb', '#rrggbbaa') or rgb()/rgba() strings into RGBA, or null if invalid. */
export function parseColor(input: string): RGBA | null {
  const value = input.trim();
  if (value.startsWith('#')) return hexToRgb(value);

  const match = value.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i);
  if (match) {
    const r = clamp(Number(match[1]), 0, 255);
    const g = clamp(Number(match[2]), 0, 255);
    const b = clamp(Number(match[3]), 0, 255);
    const a = match[4] !== undefined ? clamp(Number(match[4]), 0, 1) : 1;
    if ([r, g, b, a].some((n) => Number.isNaN(n))) return null;
    return { r, g, b, a };
  }

  return null;
}

/** Formats an RGBA color as a hex or rgba() string. */
export function formatColor(rgba: RGBA, format: 'hex' | 'rgba'): string {
  if (format === 'rgba') {
    return `rgba(${Math.round(rgba.r)}, ${Math.round(rgba.g)}, ${Math.round(rgba.b)}, ${Number(rgba.a.toFixed(2))})`;
  }
  return rgbToHex(rgba);
}
