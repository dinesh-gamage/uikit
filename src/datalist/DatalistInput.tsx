import { useId } from 'react';
import { cx } from '../utils/cx';
import { Field } from '../field/Field';
import type { FieldBaseProps, SelectOption } from '../types';
import './datalist.scss';

export interface DatalistInputProps extends FieldBaseProps {
  options: (string | SelectOption)[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DatalistInput({
  options,
  value,
  onChange,
  placeholder,
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  className,
  id,
}: DatalistInputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const listId = `${inputId}-list`;

  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      required={required}
      disabled={disabled}
      size={size}
      className={className}
      htmlFor={inputId}
    >
      <div
        className={cx('uikit-datalist', `uikit-datalist--${size}`, {
          'uikit-datalist--error': !!error,
          'uikit-datalist--disabled': !!disabled,
        })}
      >
        <input
          id={inputId}
          className="uikit-datalist__control"
          type="text"
          list={listId}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <datalist id={listId}>
        {options.map((option, i) =>
          typeof option === 'string' ? (
            <option key={i} value={option} />
          ) : (
            <option
              key={i}
              value={String(option.value)}
              label={typeof option.label === 'string' ? option.label : undefined}
            />
          )
        )}
      </datalist>
    </Field>
  );
}
