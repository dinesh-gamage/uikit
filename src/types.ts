import type { ReactNode } from 'react';

export type Size = 'sm' | 'md' | 'lg';

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

/** Props shared by every form control that renders inside a Field wrapper. */
export interface FieldBaseProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  required?: boolean;
  disabled?: boolean;
  size?: Size;
  className?: string;
  id?: string;
}

export interface SelectOption<T = unknown> {
  value: string | number;
  label: ReactNode;
  disabled?: boolean;
  /** Arbitrary payload available to custom renderers. */
  data?: T;
}
