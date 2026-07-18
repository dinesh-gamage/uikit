import { useMemo, useRef, useState } from 'react';
import { DynamicForm, type DynamicFormHandle, type FormData, type FormSchema } from '../../src/form';
import type { SelectOption, Size } from '../../src/types';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import './demo-widgets.scss';

const CLIENTS: SelectOption[] = [
  { value: 'acme', label: 'Acme Corp' },
  { value: 'globex', label: 'Globex' },
  { value: 'initech', label: 'Initech' },
  { value: 'umbrella', label: 'Umbrella Corp' },
  { value: 'stark', label: 'Stark Industries' },
  { value: 'wayne', label: 'Wayne Enterprises' },
];

// Simulates a real lookup endpoint: 300ms latency, filtered by query.
async function fetchClients(query: string): Promise<SelectOption[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const q = query.trim().toLowerCase();
  if (!q) return CLIENTS;
  return CLIENTS.filter((c) => String(c.label).toLowerCase().includes(q));
}

const TAG_OPTIONS: SelectOption[] = ['frontend', 'backend', 'design', 'urgent', 'research', 'infra'].map((t) => ({ value: t, label: t }));

const PRIORITY_OPTIONS: SelectOption[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const ACCENT_COLORS = ['#4f6df5', '#30a46c', '#f5a623', '#e5484d', '#8b5cf6'];

function buildSchema(columns: 1 | 2, collapsibleDetails: boolean): FormSchema {
  return {
    sections: [
      {
        id: 'basics',
        title: 'Basics',
        description: 'Core details about the project.',
        columns,
        fields: [
          {
            name: 'name',
            type: 'text',
            label: 'Project name',
            placeholder: 'e.g. Website redesign',
            validation: { required: true, minLength: 3 },
          },
          {
            name: 'client',
            type: 'select',
            label: 'Client',
            placeholder: 'Search clients…',
            options: fetchClients,
            validation: { required: true },
          },
          {
            name: 'budget',
            type: 'number',
            label: 'Budget',
            placeholder: '0',
            validation: { min: 0, allowNegative: false },
          },
          { name: 'active', type: 'switch', label: 'Active', defaultValue: true },
        ],
      },
      {
        id: 'schedule',
        title: 'Schedule',
        columns,
        fields: [
          {
            name: 'dateRange',
            type: 'daterange',
            label: 'Project dates',
            validation: {
              // Required via a custom validator rather than `required`, since "required" here
              // really means "both a start and an end are present".
              validate: (value: { start: Date | null; end: Date | null } | null) =>
                value?.start && value?.end ? null : 'Please select a start and end date',
            },
          },
          { name: 'priority', type: 'radio', label: 'Priority', options: PRIORITY_OPTIONS, defaultValue: 'medium' },
          { name: 'hasDeadline', type: 'checkbox', label: 'Has a hard deadline' },
          {
            name: 'deadline',
            type: 'date',
            label: 'Deadline',
            show: (data) => !!data.hasDeadline,
            validation: { required: (data) => !!data.hasDeadline },
          },
        ],
      },
      {
        id: 'details',
        title: 'Details',
        collapsible: collapsibleDetails,
        defaultExpanded: false,
        columns,
        fields: [
          { name: 'notes', type: 'textarea', label: 'Notes', rows: 4, placeholder: 'Anything the team should know…' },
          { name: 'tags', type: 'multiselect', label: 'Tags', options: TAG_OPTIONS },
          { name: 'attachment', type: 'file', label: 'Attachment', fileMode: 'compact', accept: ['.pdf', 'image/*'] },
          { name: 'kickoff', type: 'datetime', label: 'Kickoff' },
          { name: 'contactHours', type: 'timerange', label: 'Contact hours', step: 30 },
          {
            name: 'color',
            type: 'custom',
            label: 'Accent color',
            hint: 'Shown on the project card.',
            defaultValue: ACCENT_COLORS[0],
            render: ({ value, setValue }) => (
              <div className="sc-color-swatches">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`sc-color-swatch${value === c ? ' sc-color-swatch--active' : ''}`}
                    style={{ background: c }}
                    aria-label={`Choose ${c}`}
                    aria-pressed={value === c}
                    onClick={() => setValue(c)}
                  />
                ))}
              </div>
            ),
          },
        ],
      },
    ],
  };
}

function Example({ v }: { v: ControlValues }) {
  const formRef = useRef<DynamicFormHandle>(null);
  const [submitted, setSubmitted] = useState<FormData | null>(null);

  const schema = useMemo(
    () => buildSchema(Number(v.columns) as 1 | 2, !!v.collapsible),
    [v.columns, v.collapsible]
  );

  return (
    <div className="sc-demo-widgets">
      <div className="sc-demo-widgets__stack sc-demo-widgets__stack--wide">
        <DynamicForm
          ref={formRef}
          schema={schema}
          onSubmit={(data) => setSubmitted(data)}
          onCancel={() => {
            formRef.current?.reset();
            setSubmitted(null);
          }}
          loading={!!v.loading}
          disabled={!!v.disabled}
          size={v.size as Size}
        />
        {submitted && (
          <pre className="sc-demo-widgets__json">
            <code>{JSON.stringify(submitted, null, 2)}</code>
          </pre>
        )}
      </div>
    </div>
  );
}

const demo: DemoDef = {
  title: 'Dynamic Form',
  description:
    'Renders a whole form — sections, columns, conditional fields, async options, custom fields — from a plain schema object. Validates on blur-ish touch, focuses the first error on failed submit, and exposes an imperative handle (submit/validate/getData/setData/reset/setErrors).',
  controls: [
    { type: 'select', name: 'columns', options: ['1', '2'], defaultValue: '2' },
    { type: 'boolean', name: 'collapsible', label: 'Details is collapsible', defaultValue: true },
    { type: 'boolean', name: 'loading', defaultValue: false },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'select', name: 'size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
  ],
  render: (v) => <Example v={v} />,
  code: () => `import { DynamicForm, type FormSchema } from '@dinesh-gamage/uikit/form';

const schema: FormSchema = {
  sections: [
    {
      title: 'Basics',
      columns: 2,
      fields: [
        { name: 'name', type: 'text', label: 'Project name', validation: { required: true, minLength: 3 } },
        { name: 'client', type: 'select', label: 'Client', options: fetchClients, validation: { required: true } },
        { name: 'budget', type: 'number', label: 'Budget', validation: { min: 0, allowNegative: false } },
        { name: 'active', type: 'switch', label: 'Active', defaultValue: true },
      ],
    },
    {
      title: 'Schedule',
      columns: 2,
      fields: [
        {
          name: 'dateRange',
          type: 'daterange',
          label: 'Project dates',
          validation: {
            validate: (value) => (value?.start && value?.end ? null : 'Please select a start and end date'),
          },
        },
        { name: 'priority', type: 'radio', label: 'Priority', options: PRIORITY_OPTIONS, defaultValue: 'medium' },
        { name: 'hasDeadline', type: 'checkbox', label: 'Has a hard deadline' },
        {
          name: 'deadline',
          type: 'date',
          label: 'Deadline',
          show: (data) => !!data.hasDeadline,
          validation: { required: (data) => !!data.hasDeadline },
        },
      ],
    },
    {
      title: 'Details',
      collapsible: true,
      defaultExpanded: false,
      columns: 2,
      fields: [
        { name: 'notes', type: 'textarea', label: 'Notes', rows: 4 },
        { name: 'tags', type: 'multiselect', label: 'Tags', options: TAG_OPTIONS },
        { name: 'attachment', type: 'file', label: 'Attachment', fileMode: 'compact' },
        { name: 'kickoff', type: 'datetime', label: 'Kickoff' },
        { name: 'contactHours', type: 'timerange', label: 'Contact hours', step: 30 },
        {
          name: 'color',
          type: 'custom',
          label: 'Accent color',
          defaultValue: ACCENT_COLORS[0],
          render: ({ value, setValue }) => (
            <div className="swatches">
              {ACCENT_COLORS.map((c) => (
                <button key={c} style={{ background: c }} aria-pressed={value === c} onClick={() => setValue(c)} />
              ))}
            </div>
          ),
        },
      ],
    },
  ],
};

<DynamicForm
  schema={schema}
  onSubmit={(data) => save(data)}
  onCancel={() => formRef.current?.reset()}
/>`,
};

export default function DynamicFormDemo() {
  return <DemoPage demo={demo} />;
}
