import type { ReactNode } from 'react';
import type { SelectOption } from '../types';
import type { FormData, ValidationRule } from './validators';

export type { FormData, ValidationRule } from './validators';

export type FieldType =
  | 'text'
  | 'password'
  | 'email'
  | 'number'
  | 'textarea'
  | 'checkbox'
  | 'switch'
  | 'radio'
  | 'select'
  | 'multiselect'
  | 'datalist'
  | 'file'
  | 'date'
  | 'datetime'
  | 'daterange'
  | 'timerange'
  | 'hidden'
  | 'custom';

/** Context passed to a field with type 'custom'. */
export interface FormFieldRenderContext {
  value: any;
  setValue: (value: any) => void;
  data: FormData;
  error: string | null;
  field: FormFieldDef;
}

export interface FormFieldDef {
  name: string;
  type: FieldType;
  label?: ReactNode;
  placeholder?: string;
  hint?: ReactNode;
  defaultValue?: any;
  disabled?: boolean | ((data: FormData) => boolean);
  /** When false, the field (and its value) is excluded from validation and the submitted data. */
  show?: (data: FormData) => boolean;
  validation?: ValidationRule;

  /** radio / select / multiselect / datalist */
  options?: SelectOption[] | ((query: string) => Promise<SelectOption[]>);
  /** Custom option row renderer; select / multiselect only. */
  renderOption?: (option: SelectOption, state: { highlighted: boolean; selected: boolean }) => ReactNode;
  /** Custom trigger content for the selected option; select / multiselect only, and ignored by multiselect. */
  renderValue?: (option: SelectOption) => ReactNode;
  /** textarea */
  rows?: number;
  /** file */
  accept?: string[];
  multiple?: boolean;
  fileMode?: 'compact' | 'expanded';
  /** date / datetime / daterange / timerange */
  min?: Date;
  max?: Date;
  /** timerange minute stepper increment */
  step?: number;
  /** required when type is 'custom' */
  render?: (ctx: FormFieldRenderContext) => ReactNode;
}

export interface FormSectionDef {
  id?: string;
  title?: ReactNode;
  description?: ReactNode;
  columns?: 1 | 2 | 3;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  show?: (data: FormData) => boolean;
  fields?: FormFieldDef[];
  /** Sub-sections, rendered after this section's own fields. */
  sections?: FormSectionDef[];
}

export interface FormSchema {
  sections: FormSectionDef[];
}
