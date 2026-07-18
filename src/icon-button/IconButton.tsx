import { useRef, useState, type MouseEvent, type ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Spinner } from '../spinner';
import { Tooltip } from '../tooltip';
import './icon-button.scss';

export type IconButtonTone = 'neutral' | 'primary' | 'danger';
export type IconButtonSize = 'sm' | 'md';

export interface IconButtonProps {
  icon: ReactNode;
  /** Required: used as the aria-label and, unless `tooltip` is false, the tooltip content. */
  label: string;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  /** Promise-aware: while pending, the icon is replaced by a small Spinner and clicks are ignored. */
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  disabled?: boolean;
  /** Persistent pressed/selected look (soft background). */
  active?: boolean;
  /** Wrap in a Tooltip showing `label`. Default true; set false for aria-label only. */
  tooltip?: boolean;
  type?: 'button' | 'submit';
  className?: string;
}

export function IconButton({
  icon,
  label,
  tone = 'neutral',
  size = 'md',
  onClick,
  disabled,
  active,
  tooltip = true,
  type = 'button',
  className,
}: IconButtonProps) {
  const [pending, setPending] = useState(false);
  // Mirrors `pending` but readable synchronously, so a second click fired before the
  // disabled-attribute re-render commits still gets blocked. Mirrors Button's pattern.
  const pendingRef = useRef(false);

  const isDisabled = !!disabled || pending;

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
        },
      );
    }
  };

  const button = (
    <button
      type={type}
      className={cx(
        'uikit-icon-button',
        `uikit-icon-button--${tone}`,
        `uikit-icon-button--${size}`,
        {
          'uikit-icon-button--active': !!active,
          'uikit-icon-button--loading': pending,
        },
        className,
      )}
      disabled={isDisabled}
      aria-label={label}
      aria-busy={pending || undefined}
      onClick={handleClick}
    >
      {pending ? <Spinner size="sm" /> : icon}
    </button>
  );

  if (!tooltip) return button;

  return <Tooltip content={label}>{button}</Tooltip>;
}
