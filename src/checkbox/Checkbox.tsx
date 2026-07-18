import { useEffect, useId, useRef, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import type { FieldBaseProps } from '../types';
import './checkbox.scss';

export type CheckboxMode = 'checkbox' | 'switch';

export interface CheckboxProps extends FieldBaseProps {
  checked: boolean | 'indeterminate';
  onChange: (checked: boolean) => void;
  mode?: CheckboxMode;
  /** Clickable text rendered beside the control. */
  label?: ReactNode;
}

export function Checkbox({
  checked,
  onChange,
  mode = 'checkbox',
  label,
  hint,
  error,
  required,
  disabled,
  size = 'md',
  className,
  id,
}: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const inputRef = useRef<HTMLInputElement>(null);
  const indeterminate = checked === 'indeterminate';

  useEffect(() => {
    if (inputRef.current) inputRef.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <div
      className={cx(
        'uikit-checkbox',
        `uikit-checkbox--${size}`,
        `uikit-checkbox--${mode}`,
        { 'uikit-checkbox--disabled': !!disabled, 'uikit-checkbox--error': !!error },
        className
      )}
    >
      <label className="uikit-checkbox__row" htmlFor={inputId}>
        <input
          ref={inputRef}
          id={inputId}
          type="checkbox"
          role={mode === 'switch' ? 'switch' : undefined}
          className="uikit-checkbox__input"
          checked={checked === true}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(indeterminate ? true : e.target.checked)}
        />
        {mode === 'switch' ? (
          <span className="uikit-checkbox__track" aria-hidden="true">
            <span className="uikit-checkbox__knob" />
          </span>
        ) : (
          <span className="uikit-checkbox__box" aria-hidden="true" />
        )}
        {label != null && (
          <span className="uikit-checkbox__label">
            {label}
            {required && (
              <span className="uikit-checkbox__required" aria-hidden="true">
                *
              </span>
            )}
          </span>
        )}
      </label>
      {error != null ? (
        <div className="uikit-checkbox__error" role="alert">
          {error}
        </div>
      ) : hint != null ? (
        <div className="uikit-checkbox__hint">{hint}</div>
      ) : null}
    </div>
  );
}
