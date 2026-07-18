import {
  forwardRef,
  useId,
  useImperativeHandle,
  useRef,
  useState,
  type InputHTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react';
import { cx } from '../utils/cx';
import { Field } from '../field/Field';
import type { FieldBaseProps } from '../types';
import './input.scss';

export type InputType = 'text' | 'password' | 'email' | 'number';

export interface InputHandle {
  focus: () => void;
}

export interface InputProps extends FieldBaseProps {
  type?: InputType;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  /** Show a clear button when the value is non-empty. Default true. */
  clearable?: boolean;
  onClear?: () => void;
  onFocus?: () => void;
  onBlur?: (value: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
  /** Extra attributes forwarded to the native input (min/max/step/autoComplete etc.). */
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  fullWidth?: boolean;
}

function EyeIcon({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false">
      <path
        fill="currentColor"
        d="M8 3.2C4.6 3.2 1.9 5.5 1 8c.9 2.5 3.6 4.8 7 4.8s6.1-2.3 7-4.8c-.9-2.5-3.6-4.8-7-4.8Zm0 8A3.2 3.2 0 1 1 8 4.8a3.2 3.2 0 0 1 0 6.4Zm0-1.7A1.5 1.5 0 1 0 8 6.5a1.5 1.5 0 0 0 0 3Z"
      />
      {!open && <path fill="currentColor" d="m2.6 1.3 12.1 12.1-1.1 1.1L1.5 2.4z" />}
    </svg>
  );
}

export const Input = forwardRef<InputHandle, InputProps>(function Input(props, ref) {
  const {
    type = 'text',
    value,
    onChange,
    placeholder,
    prefix,
    suffix,
    clearable = true,
    onClear,
    onFocus,
    onBlur,
    onKeyDown,
    inputProps,
    fullWidth,
    label,
    hint,
    error,
    required,
    disabled,
    size = 'md',
    className,
    id,
  } = props;

  const autoId = useId();
  const inputId = id ?? autoId;
  const innerRef = useRef<HTMLInputElement>(null);
  const [showPassword, setShowPassword] = useState(false);

  useImperativeHandle(ref, () => ({ focus: () => innerRef.current?.focus() }), []);

  const readOnly = !!inputProps?.readOnly;
  const showClear = clearable && value !== '' && !disabled && !readOnly;
  const effectiveType = type === 'password' && showPassword ? 'text' : type;

  const clear = () => {
    onChange('');
    onClear?.();
    innerRef.current?.focus();
  };

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
        className={cx('uikit-input', `uikit-input--${size}`, {
          'uikit-input--error': !!error,
          'uikit-input--disabled': !!disabled,
          'uikit-input--full': !!fullWidth,
        })}
      >
        {prefix != null && <span className="uikit-input__prefix">{prefix}</span>}
        <input
          {...inputProps}
          ref={innerRef}
          id={inputId}
          className="uikit-input__control"
          type={effectiveType}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-invalid={error ? true : undefined}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={(e) => onBlur?.(e.target.value)}
          onKeyDown={onKeyDown}
        />
        {showClear && (
          <button type="button" className="uikit-input__clear" aria-label="Clear input" onClick={clear}>
            <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false">
              <path
                fill="currentColor"
                d="m4.1 3 3.9 3.9L11.9 3 13 4.1 9.1 8l3.9 3.9-1.1 1.1L8 9.1 4.1 13 3 11.9 6.9 8 3 4.1z"
              />
            </svg>
          </button>
        )}
        {type === 'password' && (
          <button
            type="button"
            className="uikit-input__toggle"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            disabled={disabled}
            onClick={() => setShowPassword((s) => !s)}
          >
            <EyeIcon open={showPassword} />
          </button>
        )}
        {suffix != null && <span className="uikit-input__suffix">{suffix}</span>}
      </div>
    </Field>
  );
});
