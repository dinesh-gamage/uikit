import { LineChart, type LineChartSeries } from '../../src/line-chart';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import './chart-demo-widgets.scss';

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];

const trafficSeries: LineChartSeries[] = [
  { name: 'Organic', points: months.map((m, i) => ({ x: m, y: 1200 + i * 180 + (i % 3 === 0 ? 220 : 0) })) },
  { name: 'Paid', points: months.map((m, i) => ({ x: m, y: 900 - i * 40 + (i % 2 === 0 ? 90 : -30) })) },
  { name: 'Referral', points: months.map((m, i) => ({ x: m, y: 320 + i * 25 })) },
];

const signupsSeries: LineChartSeries[] = [
  { name: 'Signups', points: months.map((m, i) => ({ x: m, y: 60 + i * 22 + (i === 4 ? 80 : 0) })) },
];

const demo: DemoDef = {
  title: 'Line Chart',
  description:
    'Multi-series ordinal line chart with a shared y-scale, nearest-point hover, and an optional area fill for single-series charts. Points are evenly spaced by index; series of differing lengths simply stop early rather than crashing.',
  controls: [{ type: 'boolean', name: 'fill', label: 'fill (single series)', defaultValue: true }],
  render: (v) => (
    <div className="sc-chart-demo sc-chart-demo--wide">
      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Traffic by channel (multi-series)</p>
        <LineChart series={trafficSeries} height={220} />
      </div>

      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Signups (single series, fill)</p>
        <LineChart series={signupsSeries} height={180} fill={!!v.fill} />
      </div>

      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Empty data</p>
        <LineChart series={[]} height={140} />
      </div>
    </div>
  ),
  code: (v) => `import { LineChart } from '@dinesh-gamage/uikit/line-chart';

const series = [
  { name: 'Signups', points: [{ x: 'Jan', y: 60 }, { x: 'Feb', y: 82 }, { x: 'Mar', y: 104 }] },
];

<LineChart series={series}${v.fill ? '\n  fill' : ''} />`,
};

export default function LineChartDemo() {
  return <DemoPage demo={demo} />;
}
