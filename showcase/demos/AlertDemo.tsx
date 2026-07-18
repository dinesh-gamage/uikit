import { useState } from 'react';
import { alert } from '../../src/alert';
import type { Tone } from '../../src/types';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import './demo-widgets.scss';

function Stage({ v }: { v: ControlValues }) {
  const [result, setResult] = useState<string | null>(null);

  const opts = {
    title: (v.title as string) || undefined,
    message: v.message as string,
    tone: v.tone as Tone,
  };

  return (
    <div className="sc-demo-widgets">
      <div className="sc-demo-widgets__buttons">
        <button
          className="sc-demo-widgets__button"
          onClick={async () => {
            setResult(null);
            const ok = await alert.confirm(opts);
            setResult(`alert.confirm resolved: ${ok}`);
          }}
        >
          Confirm…
        </button>
        <button
          className="sc-demo-widgets__button"
          onClick={async () => {
            setResult(null);
            await alert.show(opts);
            setResult('alert.show resolved');
          }}
        >
          Show…
        </button>
      </div>
      {result && <div className="sc-demo-widgets__result">{result}</div>}
    </div>
  );
}

const demo: DemoDef = {
  title: 'Alert',
  description:
    'Promise-based singleton dialogs — no provider required. Escape cancels, Enter confirms, the confirm button is auto-focused, and focus returns to the trigger on close. Concurrent calls queue.',
  controls: [
    {
      type: 'select',
      name: 'tone',
      options: ['primary', 'danger', 'neutral', 'success', 'warning', 'info'],
      defaultValue: 'primary',
    },
    { type: 'text', name: 'title', defaultValue: 'Delete project' },
    { type: 'text', name: 'message', defaultValue: 'This action cannot be undone.' },
  ],
  render: (v) => <Stage v={v} />,
  code: (v) => `import { alert } from '@dinesh-gamage/uikit/alert';

const ok = await alert.confirm({${v.title ? `\n  title: '${v.title}',` : ''}
  message: '${v.message}',${v.tone !== 'primary' ? `\n  tone: '${v.tone}',` : ''}
});

await alert.show('${v.message}');`,
};

export default function AlertDemo() {
  return <DemoPage demo={demo} />;
}
