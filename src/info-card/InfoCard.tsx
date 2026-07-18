import type { ReactNode } from 'react';
import { cx } from '../utils/cx';
import { Skeleton } from '../skeleton';
import './info-card.scss';

export interface InfoField {
  label: ReactNode;
  value: ReactNode;
  icon?: ReactNode;
  /** Custom renderer for the raw value. Not called when value is null/undefined. */
  render?: (value: any) => ReactNode;
}

export interface InfoCardProps {
  fields: InfoField[];
  /** Number of grid columns. */
  columns?: 1 | 2 | 3;
  /** vertical = value under label; horizontal = label and value on one row. */
  layout?: 'vertical' | 'horizontal';
  title?: ReactNode;
  /** Render a skeleton per field. */
  loading?: boolean;
  className?: string;
}

function fieldValue(field: InfoField): ReactNode {
  if (field.value == null) return '—';
  return field.render ? field.render(field.value) : field.value;
}

/** Generic labeled-fields card. Also used by ListView's details panel. */
export function InfoCard({ fields, columns = 2, layout = 'vertical', title, loading, className }: InfoCardProps) {
  return (
    <section className={cx('uikit-info-card', `uikit-info-card--cols-${columns}`, `uikit-info-card--${layout}`, className)}>
      {title != null && <h3 className="uikit-info-card__title">{title}</h3>}
      <div className="uikit-info-card__grid">
        {fields.map((field, i) => (
          <div className="uikit-info-card__field" key={i}>
            {field.icon != null && <span className="uikit-info-card__icon">{field.icon}</span>}
            <div className="uikit-info-card__content">
              <div className="uikit-info-card__label">{field.label}</div>
              <div className="uikit-info-card__value">
                {loading ? <Skeleton width={layout === 'horizontal' ? 80 : '70%'} /> : fieldValue(field)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
