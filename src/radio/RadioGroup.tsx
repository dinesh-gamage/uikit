import { useId, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Field } from '../field/Field';
import type { FieldBaseProps, SelectOption } from '../types';
import './radio.scss';

export interface RadioGroupProps extends FieldBaseProps {
  options: SelectOption[];
  value: string | number | null;
  onChange: (value: string | number, option: SelectOption) => void;
  direction?: 'horizontal' | 'vertical';
  /** Custom label content for each option. */
  renderOption?: (option: SelectOption, checked: boolean) => ReactNode;
}

export function RadioGroup({
  options,
  value,
  onChange,
  direction = 'vertical',
  renderOption,
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  className,
  id,
}: RadioGroupProps) {
  const autoId = useId();
  const name = id ?? autoId;

  return (
    <Field label={label} hint={hint} error={error} required={required} disabled={disabled} size={size} className={className}>
      <div
        role="radiogroup"
        aria-label={typeof label === 'string' ? label : undefined}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        className={cx('uikit-radio', `uikit-radio--${size}`, `uikit-radio--${direction}`, {
          'uikit-radio--disabled': !!disabled,
          'uikit-radio--error': !!error,
        })}
      >
        {options.map((option, i) => {
          const checked = value != null && option.value === value;
          const optionId = `${name}-${i}`;
          const optionDisabled = disabled || option.disabled;
          return (
            <label
              key={String(option.value)}
              className={cx('uikit-radio__option', { 'uikit-radio__option--disabled': !!optionDisabled })}
              htmlFor={optionId}
            >
              <input
                id={optionId}
                type="radio"
                className="uikit-radio__input"
                name={name}
                value={String(option.value)}
                checked={checked}
                disabled={optionDisabled}
                onChange={() => onChange(option.value, option)}
              />
              <span className="uikit-radio__dot" aria-hidden="true" />
              <span className="uikit-radio__label">{renderOption ? renderOption(option, checked) : option.label}</span>
            </label>
          );
        })}
      </div>
    </Field>
  );
}
