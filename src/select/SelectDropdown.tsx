import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Spinner } from '../spinner';
import type { SelectOption } from '../types';
import type { SelectEngine } from './use-select-engine';

export const CheckIcon = (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 8.5 6.5 12 13 4.5" />
  </svg>
);

export const MinusIcon = (
  <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M3.5 8h9" />
  </svg>
);

export const ClearIcon = (
  <svg viewBox="0 0 16 16" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
    <path d="m4 4 8 8M12 4l-8 8" />
  </svg>
);

export interface SelectAllState {
  checked: boolean;
  indeterminate: boolean;
  onToggle: () => void;
}

interface SelectDropdownProps {
  engine: SelectEngine;
  searchable: boolean;
  multiple?: boolean;
  isSelected: (option: SelectOption) => boolean;
  renderOption?: (option: SelectOption, state: { highlighted: boolean; selected: boolean }) => ReactNode;
  loadingText?: ReactNode;
  emptyText?: ReactNode;
  selectAllState?: SelectAllState;
  footer?: ReactNode;
}

/** Dropdown body shared by Select and MultiSelect: search box, option list, empty/loading states. */
export function SelectDropdown({ engine, searchable, multiple, isSelected, renderOption, loadingText, emptyText, selectAllState, footer }: SelectDropdownProps) {
  const { query, setQuery, items, loading, highlighted, setHighlighted, onKeyDown, commit, listRef, listboxId, optionId } = engine;

  return (
    <div className="uikit-select__dropdown">
      {searchable && (
        <div className="uikit-select__search">
          <input
            className="uikit-select__search-input"
            type="text"
            value={query}
            placeholder="Search…"
            autoFocus
            aria-label="Search options"
            aria-autocomplete="list"
            aria-controls={listboxId}
            aria-activedescendant={highlighted >= 0 ? optionId(highlighted) : undefined}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {loading && items.length > 0 && <Spinner size="sm" className="uikit-select__search-spinner" />}
        </div>
      )}
      {loading && items.length === 0 ? (
        <div className="uikit-select__status">
          <Spinner size="sm" label={loadingText ?? 'Loading…'} />
        </div>
      ) : items.length === 0 ? (
        <div className="uikit-select__status">{emptyText ?? 'No options'}</div>
      ) : (
        <ul ref={listRef} className="uikit-select__list" role="listbox" id={listboxId} aria-multiselectable={multiple || undefined}>
          {selectAllState && (
            <li
              className="uikit-select__option uikit-select__option--select-all"
              role="option"
              aria-selected={selectAllState.checked}
              onMouseDown={(e) => e.preventDefault()}
              onClick={selectAllState.onToggle}
            >
              <span
                className={cx('uikit-select__checkbox', {
                  'uikit-select__checkbox--checked': selectAllState.checked,
                  'uikit-select__checkbox--indeterminate': !selectAllState.checked && selectAllState.indeterminate,
                })}
                aria-hidden="true"
              >
                {selectAllState.checked ? CheckIcon : selectAllState.indeterminate ? MinusIcon : null}
              </span>
              <span className="uikit-select__option-label">Select all</span>
            </li>
          )}
          {items.map((option, i) => {
            const selected = isSelected(option);
            const isHighlighted = i === highlighted;
            return (
              <li
                key={String(option.value)}
                id={optionId(i)}
                data-uikit-index={i}
                role="option"
                aria-selected={selected}
                aria-disabled={option.disabled || undefined}
                className={cx('uikit-select__option', {
                  'uikit-select__option--highlighted': isHighlighted,
                  'uikit-select__option--selected': selected,
                  'uikit-select__option--disabled': !!option.disabled,
                })}
                onMouseEnter={() => !option.disabled && setHighlighted(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => !option.disabled && commit(option)}
              >
                {multiple && (
                  <span className={cx('uikit-select__checkbox', { 'uikit-select__checkbox--checked': selected })} aria-hidden="true">
                    {selected && CheckIcon}
                  </span>
                )}
                <span className="uikit-select__option-label">
                  {renderOption ? renderOption(option, { highlighted: isHighlighted, selected }) : option.label}
                </span>
                {!multiple && selected && (
                  <span className="uikit-select__check" aria-hidden="true">
                    {CheckIcon}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {footer}
    </div>
  );
}
