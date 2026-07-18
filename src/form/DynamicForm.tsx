import {
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../utils/cx';
import { Field } from '../field/Field';
import { Input } from '../input';
import { Checkbox } from '../checkbox';
import { RadioGroup } from '../radio';
import { DatalistInput } from '../datalist';
import { FileInput } from '../file-input';
import { Select, MultiSelect } from '../select';
import { DatePicker, DateTimePicker, DateRangePicker, TimeRangePicker } from '../datetime';
import { Skeleton } from '../skeleton';
import { Button } from '../button';
import type { Size, SelectOption } from '../types';
import type { FormData, FormFieldDef, FormSchema, FormSectionDef } from './types';
import { validateAll, validateField } from './validators';
import './form.scss';

export interface DynamicFormHandle {
  /** Runs full validation and, if it passes, calls onSubmit. Resolves to whether it succeeded. */
  submit(): Promise<boolean>;
  /** Runs full validation without submitting. Resolves to whether the form is valid. */
  validate(): Promise<boolean>;
  getData(): FormData;
  setData(patch: Partial<FormData>): void;
  reset(): void;
  /** Merges the given errors into the current error map (e.g. after a failed server-side submit). */
  setErrors(errors: Record<string, string>): void;
  clearErrors(): void;
}

export interface DynamicFormProps {
  schema: FormSchema;
  initialData?: FormData;
  onSubmit: (data: FormData) => void | Promise<void>;
  onCancel?: () => void;
  onChange?: (data: FormData, changedField: string) => void;
  submitLabel?: ReactNode;
  cancelLabel?: ReactNode;
  hideButtons?: boolean;
  /** Renders skeleton placeholders instead of the real fields. */
  loading?: boolean;
  /** Disables every field plus the submit/cancel buttons. */
  disabled?: boolean;
  size?: Size;
  /** Size of the submit/cancel footer Buttons. Independent of the fields' `size`. Default 'md'. */
  buttonSize?: Size;
  /** Rendered as the submit Button's leftIcon. */
  submitIcon?: ReactNode;
  /** Rendered as the cancel Button's leftIcon. */
  cancelIcon?: ReactNode;
  className?: string;
  ref?: Ref<DynamicFormHandle>;
}

interface ControlCommon {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  size?: Size;
}

function defaultValueForType(type: FormFieldDef['type']): any {
  switch (type) {
    case 'checkbox':
    case 'switch':
      return false;
    case 'multiselect':
      return [];
    case 'daterange':
      return { start: null, end: null };
    case 'timerange':
      return { start: null, end: null };
    case 'file':
    case 'date':
    case 'datetime':
    case 'radio':
    case 'select':
      return null;
    case 'text':
    case 'password':
    case 'email':
    case 'number':
    case 'textarea':
    case 'datalist':
      return '';
    default:
      return undefined;
  }
}

function collectAllFields(schema: FormSchema): FormFieldDef[] {
  const out: FormFieldDef[] = [];
  const walk = (section: FormSectionDef) => {
    for (const field of section.fields ?? []) out.push(field);
    for (const sub of section.sections ?? []) walk(sub);
  };
  for (const section of schema.sections) walk(section);
  return out;
}

function buildInitialData(schema: FormSchema, initialData?: FormData): FormData {
  const data: FormData = {};
  for (const field of collectAllFields(schema)) {
    data[field.name] = field.defaultValue !== undefined ? field.defaultValue : defaultValueForType(field.type);
  }
  return { ...data, ...(initialData ?? {}) };
}

/** Recursively resolves which fields are currently visible, factoring in ancestor section `show()` as well as the field's own. */
function computeVisibleFieldNames(schema: FormSchema, data: FormData): Set<string> {
  const visible = new Set<string>();
  const walk = (section: FormSectionDef, parentVisible: boolean) => {
    const sectionVisible = parentVisible && (section.show ? section.show(data) : true);
    if (sectionVisible) {
      for (const field of section.fields ?? []) {
        if (!field.show || field.show(data)) visible.add(field.name);
      }
    }
    for (const sub of section.sections ?? []) walk(sub, sectionVisible);
  };
  for (const section of schema.sections) walk(section, true);
  return visible;
}

function isFieldRequired(field: FormFieldDef, data: FormData): boolean {
  const required = field.validation?.required;
  if (required == null) return false;
  return typeof required === 'function' ? required(data) : required;
}

function isFieldDisabled(field: FormFieldDef, data: FormData, formDisabled: boolean | undefined): boolean {
  if (formDisabled) return true;
  const disabled = field.disabled;
  if (disabled == null) return false;
  return typeof disabled === 'function' ? disabled(data) : disabled;
}

function controlHeight(size: Size): number {
  return size === 'sm' ? 28 : size === 'lg' ? 40 : 34;
}

function ChevronGlyph() {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
      <path fill="currentColor" d="M4 6l4 4 4-4H4z" />
    </svg>
  );
}

interface TextAreaProps extends ControlCommon {
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  id?: string;
}

/** Native textarea styled to match Input's container. Kept local to the form module. */
function TextArea({ value, onChange, rows = 4, placeholder, label, hint, error, required, disabled, size = 'md', id }: TextAreaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <Field label={label} hint={hint} error={error} required={required} disabled={disabled} size={size} htmlFor={textareaId}>
      <div
        className={cx('uikit-textarea', `uikit-textarea--${size}`, {
          'uikit-textarea--error': !!error,
          'uikit-textarea--disabled': !!disabled,
        })}
      >
        <textarea
          id={textareaId}
          className="uikit-textarea__control"
          rows={rows}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </Field>
  );
}

/** Resolves a static option list, or fetches once (empty query) when a lookup function is given. Used by radio/datalist, which don't support async sources natively. */
function useResolvedOptions(options: FormFieldDef['options']): SelectOption[] {
  const [resolved, setResolved] = useState<SelectOption[]>(() => (Array.isArray(options) ? options : []));

  useEffect(() => {
    if (Array.isArray(options)) {
      setResolved(options);
      return;
    }
    if (typeof options === 'function') {
      let cancelled = false;
      options('').then((items) => {
        if (!cancelled) setResolved(items);
      });
      return () => {
        cancelled = true;
      };
    }
    setResolved([]);
    return undefined;
  }, [options]);

  return resolved;
}

function RadioField({ field, value, onChange, common }: { field: FormFieldDef; value: any; onChange: (v: any) => void; common: ControlCommon }) {
  const options = useResolvedOptions(field.options);
  return <RadioGroup options={options} value={value ?? null} onChange={(v) => onChange(v)} {...common} />;
}

function DatalistField({
  field,
  value,
  onChange,
  common,
  placeholder,
}: {
  field: FormFieldDef;
  value: any;
  onChange: (v: any) => void;
  common: ControlCommon;
  placeholder?: string;
}) {
  const options = useResolvedOptions(field.options);
  return <DatalistInput options={options} value={value ?? ''} onChange={onChange} placeholder={placeholder} {...common} />;
}

function renderFieldControl(
  field: FormFieldDef,
  value: any,
  onChange: (v: any) => void,
  common: ControlCommon,
  data: FormData,
  error: string | null
): ReactNode {
  switch (field.type) {
    case 'text':
    case 'password':
    case 'email':
      return <Input type={field.type} value={value ?? ''} onChange={onChange} placeholder={field.placeholder} {...common} />;

    case 'number':
      return (
        <Input
          type="number"
          value={value ?? ''}
          onChange={onChange}
          placeholder={field.placeholder}
          inputProps={{ min: field.validation?.min, max: field.validation?.max, step: field.step }}
          {...common}
        />
      );

    case 'textarea':
      return <TextArea value={value ?? ''} onChange={onChange} rows={field.rows} placeholder={field.placeholder} {...common} />;

    case 'checkbox':
      return <Checkbox mode="checkbox" checked={!!value} onChange={onChange} {...common} />;

    case 'switch':
      return <Checkbox mode="switch" checked={!!value} onChange={onChange} {...common} />;

    case 'radio':
      return <RadioField field={field} value={value} onChange={onChange} common={common} />;

    case 'select':
      return <Select options={field.options ?? []} value={value ?? null} onChange={(v) => onChange(v)} placeholder={field.placeholder} {...common} />;

    case 'multiselect':
      return <MultiSelect options={field.options ?? []} value={value ?? []} onChange={(v) => onChange(v)} placeholder={field.placeholder} {...common} />;

    case 'datalist':
      return <DatalistField field={field} value={value} onChange={onChange} common={common} placeholder={field.placeholder} />;

    case 'file':
      return (
        <FileInput
          value={value ?? null}
          onChange={(f) => onChange(f)}
          accept={field.accept}
          multiple={field.multiple}
          mode={field.fileMode}
          {...common}
        />
      );

    case 'date':
      return <DatePicker value={value ?? null} onChange={onChange} min={field.min} max={field.max} placeholder={field.placeholder} {...common} />;

    case 'datetime':
      return <DateTimePicker value={value ?? null} onChange={onChange} min={field.min} max={field.max} placeholder={field.placeholder} {...common} />;

    case 'daterange': {
      const range = (value ?? { start: null, end: null }) as { start: Date | null; end: Date | null };
      return (
        <DateRangePicker
          start={range.start}
          end={range.end}
          onChange={(start, end) => onChange({ start, end })}
          min={field.min}
          max={field.max}
          placeholder={field.placeholder}
          {...common}
        />
      );
    }

    case 'timerange': {
      const range = (value ?? { start: null, end: null }) as { start: string | null; end: string | null };
      return (
        <TimeRangePicker
          start={range.start}
          end={range.end}
          onChange={(start, end) => onChange({ start, end })}
          step={field.step}
          placeholder={field.placeholder}
          {...common}
        />
      );
    }

    case 'hidden':
      return null;

    case 'custom':
      return (
        <Field label={common.label} hint={common.hint} error={common.error} required={common.required} disabled={common.disabled} size={common.size}>
          {field.render?.({ value, setValue: onChange, data, error, field })}
        </Field>
      );

    default:
      return null;
  }
}

export function DynamicForm({
  schema,
  initialData,
  onSubmit,
  onCancel,
  onChange,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  hideButtons,
  loading,
  disabled,
  size = 'md',
  buttonSize = 'md',
  submitIcon,
  cancelIcon,
  className,
  ref,
}: DynamicFormProps) {
  const [data, setDataState] = useState<FormData>(() => buildInitialData(schema, initialData));
  const [errors, setErrorsState] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [expandedOverrides, setExpandedOverrides] = useState<Record<string, boolean>>({});

  const dataRef = useRef(data);
  dataRef.current = data;
  const touchedRef = useRef<Record<string, boolean>>({});
  const submitFailedRef = useRef(false);
  const submittingRef = useRef(false);
  const lastChangedFieldRef = useRef<string | null>(null);
  const fieldNodesRef = useRef<Record<string, HTMLDivElement | null>>({});
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const allFields = useMemo(() => collectAllFields(schema), [schema]);
  const fieldMap = useMemo(() => new Map(allFields.map((f) => [f.name, f])), [allFields]);
  const fieldOrder = useMemo(() => allFields.map((f) => f.name), [allFields]);

  // Fire onChange after the data that triggered it has actually committed.
  useEffect(() => {
    const field = lastChangedFieldRef.current;
    if (field) {
      lastChangedFieldRef.current = null;
      onChangeRef.current?.(dataRef.current, field);
    }
  }, [data]);

  const runFieldValidation = useCallback(
    async (name: string) => {
      const field = fieldMap.get(name);
      const currentData = dataRef.current;
      const error = await validateField(currentData[name], field?.validation, currentData);
      setErrorsState((prev) => {
        if (!error) {
          if (!(name in prev)) return prev;
          const next = { ...prev };
          delete next[name];
          return next;
        }
        if (prev[name] === error) return prev;
        return { ...prev, [name]: error };
      });
    },
    [fieldMap]
  );

  const setFieldValue = useCallback(
    (name: string, value: any) => {
      const next = { ...dataRef.current, [name]: value };
      dataRef.current = next;
      lastChangedFieldRef.current = name;
      setDataState(next);
      const wasTouched = touchedRef.current[name];
      touchedRef.current[name] = true;
      if (wasTouched || submitFailedRef.current) {
        void runFieldValidation(name);
      }
    },
    [runFieldValidation]
  );

  const focusFirstError = useCallback(
    (errs: Record<string, string>) => {
      const name = fieldOrder.find((n) => errs[n]);
      if (!name) return;
      const node = fieldNodesRef.current[name];
      if (!node) return;
      node.scrollIntoView({ block: 'center', behavior: 'smooth' });
      const focusable = node.querySelector<HTMLElement>('input, textarea, select, button, [tabindex]');
      focusable?.focus();
    },
    [fieldOrder]
  );

  const runFullValidation = useCallback(async (): Promise<Record<string, string>> => {
    const currentData = dataRef.current;
    const visible = computeVisibleFieldNames(schema, currentData);
    const toValidate = allFields.filter((f) => visible.has(f.name)).map((f) => ({ name: f.name, rule: f.validation }));
    return validateAll(toValidate, currentData);
  }, [schema, allFields]);

  const doSubmit = useCallback(async (): Promise<boolean> => {
    if (submittingRef.current || disabled) return false;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const errs = await runFullValidation();
      if (Object.keys(errs).length > 0) {
        submitFailedRef.current = true;
        for (const name of Object.keys(errs)) touchedRef.current[name] = true;
        setErrorsState(errs);
        focusFirstError(errs);
        return false;
      }
      setErrorsState({});
      const visible = computeVisibleFieldNames(schema, dataRef.current);
      const submitData: FormData = {};
      for (const [key, value] of Object.entries(dataRef.current)) {
        if (visible.has(key)) submitData[key] = value;
      }
      await onSubmit(submitData);
      return true;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [disabled, runFullValidation, focusFirstError, schema, onSubmit]);

  const doValidate = useCallback(async (): Promise<boolean> => {
    const errs = await runFullValidation();
    setErrorsState(errs);
    if (Object.keys(errs).length > 0) {
      submitFailedRef.current = true;
      for (const name of Object.keys(errs)) touchedRef.current[name] = true;
      focusFirstError(errs);
      return false;
    }
    return true;
  }, [runFullValidation, focusFirstError]);

  const doReset = useCallback(() => {
    const fresh = buildInitialData(schema, initialData);
    dataRef.current = fresh;
    setDataState(fresh);
    setErrorsState({});
    touchedRef.current = {};
    submitFailedRef.current = false;
  }, [schema, initialData]);

  const doSetData = useCallback((patch: Partial<FormData>) => {
    const next = { ...dataRef.current, ...patch };
    dataRef.current = next;
    setDataState(next);
  }, []);

  const doSetErrors = useCallback((next: Record<string, string>) => {
    setErrorsState((prev) => ({ ...prev, ...next }));
  }, []);

  const doClearErrors = useCallback(() => setErrorsState({}), []);

  useImperativeHandle(
    ref,
    () => ({
      submit: doSubmit,
      validate: doValidate,
      getData: () => ({ ...dataRef.current }),
      setData: doSetData,
      reset: doReset,
      setErrors: doSetErrors,
      clearErrors: doClearErrors,
    }),
    [doSubmit, doValidate, doSetData, doReset, doSetErrors, doClearErrors]
  );

  const handleFormSubmit = (e: FormEvent) => {
    e.preventDefault();
    void doSubmit();
  };

  const sectionKey = (section: FormSectionDef, path: string) => section.id ?? path;

  const isSectionExpanded = (section: FormSectionDef, path: string) => {
    const key = sectionKey(section, path);
    const fallback = section.defaultExpanded ?? true;
    return expandedOverrides[key] ?? fallback;
  };

  const toggleSection = (section: FormSectionDef, path: string) => {
    const key = sectionKey(section, path);
    const fallback = section.defaultExpanded ?? true;
    setExpandedOverrides((prev) => ({ ...prev, [key]: !(prev[key] ?? fallback) }));
  };

  const renderField = (field: FormFieldDef) => {
    if (field.show && !field.show(data)) return null;
    if (field.type === 'hidden') return null;

    const value = data[field.name];
    const error = errors[field.name] ?? null;
    const required = isFieldRequired(field, data);
    const fieldDisabled = isFieldDisabled(field, data, disabled);
    const common: ControlCommon = { label: field.label, hint: field.hint, error, required, disabled: fieldDisabled, size };

    const content = loading ? (
      <Field label={field.label} hint={field.hint} size={size}>
        <Skeleton variant="rect" height={controlHeight(size)} className="uikit-form__skeleton-control" />
      </Field>
    ) : (
      renderFieldControl(field, value, (v) => setFieldValue(field.name, v), common, data, error)
    );

    return (
      <div
        key={field.name}
        className="uikit-form__field"
        ref={(el) => {
          fieldNodesRef.current[field.name] = el;
        }}
      >
        {content}
      </div>
    );
  };

  const renderSection = (section: FormSectionDef, path: string): ReactNode => {
    if (section.show && !section.show(data)) return null;

    const columns = section.columns ?? 1;
    const expanded = section.collapsible ? isSectionExpanded(section, path) : true;
    const hasHeader = section.title != null || section.description != null || !!section.collapsible;
    const fields = section.fields ?? [];
    const subSections = section.sections ?? [];

    return (
      <div className="uikit-form__section" key={sectionKey(section, path)}>
        {hasHeader && (
          <div className="uikit-form__section-head">
            <div className="uikit-form__section-titles">
              {section.title != null && <h3 className="uikit-form__section-title">{section.title}</h3>}
              {section.description != null && <p className="uikit-form__section-description">{section.description}</p>}
            </div>
            {section.collapsible && (
              <button
                type="button"
                className={cx('uikit-form__section-toggle', { 'uikit-form__section-toggle--expanded': expanded })}
                aria-expanded={expanded}
                onClick={() => toggleSection(section, path)}
              >
                <ChevronGlyph />
              </button>
            )}
          </div>
        )}
        {expanded && (
          <>
            {fields.length > 0 && (
              <div className="uikit-form__grid" style={{ '--columns': columns } as CSSProperties}>
                {fields.map((field) => renderField(field))}
              </div>
            )}
            {subSections.length > 0 && (
              <div className="uikit-form__sub-sections">{subSections.map((sub, i) => renderSection(sub, `${path}-${i}`))}</div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <form className={cx('uikit-form', `uikit-form--${size}`, { 'uikit-form--disabled': !!disabled }, className)} onSubmit={handleFormSubmit} noValidate>
      {schema.sections.map((section, i) => renderSection(section, String(i)))}
      {!hideButtons && (
        <div className="uikit-form__buttons">
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              size={buttonSize}
              leftIcon={cancelIcon}
              disabled={disabled || submitting}
              onClick={onCancel}
              className="uikit-form__cancel"
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            type="submit"
            variant="primary"
            size={buttonSize}
            leftIcon={submitIcon}
            loading={submitting}
            loadingLabel="Submitting…"
            disabled={disabled}
            className="uikit-form__submit"
          >
            {submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
