import { Sparkline } from '../../src/sparkline';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import './chart-demo-widgets.scss';

const upTrend = [4, 6, 5, 8, 7, 10, 9, 13, 12, 16];
const downTrend = [16, 14, 15, 11, 12, 9, 10, 6, 7, 3];
const flat = [5, 5, 5, 5, 5, 5];
const single = [8];
const empty: number[] = [];

const demo: DemoDef = {
  title: 'Sparkline',
  description:
    'Inline SVG trend line with no axes or tooltip — a compact glance at a series. Handles flat series (centered line), a single point (a dot), and empty data (a faint placeholder) without crashing.',
  controls: [
    { type: 'select', name: 'variant', options: ['up', 'down'], defaultValue: 'up', label: 'trend' },
    { type: 'boolean', name: 'fill', defaultValue: false },
    { type: 'boolean', name: 'showLastPoint', label: 'show last point', defaultValue: true },
    { type: 'number', name: 'strokeWidth', defaultValue: 1.5, min: 0.5, max: 4 },
  ],
  render: (v) => (
    <div className="sc-chart-demo">
      <div className="sc-chart-demo__section">
        <Sparkline
          data={v.variant === 'up' ? upTrend : downTrend}
          fill={!!v.fill}
          showLastPoint={!!v.showLastPoint}
          strokeWidth={v.strokeWidth as number}
          width={240}
          height={56}
        />
      </div>

      <div className="sc-chart-demo__section">
        <p className="sc-chart-demo__section-title">Edge cases</p>
        <div className="sc-chart-demo__sparkline-grid">
          <div className="sc-chart-demo__sparkline-cell">
            <Sparkline data={upTrend} fill />
            <span className="sc-chart-demo__sparkline-caption">fill</span>
          </div>
          <div className="sc-chart-demo__sparkline-cell">
            <Sparkline data={downTrend} showLastPoint stroke="var(--uikit-chart-3)" />
            <span className="sc-chart-demo__sparkline-caption">last point + chart-3</span>
          </div>
          <div className="sc-chart-demo__sparkline-cell">
            <Sparkline data={flat} />
            <span className="sc-chart-demo__sparkline-caption">flat series</span>
          </div>
          <div className="sc-chart-demo__sparkline-cell">
            <Sparkline data={single} />
            <span className="sc-chart-demo__sparkline-caption">single point</span>
          </div>
          <div className="sc-chart-demo__sparkline-cell">
            <Sparkline data={empty} />
            <span className="sc-chart-demo__sparkline-caption">empty data</span>
          </div>
        </div>
      </div>
    </div>
  ),
  code: (v) => {
    const props = [
      v.fill ? ' fill' : '',
      v.showLastPoint ? ' showLastPoint' : '',
      v.strokeWidth !== 1.5 ? ` strokeWidth={${v.strokeWidth}}` : '',
    ].join('');
    return `import { Sparkline } from '@dinesh-gamage/uikit/sparkline';

<Sparkline data={[${(v.variant === 'up' ? upTrend : downTrend).join(', ')}]}${props} />`;
  },
};

export default function SparklineDemo() {
  return <DemoPage demo={demo} />;
}
