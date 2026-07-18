/** Plain-data validation for form fields. No React here — safe to unit test in isolation. */

export type FormData = Record<string, any>;

export interface ValidationRule {
  required?: boolean | ((data: FormData) => boolean);
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  /** When false, 0 is rejected even though it isn't considered "empty". */
  allowZero?: boolean;
  /** When false, negative numbers are rejected. */
  allowNegative?: boolean;
  validate?: (value: any, data: FormData) => string | null | Promise<string | null>;
}

function isEmptyValue(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/** Coerces numbers and numeric strings; returns null for anything else. */
function asNumber(value: any): number | null {
  if (typeof value === 'number') return Number.isNaN(value) ? null : value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  return null;
}

/**
 * Evaluates a single field against its rule. Order: required -> string rules
 * (trimmed) -> number rules -> pattern -> custom. The custom validator always
 * runs (even for empty/optional values) so it can implement its own
 * cross-field "required" logic (e.g. a date range that's required only when
 * a sibling checkbox is on).
 */
export async function validateField(value: any, rule: ValidationRule | undefined, data: FormData): Promise<string | null> {
  if (!rule) return null;

  const empty = isEmptyValue(value);
  const isRequired = typeof rule.required === 'function' ? rule.required(data) : !!rule.required;
  if (isRequired && empty) return 'This field is required';

  if (!empty) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (rule.minLength != null && trimmed.length < rule.minLength) return `Must be at least ${rule.minLength} characters`;
      if (rule.maxLength != null && trimmed.length > rule.maxLength) return `Must be at most ${rule.maxLength} characters`;
    }

    const num = asNumber(value);
    if (num != null) {
      if (rule.min != null && num < rule.min) return `Must be at least ${rule.min}`;
      if (rule.max != null && num > rule.max) return `Must be at most ${rule.max}`;
      if (rule.allowZero === false && num === 0) return 'Must not be zero';
      if (rule.allowNegative === false && num < 0) return 'Must not be negative';
    }

    if (rule.pattern != null) {
      const str = typeof value === 'string' ? value.trim() : String(value);
      if (!rule.pattern.test(str)) return 'Invalid format';
    }
  }

  if (rule.validate) {
    const result = await rule.validate(value, data);
    if (result) return result;
  }

  return null;
}

/** Validates a set of named fields concurrently; the result only contains entries for fields that failed. */
export async function validateAll(fields: { name: string; rule: ValidationRule | undefined }[], data: FormData): Promise<Record<string, string>> {
  const results = await Promise.all(
    fields.map(async ({ name, rule }) => [name, await validateField(data[name], rule, data)] as const)
  );
  const errors: Record<string, string> = {};
  for (const [name, error] of results) {
    if (error) errors[name] = error;
  }
  return errors;
}
