import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

export interface DemoEntry {
  id: string;
  title: string;
  group: string;
  component: LazyExoticComponent<ComponentType>;
}

// Demos are lazy-loaded so the showcase itself demonstrates code splitting.
export const demos: DemoEntry[] = [
  { id: 'icon', title: 'Icon', group: 'Display', component: lazy(() => import('./demos/IconDemo')) },
  { id: 'input', title: 'Input', group: 'Inputs', component: lazy(() => import('./demos/InputDemo')) },
  { id: 'checkbox', title: 'Checkbox / Switch', group: 'Inputs', component: lazy(() => import('./demos/CheckboxDemo')) },
  { id: 'radio', title: 'Radio Group', group: 'Inputs', component: lazy(() => import('./demos/RadioDemo')) },
  { id: 'datalist', title: 'Datalist Input', group: 'Inputs', component: lazy(() => import('./demos/DatalistDemo')) },
  { id: 'file-input', title: 'File Input', group: 'Inputs', component: lazy(() => import('./demos/FileInputDemo')) },
  { id: 'select', title: 'Select', group: 'Pickers', component: lazy(() => import('./demos/SelectDemo')) },
  { id: 'multi-select', title: 'MultiSelect', group: 'Pickers', component: lazy(() => import('./demos/MultiSelectDemo')) },
  { id: 'date-picker', title: 'Date Picker', group: 'Pickers', component: lazy(() => import('./demos/DatePickerDemo')) },
  { id: 'datetime-picker', title: 'DateTime Picker', group: 'Pickers', component: lazy(() => import('./demos/DateTimePickerDemo')) },
  { id: 'date-range', title: 'Date Range', group: 'Pickers', component: lazy(() => import('./demos/DateRangeDemo')) },
  { id: 'time-range', title: 'Time Range', group: 'Pickers', component: lazy(() => import('./demos/TimeRangeDemo')) },
  { id: 'dynamic-form', title: 'Dynamic Form', group: 'Forms', component: lazy(() => import('./demos/DynamicFormDemo')) },
  { id: 'list', title: 'List', group: 'Data', component: lazy(() => import('./demos/ListDemo')) },
  { id: 'spinner', title: 'Spinner', group: 'Feedback', component: lazy(() => import('./demos/SpinnerDemo')) },
  { id: 'skeleton', title: 'Skeleton', group: 'Feedback', component: lazy(() => import('./demos/SkeletonDemo')) },
  { id: 'toast', title: 'Toast', group: 'Feedback', component: lazy(() => import('./demos/ToastDemo')) },
  { id: 'alert', title: 'Alert', group: 'Feedback', component: lazy(() => import('./demos/AlertDemo')) },
  { id: 'notification-block', title: 'Notification Block', group: 'Feedback', component: lazy(() => import('./demos/NotificationBlockDemo')) },
];
