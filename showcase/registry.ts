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
  { id: 'button', title: 'Button', group: 'Display', component: lazy(() => import('./demos/ButtonDemo')) },
  { id: 'chip', title: 'Chip', group: 'Display', component: lazy(() => import('./demos/ChipDemo')) },
  { id: 'icon-button', title: 'Icon Button', group: 'Display', component: lazy(() => import('./demos/IconButtonDemo')) },
  { id: 'dropdown', title: 'Dropdown', group: 'Display', component: lazy(() => import('./demos/DropdownDemo')) },
  { id: 'input', title: 'Input', group: 'Inputs', component: lazy(() => import('./demos/InputDemo')) },
  { id: 'checkbox', title: 'Checkbox / Switch', group: 'Inputs', component: lazy(() => import('./demos/CheckboxDemo')) },
  { id: 'radio', title: 'Radio Group', group: 'Inputs', component: lazy(() => import('./demos/RadioDemo')) },
  { id: 'datalist', title: 'Datalist Input', group: 'Inputs', component: lazy(() => import('./demos/DatalistDemo')) },
  { id: 'file-input', title: 'File Input', group: 'Inputs', component: lazy(() => import('./demos/FileInputDemo')) },
  { id: 'color-picker', title: 'Color Picker', group: 'Inputs', component: lazy(() => import('./demos/ColorPickerDemo')) },
  { id: 'select', title: 'Select', group: 'Pickers', component: lazy(() => import('./demos/SelectDemo')) },
  { id: 'multi-select', title: 'MultiSelect', group: 'Pickers', component: lazy(() => import('./demos/MultiSelectDemo')) },
  { id: 'date-picker', title: 'Date Picker', group: 'Pickers', component: lazy(() => import('./demos/DatePickerDemo')) },
  { id: 'datetime-picker', title: 'DateTime Picker', group: 'Pickers', component: lazy(() => import('./demos/DateTimePickerDemo')) },
  { id: 'date-range', title: 'Date Range', group: 'Pickers', component: lazy(() => import('./demos/DateRangeDemo')) },
  { id: 'time-range', title: 'Time Range', group: 'Pickers', component: lazy(() => import('./demos/TimeRangeDemo')) },
  { id: 'dynamic-form', title: 'Dynamic Form', group: 'Forms', component: lazy(() => import('./demos/DynamicFormDemo')) },
  { id: 'list', title: 'List', group: 'Data', component: lazy(() => import('./demos/ListDemo')) },
  { id: 'kanban', title: 'Kanban Board', group: 'Data', component: lazy(() => import('./demos/KanbanBoardDemo')) },
  { id: 'event-calendar', title: 'Event Calendar', group: 'Data', component: lazy(() => import('./demos/EventCalendarDemo')) },
  { id: 'tabs', title: 'Tabs', group: 'Navigation', component: lazy(() => import('./demos/TabsDemo')) },
  { id: 'breadcrumb', title: 'Breadcrumb', group: 'Navigation', component: lazy(() => import('./demos/BreadcrumbDemo')) },
  { id: 'pagination', title: 'Pagination', group: 'Navigation', component: lazy(() => import('./demos/PaginationDemo')) },
  { id: 'tree-view', title: 'Tree View', group: 'Navigation', component: lazy(() => import('./demos/TreeViewDemo')) },
  { id: 'spinner', title: 'Spinner', group: 'Feedback', component: lazy(() => import('./demos/SpinnerDemo')) },
  { id: 'skeleton', title: 'Skeleton', group: 'Feedback', component: lazy(() => import('./demos/SkeletonDemo')) },
  { id: 'toast', title: 'Toast', group: 'Feedback', component: lazy(() => import('./demos/ToastDemo')) },
  { id: 'alert', title: 'Alert', group: 'Feedback', component: lazy(() => import('./demos/AlertDemo')) },
  { id: 'notification-block', title: 'Notification Block', group: 'Feedback', component: lazy(() => import('./demos/NotificationBlockDemo')) },
  { id: 'modal', title: 'Modal', group: 'Feedback', component: lazy(() => import('./demos/ModalDemo')) },
  { id: 'progress-meter', title: 'Progress Meter', group: 'Charts', component: lazy(() => import('./demos/ProgressMeterDemo')) },
  { id: 'sparkline', title: 'Sparkline', group: 'Charts', component: lazy(() => import('./demos/SparklineDemo')) },
  { id: 'bar-chart', title: 'Bar Chart', group: 'Charts', component: lazy(() => import('./demos/BarChartDemo')) },
  { id: 'line-chart', title: 'Line Chart', group: 'Charts', component: lazy(() => import('./demos/LineChartDemo')) },
  { id: 'donut-chart', title: 'Donut Chart', group: 'Charts', component: lazy(() => import('./demos/DonutChartDemo')) },
];
