import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Field } from '../field';
import { Popover } from '../popover';
import type { FieldBaseProps, SelectOption } from '../types';
import { useSelectEngine, type OptionsSource } from './use-select-engine';
import { ChevronIcon, ClearIcon, SelectDropdown } from './SelectDropdown';
import './select.scss';

export interface SelectProps extends FieldBaseProps {
  /** Static option list or an async lookup for the current search query. */
  options: OptionsSource;
  value: string | number | null;
  onChange: (value: string | number | null, option?: SelectOption) => void;
  placeholder?: string;
  /** Defaults to auto: true for async sources or more than 5 static options. */
  searchable?: boolean;
  /** Show a clear button on the trigger when a value is set. Default true. */
  clearable?: boolean;
  renderOption?: (option: SelectOption, state: { highlighted: boolean; selected: boolean }) => ReactNode;
  /** Custom trigger content for the selected option. */
  renderValue?: (option: SelectOption) => ReactNode;
  /** Compact rounded pill trigger instead of a full input-like box. */
  pill?: boolean;
  loadingText?: ReactNode;
  emptyText?: ReactNode;
  fullWidth?: boolean;
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchable,
  clearable = true,
  renderOption,
  renderValue,
  pill,
  loadingText,
  emptyText,
  fullWidth,
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  className,
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const triggerId = id ?? `${autoId}-trigger`;

  const isAsync = typeof options === 'function';
  const isSearchable = searchable ?? (isAsync || (Array.isArray(options) && options.length > 5));
  const close = useCallback(() => setOpen(false), []);

  const engine = useSelectEngine({
    options,
    open,
    searchable: isSearchable,
    values: value == null ? [] : [value],
    onCommit: (option) => {
      onChange(option.value, option);
      setOpen(false);
    },
    close,
  });

  // Return focus to the trigger when the dropdown closes (unless focus already moved elsewhere).
  const wasOpenRef = useRef(false);
  useEffect(() => {
    if (open) {
      wasOpenRef.current = true;
      return;
    }
    if (!wasOpenRef.current) return;
    wasOpenRef.current = false;
    const active = document.activeElement;
    if (!active || active === document.body) triggerRef.current?.focus();
  }, [open]);

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (!isSearchable) engine.onKeyDown(e);
  };

  const onClear = (e: MouseEvent) => {
    e.stopPropagation();
    onChange(null, undefined);
  };

  const selected = value == null ? undefined : engine.optionFor(value);
  const showClear = !!clearable && !disabled && value != null;

  return (
    <Field label={label} hint={hint} error={error} required={required} disabled={disabled} size={size} className={className} htmlFor={triggerId}>
      <div
        className={cx('uikit-select', `uikit-select--${size}`, {
          'uikit-select--open': open,
          'uikit-select--disabled': !!disabled,
          'uikit-select--error': !!error,
          'uikit-select--pill': !!pill,
          'uikit-select--full': !!fullWidth,
        })}
      >
        <div
          ref={triggerRef}
          id={triggerId}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? engine.listboxId : undefined}
          aria-activedescendant={open && !isSearchable && engine.highlighted >= 0 ? engine.optionId(engine.highlighted) : undefined}
          aria-disabled={disabled || undefined}
          aria-invalid={error ? true : undefined}
          tabIndex={disabled ? -1 : 0}
          className="uikit-select__trigger"
          onClick={() => !disabled && setOpen((o) => !o)}
          onKeyDown={onTriggerKeyDown}
        >
          <span className={cx('uikit-select__value', { 'uikit-select__value--placeholder': value == null })}>
            {selected ? (renderValue ? renderValue(selected) : selected.label) : value != null ? String(value) : placeholder}
          </span>
          {showClear && (
            <span
              className="uikit-select__clear"
              role="button"
              aria-label="Clear selection"
              tabIndex={-1}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={onClear}
            >
              {ClearIcon}
            </span>
          )}
          <span className="uikit-select__chevron" aria-hidden="true">
            {ChevronIcon}
          </span>
        </div>
        <Popover open={open} anchorRef={triggerRef} onClose={close} matchWidth={!pill} className={cx('uikit-select__panel', { 'uikit-select__panel--detached': !!pill })}>
          <SelectDropdown
            engine={engine}
            searchable={isSearchable}
            isSelected={(o) => o.value === value}
            renderOption={renderOption}
            loadingText={loadingText}
            emptyText={emptyText}
          />
        </Popover>
      </div>
    </Field>
  );
}
