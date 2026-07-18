import type { CSSProperties } from 'react';
import { cx } from '../utils/cx';
import './icon.scss';

/**
 * Structural type matching Font Awesome's IconDefinition, so any
 * `@fortawesome/free-*-svg-icons` import works without this package
 * depending on Font Awesome. Icons are compiled into the consumer bundle.
 */
export interface SvgIconDefinition {
  prefix: string;
  iconName: string;
  icon: [number, number, string[], string, string | string[]];
}

/** An SVG icon definition, or an image URL / data URL. */
export type IconSource = SvgIconDefinition | string;

export interface IconProps {
  icon: IconSource;
  /** px number or any CSS size. Default 16. */
  size?: number | string;
  /** Only applies to SVG icons. Defaults to currentColor. */
  color?: string;
  /** Accessible label. Omit for decorative icons. */
  title?: string;
  spin?: boolean;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
}

function isSvgDefinition(icon: IconSource): icon is SvgIconDefinition {
  return typeof icon === 'object' && icon != null && Array.isArray((icon as SvgIconDefinition).icon);
}

export function Icon({ icon, size = 16, color, title, spin, className, style, onClick }: IconProps) {
  const cssSize = typeof size === 'number' ? `${size}px` : size;
  const cls = cx('uikit-icon', { 'uikit-icon--spin': !!spin, 'uikit-icon--clickable': !!onClick }, className);
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const };

  if (isSvgDefinition(icon)) {
    const [width, height, , , path] = icon.icon;
    const paths = Array.isArray(path) ? path : [path];
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className={cls}
        style={{ width: cssSize, height: cssSize, color, ...style }}
        onClick={onClick}
        {...a11y}
      >
        {title && <title>{title}</title>}
        {paths.map((d, i) => (
          <path key={i} d={d} fill="currentColor" opacity={paths.length > 1 && i === 0 ? 0.4 : 1} />
        ))}
      </svg>
    );
  }

  return (
    <img
      src={icon}
      alt={title ?? ''}
      className={cls}
      style={{ width: cssSize, height: cssSize, ...style }}
      onClick={onClick}
      draggable={false}
    />
  );
}
