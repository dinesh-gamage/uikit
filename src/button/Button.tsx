import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import type { Size } from '../types';
import { Spinner } from '../spinner';
import './button.scss';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'link';

export interface ButtonProps {
  variant?: ButtonVariant;
  size?: Size;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  /** Square icon-only button. Provide `title` for the accessible label. */
  iconOnly?: boolean;
  /** Tooltip; also used as the aria-label fallback (required in practice for `iconOnly`). */
  title?: string;
  loading?: boolean;
  loadingLabel?: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  disabled?: boolean;
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
  /** Marks the button as pressed/selected (e.g. toggle usage). */
  active?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  iconOnly,
  title,
  loading,
  loadingLabel,
  onClick,
  disabled,
  fullWidth,
  type = 'button',
  active,
  className,
  children,
}: ButtonProps) {
  const [pending, setPending] = useState(false);
  // Mirrors `pending` state but readable synchronously, so a second click fired
  // before the disabled-attribute re-render commits still gets blocked.
  const pendingRef = useRef(false);

  const isLoading = !!loading || pending;
  const isDisabled = !!disabled || isLoading;
  const hasLabel = children != null && children !== false;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (!onClick || pendingRef.current) return;
    const result = onClick(e);
    if (result && typeof (result as Promise<void>).then === 'function') {
      pendingRef.current = true;
      setPending(true);
      (result as Promise<void>).then(
        () => {
          pendingRef.current = false;
          setPending(false);
        },
        (err: unknown) => {
          pendingRef.current = false;
          setPending(false);
          throw err;
        }
      );
    }
  };

  const label = isLoading && loadingLabel !== undefined ? loadingLabel : children;
  const ariaLabel = title && (iconOnly || !hasLabel) ? title : undefined;

  const content = iconOnly ? (
    isLoading ? <Spinner size="sm" /> : (leftIcon ?? children)
  ) : (
    <>
      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        leftIcon != null && <span className="uikit-button__icon">{leftIcon}</span>
      )}
      {hasLabel && <span className="uikit-button__label">{label}</span>}
      {hasLabel && !isLoading && rightIcon != null && <span className="uikit-button__icon">{rightIcon}</span>}
    </>
  );

  return (
    <button
      type={type}
      className={cx(
        'uikit-button',
        `uikit-button--${variant}`,
        `uikit-button--${size}`,
        {
          'uikit-button--icon-only': !!iconOnly,
          'uikit-button--full-width': !!fullWidth,
          'uikit-button--active': !!active,
          'uikit-button--loading': isLoading,
        },
        className
      )}
      disabled={isDisabled}
      title={title}
      aria-label={ariaLabel}
      aria-busy={isLoading || undefined}
      onClick={handleClick}
    >
      {content}
    </button>
  );
}
