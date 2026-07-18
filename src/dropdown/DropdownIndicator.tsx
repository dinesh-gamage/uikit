import { cx } from '../utils/cx';

export interface DropdownIndicatorProps {
  /** Rotates the chevron 180° when true. */
  open: boolean;
  className?: string;
}

/** Small chevron-down glyph that rotates when its owning dropdown is open. */
export function DropdownIndicator({ open, className }: DropdownIndicatorProps) {
  return (
    <span className={cx('uikit-dropdown-indicator', { 'uikit-dropdown-indicator--open': open }, className)} aria-hidden="true">
      <svg viewBox="0 0 16 16" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="m3.5 6 4.5 4.5L12.5 6" />
      </svg>
    </span>
  );
}
