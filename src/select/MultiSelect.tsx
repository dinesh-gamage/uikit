import { useCallback, useEffect, useId, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Field } from '../field';
import { Dropdown, DropdownIndicator } from '../dropdown';
import type { FieldBaseProps, SelectOption } from '../types';
import { useSelectEngine, type OptionsSource } from './use-select-engine';
import { ClearIcon, SelectDropdown, type SelectAllState } from './SelectDropdown';
import './select.scss';

export interface MultiSelectProps extends FieldBaseProps {
  /** Static option list or an async lookup for the current search query. */
  options: OptionsSource;
  value: (string | number)[];
  onChange: (values: (string | number)[], options?: SelectOption[]) => void;
  placeholder?: string;
  /** Defaults to auto: true for async sources or more than 5 static options. */
  searchable?: boolean;
  /** Show a clear button on the trigger that clears all values. Default true. */
  clearable?: boolean;
  renderOption?: (option: SelectOption, state: { highlighted: boolean; selected: boolean }) => ReactNode;
  /** Custom pill renderer for selected values. */
  renderPill?: (option: SelectOption, remove: () => void) => ReactNode;
  /** Show at most this many pills; the rest collapse to "+N". */
  maxPillsVisible?: number;
  /** Add a Select All row (with indeterminate state) above the options. */
  selectAll?: boolean;
  loadingText?: ReactNode;
  emptyText?: ReactNode;
  fullWidth?: boolean;
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  searchable,
  clearable = true,
  renderOption,
  renderPill,
  maxPillsVisible,
  selectAll,
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
}: MultiSelectProps) {
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
    values: value,
    onCommit: (option) => toggleOption(option),
    close,
  });

  const emit = (next: (string | number)[]) => {
    const known = next.map((v) => engine.optionFor(v)).filter((o): o is SelectOption => o != null);
    onChange(next, known);
  };

  function toggleOption(option: SelectOption) {
    emit(value.includes(option.value) ? value.filter((v) => v !== option.value) : [...value, option.value]);
  }

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

  const onClearAll = (e: MouseEvent) => {
    e.stopPropagation();
    emit([]);
  };

  // Select All operates on the currently visible enabled options.
  const visibleEnabled = engine.items.filter((o) => !o.disabled);
  const allSelected = visibleEnabled.length > 0 && visibleEnabled.every((o) => value.includes(o.value));
  const someSelected = visibleEnabled.some((o) => value.includes(o.value));
  const selectAllState: SelectAllState | undefined = selectAll
    ? {
        checked: allSelected,
        indeterminate: someSelected && !allSelected,
        onToggle: () => {
          if (allSelected) emit(value.filter((v) => !visibleEnabled.some((o) => o.value === v)));
          else emit([...value, ...visibleEnabled.filter((o) => !value.includes(o.value)).map((o) => o.value)]);
        },
      }
    : undefined;

  const selectedOptions: SelectOption[] = value.map((v) => engine.optionFor(v) ?? { value: v, label: String(v) });
  const visiblePills = maxPillsVisible != null && maxPillsVisible >= 0 ? selectedOptions.slice(0, maxPillsVisible) : selectedOptions;
  const hiddenCount = selectedOptions.length - visiblePills.length;
  const showClear = !!clearable && !disabled && value.length > 0;

  const stop = (e: MouseEvent) => e.stopPropagation();

  const footer = (
    <div className="uikit-select__footer">
      <button type="button" className="uikit-select__footer-btn" onMouseDown={(e) => e.preventDefault()} onClick={() => emit([])}>
        Clear
      </button>
      <button type="button" className="uikit-select__footer-btn uikit-select__footer-btn--primary" onMouseDown={(e) => e.preventDefault()} onClick={close}>
        Done
      </button>
    </div>
  );

  return (
    <Field label={label} hint={hint} error={error} required={required} disabled={disabled} size={size} className={className} htmlFor={triggerId}>
      <div
        className={cx('uikit-select', 'uikit-select--multi', `uikit-select--${size}`, {
          'uikit-select--open': open,
          'uikit-select--disabled': !!disabled,
          'uikit-select--error': !!error,
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
          <span className="uikit-select__pills">
            {visiblePills.map((option) => {
              const remove = () => emit(value.filter((v) => v !== option.value));
              if (renderPill) {
                return (
                  <span key={String(option.value)} className="uikit-select__pill-custom" onMouseDown={stop} onClick={stop}>
                    {renderPill(option, remove)}
                  </span>
                );
              }
              return (
                <span key={String(option.value)} className="uikit-select__pill">
                  <span className="uikit-select__pill-label">{option.label}</span>
                  {!disabled && (
                    <span
                      className="uikit-select__pill-remove"
                      role="button"
                      aria-label="Remove"
                      tabIndex={-1}
                      onMouseDown={stop}
                      onClick={(e) => {
                        e.stopPropagation();
                        remove();
                      }}
                    >
                      {ClearIcon}
                    </span>
                  )}
                </span>
              );
            })}
            {hiddenCount > 0 && <span className="uikit-select__pill uikit-select__pill--more">+{hiddenCount}</span>}
            {selectedOptions.length === 0 && <span className="uikit-select__value uikit-select__value--placeholder">{placeholder}</span>}
          </span>
          {showClear && (
            <span
              className="uikit-select__clear"
              role="button"
              aria-label="Clear all"
              tabIndex={-1}
              onMouseDown={stop}
              onClick={onClearAll}
            >
              {ClearIcon}
            </span>
          )}
          <DropdownIndicator open={open} />
        </div>
        <Dropdown open={open} anchorRef={triggerRef} onClose={close} matchTriggerWidth position="bottom-start" className="uikit-select__panel">
          <SelectDropdown
            engine={engine}
            searchable={isSearchable}
            multiple
            isSelected={(o) => value.includes(o.value)}
            renderOption={renderOption}
            loadingText={loadingText}
            emptyText={emptyText}
            selectAllState={selectAllState}
            footer={footer}
          />
        </Dropdown>
      </div>
    </Field>
  );
}
