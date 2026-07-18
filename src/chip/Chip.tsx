import type { MouseEvent, ReactNode } from 'react';
import { cx } from '../utils/cx';
import type { Tone } from '../types';
import './chip.scss';

export interface ChipProps {
  /** Label. Omit alongside an icon to render a circular icon-only chip. */
  children?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  tone?: Tone;
  variant?: 'soft' | 'outline';
  size?: 'sm' | 'md';
  onClick?: () => void;
  /** Renders a small remove (×) button after `rightIcon`. */
  onRemove?: () => void;
  disabled?: boolean;
  className?: string;
}

function RemoveIcon() {
  return (
    <svg viewBox="0 0 16 16" width="9" height="9" aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Chip({
  children,
  leftIcon,
  rightIcon,
  tone = 'neutral',
  variant = 'soft',
  size = 'md',
  onClick,
  onRemove,
  disabled,
  className,
}: ChipProps) {
  const hasLabel = children != null && children !== false;
  const soloIcon = !hasLabel ? (leftIcon ?? rightIcon) : null;
  const iconOnly = soloIcon != null;

  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };

  const handleRemove = (e: MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    onRemove?.();
  };

  const classes = cx(
    'uikit-chip',
    `uikit-chip--${tone}`,
    `uikit-chip--${variant}`,
    `uikit-chip--${size}`,
    {
      'uikit-chip--clickable': !!onClick,
      'uikit-chip--icon-only': iconOnly,
      'uikit-chip--disabled': !!disabled,
    },
    className
  );

  const inner = iconOnly ? (
    <span className="uikit-chip__icon">{soloIcon}</span>
  ) : (
    <>
      {leftIcon != null && <span className="uikit-chip__icon">{leftIcon}</span>}
      {hasLabel && <span className="uikit-chip__label">{children}</span>}
      {rightIcon != null && <span className="uikit-chip__icon">{rightIcon}</span>}
    </>
  );

  const removeButton = onRemove && (
    <button
      type="button"
      className="uikit-chip__remove"
      aria-label="Remove"
      onClick={handleRemove}
      disabled={disabled}
    >
      <RemoveIcon />
    </button>
  );

  if (onClick) {
    return (
      <button type="button" className={classes} disabled={disabled} onClick={handleClick}>
        {inner}
        {removeButton}
      </button>
    );
  }

  return (
    <span className={classes}>
      {inner}
      {removeButton}
    </span>
  );
}
