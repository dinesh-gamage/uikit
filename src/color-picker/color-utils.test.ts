import { describe, expect, it } from 'vitest';
import { formatColor, hexToRgb, hsvToRgb, parseColor, rgbToHex, rgbToHsv } from './color-utils';

describe('hexToRgb', () => {
  it('parses 6-digit hex', () => {
    expect(hexToRgb('#4f6df5')).toEqual({ r: 79, g: 109, b: 245, a: 1 });
  });

  it('parses 6-digit hex without leading #', () => {
    expect(hexToRgb('4f6df5')).toEqual({ r: 79, g: 109, b: 245, a: 1 });
  });

  it('parses 3-digit hex by doubling each digit', () => {
    expect(hexToRgb('#f00')).toEqual({ r: 255, g: 0, b: 0, a: 1 });
  });

  it('parses 8-digit hex with alpha', () => {
    expect(hexToRgb('#ff000080')).toEqual({ r: 255, g: 0, b: 0, a: 128 / 255 });
  });

  it('parses 4-digit hex with alpha', () => {
    expect(hexToRgb('#f008')).toEqual({ r: 255, g: 0, b: 0, a: 136 / 255 });
  });

  it('returns null for invalid input', () => {
    expect(hexToRgb('#zzzzzz')).toBeNull();
    expect(hexToRgb('#12345')).toBeNull();
    expect(hexToRgb('')).toBeNull();
  });
});

describe('rgbToHex', () => {
  it('formats opaque colors without alpha by default', () => {
    expect(rgbToHex({ r: 79, g: 109, b: 245, a: 1 })).toBe('#4f6df5');
  });

  it('includes alpha when a < 1', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0, a: 0.5 })).toBe('#ff000080');
  });

  it('forces alpha suffix when includeAlpha is true', () => {
    expect(rgbToHex({ r: 255, g: 0, b: 0, a: 1 }, true)).toBe('#ff0000ff');
  });
});

describe('hex round-trip', () => {
  it('round-trips through hexToRgb -> rgbToHex', () => {
    for (const hex of ['#000000', '#ffffff', '#4f6df5', '#e5484d']) {
      const rgba = hexToRgb(hex)!;
      expect(rgbToHex(rgba)).toBe(hex);
    }
  });
});

describe('rgbToHsv / hsvToRgb', () => {
  it('converts pure red', () => {
    expect(rgbToHsv(255, 0, 0)).toEqual({ h: 0, s: 100, v: 100 });
  });

  it('converts pure green', () => {
    const hsv = rgbToHsv(0, 255, 0);
    expect(hsv.h).toBeCloseTo(120);
    expect(hsv.s).toBeCloseTo(100);
    expect(hsv.v).toBeCloseTo(100);
  });

  it('converts black and white', () => {
    expect(rgbToHsv(0, 0, 0)).toEqual({ h: 0, s: 0, v: 0 });
    expect(rgbToHsv(255, 255, 255)).toEqual({ h: 0, s: 0, v: 100 });
  });

  it('round-trips rgb -> hsv -> rgb', () => {
    const samples: Array<[number, number, number]> = [
      [79, 109, 245],
      [229, 72, 77],
      [48, 164, 108],
      [10, 200, 30],
      [128, 64, 200],
    ];
    for (const [r, g, b] of samples) {
      const hsv = rgbToHsv(r, g, b);
      const back = hsvToRgb(hsv.h, hsv.s, hsv.v);
      expect(back.r).toBeCloseTo(r, 0);
      expect(back.g).toBeCloseTo(g, 0);
      expect(back.b).toBeCloseTo(b, 0);
    }
  });
});

describe('parseColor', () => {
  it('parses hex strings', () => {
    expect(parseColor('#4f6df5')).toEqual({ r: 79, g: 109, b: 245, a: 1 });
  });

  it('parses rgb() strings', () => {
    expect(parseColor('rgb(79, 109, 245)')).toEqual({ r: 79, g: 109, b: 245, a: 1 });
  });

  it('parses rgba() strings with alpha', () => {
    expect(parseColor('rgba(255, 0, 0, 0.5)')).toEqual({ r: 255, g: 0, b: 0, a: 0.5 });
  });

  it('parses rgba() without spaces', () => {
    expect(parseColor('rgba(1,2,3,0.25)')).toEqual({ r: 1, g: 2, b: 3, a: 0.25 });
  });

  it('returns null for invalid input', () => {
    expect(parseColor('not-a-color')).toBeNull();
    expect(parseColor('rgb(1,2)')).toBeNull();
    expect(parseColor('')).toBeNull();
  });
});

describe('formatColor', () => {
  it('formats as hex', () => {
    expect(formatColor({ r: 79, g: 109, b: 245, a: 1 }, 'hex')).toBe('#4f6df5');
  });

  it('formats as rgba', () => {
    expect(formatColor({ r: 255, g: 0, b: 0, a: 0.5 }, 'rgba')).toBe('rgba(255, 0, 0, 0.5)');
  });
});
