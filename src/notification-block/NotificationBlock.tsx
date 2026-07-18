import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import type { Tone } from '../types';
import { ToneIcon, CloseIcon } from './tone-icons';
import './notification-block.scss';

export interface NotificationBlockProps {
  tone?: Tone;
  /** `bordered` adds a 3px tone-colored left border; both use the soft tint background. */
  variant?: 'filled' | 'bordered';
  /** Tighter padding and smaller text. */
  compact?: boolean;
  title?: ReactNode;
  children: ReactNode;
  /** Custom icon; defaults to the tone icon. Pass `null` to hide it. */
  icon?: ReactNode;
  /** When provided, shows a close button. */
  onClose?: () => void;
  className?: string;
}

export function NotificationBlock({
  tone = 'info',
  variant = 'filled',
  compact,
  title,
  children,
  icon,
  onClose,
  className,
}: NotificationBlockProps) {
  const resolvedIcon = icon === undefined ? <ToneIcon tone={tone} /> : icon;
  return (
    <div
      className={cx(
        'uikit-notification-block',
        `uikit-notification-block--${tone}`,
        `uikit-notification-block--${variant}`,
        { 'uikit-notification-block--compact': !!compact },
        className
      )}
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}
    >
      {resolvedIcon != null && <span className="uikit-notification-block__icon">{resolvedIcon}</span>}
      <div className="uikit-notification-block__body">
        {title != null && <div className="uikit-notification-block__title">{title}</div>}
        <div className="uikit-notification-block__content">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          className="uikit-notification-block__close"
          aria-label="Dismiss"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
}
