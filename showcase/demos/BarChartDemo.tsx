import { BarChart, type BarChartDatum } from '../../src/bar-chart';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import './chart-demo-widgets.scss';

const revenueData: BarChartDatum[] = [
  { label: 'Q1', values: [42000, 28500, 15200] },
  { label: 'Q2', values: [51200, 31400, 19800] },
  { label: 'Q3', values: [47300, 35900, 21600] },
  { label: 'Q4', values: [58900, 39200, 24100] },
];
const teamSeries = ['Product', 'Design', 'Marketing'];

const demo: DemoDef = {
  title: 'Bar Chart',
  description:
    'Grouped or stacked bars with gridlines, a value axis, and per-series hover readouts. Handles negative values (bars extend from the zero baseline), missing/NaN values, and empty data without crashing.',
  controls: [{ type: 'boolean', name: 'stacked', defaultValue: false }],
  render: (v) => (
    <div className="sc-chart-demo sc-chart-demo--wide">
      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Quarterly revenue by team</p>
        <BarChart data={revenueData} series={teamSeries} stacked={!!v.stacked} height={240} />
      </div>

      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Empty data</p>
        <BarChart data={[]} height={160} />
      </div>
    </div>
  ),
  code: (v) => `import { BarChart } from '@dinesh-gamage/uikit/bar-chart';

const data = [
  { label: 'Q1', values: [42000, 28500, 15200] },
  { label: 'Q2', values: [51200, 31400, 19800] },
  { label: 'Q3', values: [47300, 35900, 21600] },
  { label: 'Q4', values: [58900, 39200, 24100] },
];

<BarChart
  data={data}
  series={['Product', 'Design', 'Marketing']}${v.stacked ? '\n  stacked' : ''}
/>`,
};

export default function BarChartDemo() {
  return <DemoPage demo={demo} />;
}
