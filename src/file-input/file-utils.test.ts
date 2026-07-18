import { describe, expect, it } from 'vitest';
import { exceedsMaxSize, formatBytes, matchesAccept, validateFile } from './file-utils';

function makeFile(name: string, type: string, size = 4): File {
  return new File(['x'.repeat(size)], name, { type });
}

describe('matchesAccept', () => {
  it('accepts everything when accept is empty or undefined', () => {
    const file = makeFile('report.csv', 'text/csv');
    expect(matchesAccept(file)).toBe(true);
    expect(matchesAccept(file, [])).toBe(true);
  });

  it('matches mime wildcards', () => {
    expect(matchesAccept(makeFile('photo.png', 'image/png'), ['image/*'])).toBe(true);
    expect(matchesAccept(makeFile('clip.mp4', 'video/mp4'), ['image/*'])).toBe(false);
  });

  it('matches exact mime types', () => {
    expect(matchesAccept(makeFile('doc.pdf', 'application/pdf'), ['application/pdf'])).toBe(true);
    expect(matchesAccept(makeFile('doc.txt', 'text/plain'), ['application/pdf'])).toBe(false);
  });

  it('matches extensions case-insensitively', () => {
    expect(matchesAccept(makeFile('DATA.CSV', 'text/csv'), ['.csv'])).toBe(true);
    expect(matchesAccept(makeFile('data.tsv', 'text/tab-separated-values'), ['.csv'])).toBe(false);
  });

  it('matches when any of several entries match', () => {
    const accept = ['image/*', 'application/pdf', '.csv'];
    expect(matchesAccept(makeFile('a.csv', ''), accept)).toBe(true);
    expect(matchesAccept(makeFile('a.pdf', 'application/pdf'), accept)).toBe(true);
    expect(matchesAccept(makeFile('a.zip', 'application/zip'), accept)).toBe(false);
  });
});

describe('size limits', () => {
  it('flags files above maxSize and allows files at or below it', () => {
    const file = makeFile('big.bin', 'application/octet-stream', 100);
    expect(exceedsMaxSize(file, 99)).toBe(true);
    expect(exceedsMaxSize(file, 100)).toBe(false);
    expect(exceedsMaxSize(file, undefined)).toBe(false);
  });

  it('validateFile reports size errors with a formatted limit', () => {
    const file = makeFile('big.bin', 'application/octet-stream', 2048);
    expect(validateFile(file, undefined, 1024)).toBe('"big.bin" exceeds the 1 KB limit');
    expect(validateFile(file, undefined, 4096)).toBeNull();
  });

  it('validateFile reports accept errors before size errors', () => {
    const file = makeFile('big.bin', 'application/octet-stream', 2048);
    expect(validateFile(file, ['image/*'], 1024)).toBe('"big.bin" is not an accepted file type');
  });
});

describe('formatBytes', () => {
  it('formats across unit boundaries', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(512)).toBe('512 B');
    expect(formatBytes(1024)).toBe('1 KB');
    expect(formatBytes(1536)).toBe('1.5 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5 MB');
  });
});
