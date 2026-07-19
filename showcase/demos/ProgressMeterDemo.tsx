import { ProgressMeter } from '../../src/progress-meter';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import './chart-demo-widgets.scss';

const demo: DemoDef = {
  title: 'Progress Meter',
  description:
    'Horizontal progress bar with an auto tone that shifts from primary to warning to danger as the value approaches or exceeds max. Value is formatted with locale-aware thousands separators by default.',
  controls: [
    { type: 'number', name: 'value', defaultValue: 3200, min: 0, max: 10000 },
    { type: 'number', name: 'max', defaultValue: 5000, min: 1, max: 10000 },
    { type: 'select', name: 'size', options: ['sm', 'md'], defaultValue: 'md' },
    { type: 'select', name: 'tone', options: ['auto', 'primary', 'success', 'warning', 'danger'], defaultValue: 'auto' },
    { type: 'text', name: 'label', defaultValue: 'Monthly budget' },
    { type: 'boolean', name: 'showValue', label: 'show value', defaultValue: true },
  ],
  render: (v) => (
    <div className="sc-chart-demo">
      <div className="sc-chart-demo__section">
        <ProgressMeter
          value={v.value as number}
          max={v.max as number}
          size={v.size as 'sm' | 'md'}
          tone={v.tone as 'auto' | 'primary' | 'success' | 'warning' | 'danger'}
          label={(v.label as string) || undefined}
          showValue={!!v.showValue}
        />
      </div>

      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Sizes</p>
        <div className="sc-chart-demo__row">
          <span className="sc-chart-demo__row-label">sm</span>
          <ProgressMeter value={40} max={100} size="sm" showValue={false} />
        </div>
        <div className="sc-chart-demo__row">
          <span className="sc-chart-demo__row-label">md</span>
          <ProgressMeter value={40} max={100} size="md" showValue={false} />
        </div>
      </div>

      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Explicit tones</p>
        <ProgressMeter value={60} max={100} tone="primary" label="Primary" />
        <ProgressMeter value={60} max={100} tone="success" label="Success" />
        <ProgressMeter value={60} max={100} tone="warning" label="Warning" />
        <ProgressMeter value={60} max={100} tone="danger" label="Danger" />
      </div>

      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Auto tone — 50% / 85% / 120%</p>
        <ProgressMeter value={50} max={100} tone="auto" label="50%" />
        <ProgressMeter value={85} max={100} tone="auto" label="85%" />
        <ProgressMeter value={120} max={100} tone="auto" label="120% (overflow)" />
      </div>

      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Custom format</p>
        <ProgressMeter
          value={7}
          max={10}
          label="Tasks complete"
          format={(value, max) => `${value} of ${max} done`}
        />
      </div>
    </div>
  ),
  code: (v) => {
    const props = [
      ` value={${v.value}}`,
      ` max={${v.max}}`,
      v.size !== 'md' ? ` size="${v.size}"` : '',
      v.tone !== 'auto' ? ` tone="${v.tone}"` : '',
      v.label ? ` label="${v.label}"` : '',
      !v.showValue ? ' showValue={false}' : '',
    ].join('');
    return `import { ProgressMeter } from '@dinesh-gamage/uikit/progress-meter';

<ProgressMeter${props} />`;
  },
};

export default function ProgressMeterDemo() {
  return <DemoPage demo={demo} />;
}
