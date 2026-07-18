import { describe, expect, it } from 'vitest';
import { computeRange } from './pagination-utils';

describe('computeRange', () => {
  describe('known total', () => {
    it('computes a full first page', () => {
      expect(computeRange(1, 20, 45)).toEqual({ start: 1, end: 20, label: '1–20 of 45', hasNext: true });
    });

    it('computes a full middle page', () => {
      expect(computeRange(2, 20, 45)).toEqual({ start: 21, end: 40, label: '21–40 of 45', hasNext: true });
    });

    it('computes a partial last page and disables next', () => {
      expect(computeRange(3, 20, 45)).toEqual({ start: 41, end: 45, label: '41–45 of 45', hasNext: false });
    });

    it('handles a total that divides evenly into pages', () => {
      expect(computeRange(2, 20, 40)).toEqual({ start: 21, end: 40, label: '21–40 of 40', hasNext: false });
    });

    it('handles an empty result set', () => {
      expect(computeRange(1, 20, 0)).toEqual({ start: 0, end: 0, label: '0 of 0', hasNext: false });
    });
  });

  describe('unknown total', () => {
    it('assumes a full page when pageLength is omitted', () => {
      expect(computeRange(2, 20, undefined)).toEqual({ start: 21, end: 40, label: '21–40', hasNext: true });
    });

    it('enables next when pageLength fills the page', () => {
      expect(computeRange(1, 20, undefined, 20)).toEqual({ start: 1, end: 20, label: '1–20', hasNext: true });
    });

    it('disables next when pageLength is short', () => {
      expect(computeRange(2, 20, undefined, 7)).toEqual({ start: 21, end: 27, label: '21–27', hasNext: false });
    });

    it('handles an empty page', () => {
      expect(computeRange(1, 20, undefined, 0)).toEqual({ start: 0, end: 0, label: '0 of 0', hasNext: false });
    });
  });
});
