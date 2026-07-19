import { DonutChart, type DonutChartDatum } from '../../src/donut-chart';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import './chart-demo-widgets.scss';

const budgetData: DonutChartDatum[] = [
  { label: 'Engineering', value: 45000 },
  { label: 'Marketing', value: 22000 },
  { label: 'Sales', value: 18000 },
  { label: 'Operations', value: 9000 },
];

const zeroData: DonutChartDatum[] = [
  { label: 'Engineering', value: 0 },
  { label: 'Marketing', value: 0 },
  { label: 'Sales', value: 0 },
];

const demo: DemoDef = {
  title: 'Donut Chart',
  description:
    'Ring chart drawn with stroke-dasharray/stroke-dashoffset (no hand-rolled arc-path math). Zero, negative, and NaN values are filtered out before anything is drawn -- an all-zero dataset renders the shared empty state instead of a broken ring.',
  controls: [],
  render: () => (
    <div className="sc-chart-demo sc-chart-demo--wide">
      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Budget allocation</p>
        <DonutChart data={budgetData} />
      </div>

      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">All-zero data (filtered to empty)</p>
        <DonutChart data={zeroData} size={140} />
      </div>
    </div>
  ),
  code: () => `import { DonutChart } from '@dinesh-gamage/uikit/donut-chart';

const data = [
  { label: 'Engineering', value: 45000 },
  { label: 'Marketing', value: 22000 },
  { label: 'Sales', value: 18000 },
  { label: 'Operations', value: 9000 },
];

<DonutChart data={data} />`,
};

export default function DonutChartDemo() {
  return <DemoPage demo={demo} />;
}
