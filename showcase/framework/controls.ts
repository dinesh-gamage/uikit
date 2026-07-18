export type ControlDef =
  | { type: 'boolean'; name: string; label?: string; defaultValue?: boolean }
  | { type: 'text'; name: string; label?: string; defaultValue?: string }
  | { type: 'number'; name: string; label?: string; defaultValue?: number; min?: number; max?: number }
  | { type: 'select'; name: string; label?: string; options: string[]; defaultValue?: string }
  | { type: 'json'; name: string; label?: string; defaultValue?: unknown };

export type ControlValues = Record<string, any>;

export function defaultValues(controls: ControlDef[]): ControlValues {
  const out: ControlValues = {};
  for (const c of controls) {
    if (c.defaultValue !== undefined) out[c.name] = c.defaultValue;
    else if (c.type === 'boolean') out[c.name] = false;
    else if (c.type === 'number') out[c.name] = 0;
    else if (c.type === 'select') out[c.name] = c.options[0];
    else if (c.type === 'json') out[c.name] = null;
    else out[c.name] = '';
  }
  return out;
}

/** Render a props object as JSX attribute snippets, skipping defaults. */
export function jsxProps(values: ControlValues, skip: ControlValues = {}): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === skip[key]) continue;
    if (value === true) parts.push(key);
    else if (value === false || value === '' || value == null) continue;
    else if (typeof value === 'string') parts.push(`${key}="${value}"`);
    else if (typeof value === 'number') parts.push(`${key}={${value}}`);
    else parts.push(`${key}={${JSON.stringify(value)}}`);
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}
