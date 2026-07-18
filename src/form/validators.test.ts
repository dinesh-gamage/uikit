import { describe, expect, it } from 'vitest';
import { validateAll, validateField, type ValidationRule } from './validators';

describe('validateField / required', () => {
  it('passes when no rule is given', async () => {
    expect(await validateField('', undefined, {})).toBeNull();
  });

  it('rejects null, undefined, blank strings and empty arrays', async () => {
    const rule: ValidationRule = { required: true };
    expect(await validateField(null, rule, {})).toBe('This field is required');
    expect(await validateField(undefined, rule, {})).toBe('This field is required');
    expect(await validateField('', rule, {})).toBe('This field is required');
    expect(await validateField('   ', rule, {})).toBe('This field is required');
    expect(await validateField([], rule, {})).toBe('This field is required');
  });

  it('treats 0 and false as present, not empty', async () => {
    const rule: ValidationRule = { required: true };
    expect(await validateField(0, rule, {})).toBeNull();
    expect(await validateField(false, rule, {})).toBeNull();
  });

  it('accepts non-empty values', async () => {
    expect(await validateField('hi', { required: true }, {})).toBeNull();
    expect(await validateField(['a'], { required: true }, {})).toBeNull();
  });

  it('supports a conditional required function evaluated against form data', async () => {
    const rule: ValidationRule = { required: (data) => !!data.hasDeadline };
    expect(await validateField('', rule, { hasDeadline: true })).toBe('This field is required');
    expect(await validateField('', rule, { hasDeadline: false })).toBeNull();
  });

  it('skips further rules for empty optional values', async () => {
    const rule: ValidationRule = { minLength: 5 };
    expect(await validateField('', rule, {})).toBeNull();
  });
});

describe('validateField / string rules', () => {
  it('enforces minLength and maxLength on trimmed input', async () => {
    const rule: ValidationRule = { minLength: 3, maxLength: 5 };
    expect(await validateField('  ab  ', rule, {})).toBe('Must be at least 3 characters');
    expect(await validateField('  abcdef  ', rule, {})).toBe('Must be at most 5 characters');
    expect(await validateField('  abcd  ', rule, {})).toBeNull();
  });
});

describe('validateField / number rules', () => {
  it('enforces min and max for numbers and numeric strings', async () => {
    const rule: ValidationRule = { min: 10, max: 20 };
    expect(await validateField(5, rule, {})).toBe('Must be at least 10');
    expect(await validateField(25, rule, {})).toBe('Must be at most 20');
    expect(await validateField('15', rule, {})).toBeNull();
    expect(await validateField(15, rule, {})).toBeNull();
  });

  it('rejects zero when allowZero is false', async () => {
    expect(await validateField(0, { allowZero: false }, {})).toBe('Must not be zero');
    expect(await validateField(0, { allowZero: true }, {})).toBeNull();
    expect(await validateField(0, {}, {})).toBeNull();
  });

  it('rejects negative numbers when allowNegative is false', async () => {
    expect(await validateField(-5, { allowNegative: false }, {})).toBe('Must not be negative');
    expect(await validateField(-5, { allowNegative: true }, {})).toBeNull();
    expect(await validateField(-5, {}, {})).toBeNull();
  });

  it('ignores number rules for non-numeric strings', async () => {
    expect(await validateField('abc', { min: 10 }, {})).toBeNull();
  });
});

describe('validateField / pattern', () => {
  it('validates against a regex, trimming string values first', async () => {
    const rule: ValidationRule = { pattern: /^[a-z]+$/ };
    expect(await validateField('  hello  ', rule, {})).toBeNull();
    expect(await validateField('Hello1', rule, {})).toBe('Invalid format');
  });
});

describe('validateField / custom', () => {
  it('runs a synchronous custom validator after the built-in rules', async () => {
    const rule: ValidationRule = { validate: (value) => (value === 'taken' ? 'Already taken' : null) };
    expect(await validateField('taken', rule, {})).toBe('Already taken');
    expect(await validateField('free', rule, {})).toBeNull();
  });

  it('awaits an asynchronous custom validator', async () => {
    const rule: ValidationRule = {
      validate: async (value: string) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        return value === 'dinesh' ? 'Username is taken' : null;
      },
    };
    expect(await validateField('dinesh', rule, {})).toBe('Username is taken');
    expect(await validateField('someone-else', rule, {})).toBeNull();
  });

  it('runs custom validators even on empty values, so they can implement cross-field requiredness', async () => {
    const rule: ValidationRule = {
      validate: (value: { start: Date | null; end: Date | null }, data) => {
        if (!data.hasDeadline) return null;
        return value.start && value.end ? null : 'A date range is required';
      },
    };
    expect(await validateField({ start: null, end: null }, rule, { hasDeadline: true })).toBe('A date range is required');
    expect(await validateField({ start: null, end: null }, rule, { hasDeadline: false })).toBeNull();
    expect(await validateField({ start: new Date(), end: new Date() }, rule, { hasDeadline: true })).toBeNull();
  });

  it('short-circuits before custom validation when required fails', async () => {
    let called = false;
    const rule: ValidationRule = {
      required: true,
      validate: () => {
        called = true;
        return null;
      },
    };
    expect(await validateField('', rule, {})).toBe('This field is required');
    expect(called).toBe(false);
  });
});

describe('validateAll', () => {
  it('runs validators concurrently and only reports failing fields', async () => {
    const order: string[] = [];
    const slow = async (name: string, fail: boolean) => {
      await new Promise((resolve) => setTimeout(resolve, fail ? 5 : 15));
      order.push(name);
      return fail ? `${name} failed` : null;
    };

    const data = { a: 'x', b: 'y', c: 'z' };
    const errors = await validateAll(
      [
        { name: 'a', rule: { validate: () => slow('a', true) } },
        { name: 'b', rule: { validate: () => slow('b', false) } },
        { name: 'c', rule: undefined },
      ],
      data
    );

    expect(errors).toEqual({ a: 'a failed' });
    expect(order).toContain('a');
    expect(order).toContain('b');
    // 'a' resolves before 'b' despite being scheduled first, proving concurrency (not sequential awaiting).
    expect(order[0]).toBe('a');
  });

  it('returns an empty object when everything passes', async () => {
    const errors = await validateAll(
      [
        { name: 'name', rule: { required: true } },
        { name: 'age', rule: { min: 0 } },
      ],
      { name: 'Dinesh', age: 30 }
    );
    expect(errors).toEqual({});
  });
});
