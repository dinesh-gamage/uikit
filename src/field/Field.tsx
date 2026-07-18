import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import type { FieldBaseProps } from '../types';
import './field.scss';

export interface FieldProps extends FieldBaseProps {
  children: ReactNode;
  /** id of the control the label points at */
  htmlFor?: string;
}

/** Standard wrapper: label, control, hint/error line. Used by every input component. */
export function Field({ label, hint, error, required, disabled, size = 'md', className, htmlFor, children }: FieldProps) {
  return (
    <div className={cx('uikit-field', `uikit-field--${size}`, { 'uikit-field--disabled': !!disabled, 'uikit-field--error': !!error }, className)}>
      {label != null && (
        <label className="uikit-field__label" htmlFor={htmlFor}>
          {label}
          {required && <span className="uikit-field__required" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error != null ? (
        <div className="uikit-field__error" role="alert">{error}</div>
      ) : hint != null ? (
        <div className="uikit-field__hint">{hint}</div>
      ) : null}
    </div>
  );
}
