import { useState } from 'react';
import { faTrash, faPen, faStar, faCloudArrowUp } from '@fortawesome/free-solid-svg-icons';
import { IconButton, type IconButtonProps } from '../../src/icon-button';
import { Icon } from '../../src/icon';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import './demo-widgets.scss';

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function Stage({ v }: { v: ControlValues }) {
  const [starred, setStarred] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const shared = {
    tone: v.tone as IconButtonProps['tone'],
    size: v.size as IconButtonProps['size'],
    disabled: !!v.disabled,
    active: !!v.active,
  };

  return (
    <div className="sc-demo-widgets">
      <div className="sc-demo-widgets__buttons">
        <IconButton {...shared} icon={<Icon icon={faPen} />} label="Edit" onClick={() => setResult('Edit clicked')} />
        <IconButton
          {...shared}
          tone="danger"
          icon={<Icon icon={faTrash} />}
          label="Delete"
          onClick={() => setResult('Delete clicked')}
        />
        <IconButton
          {...shared}
          tone="primary"
          icon={<Icon icon={faStar} />}
          label={starred ? 'Unstar' : 'Star'}
          active={starred}
          onClick={() => setStarred((s) => !s)}
        />
        <IconButton
          {...shared}
          icon={<Icon icon={faCloudArrowUp} />}
          label="Upload (async)"
          onClick={async () => {
            setResult('Uploading…');
            await delay(1200);
            setResult('Upload complete');
          }}
        />
      </div>
      {result && <div className="sc-demo-widgets__result">{result}</div>}
    </div>
  );
}

const demo: DemoDef = {
  title: 'Icon Button',
  description:
    'Square, icon-only action button. Promise-aware onClick shows a Spinner and blocks double-clicks while pending (try Upload). `label` is required — it becomes the aria-label and, by default, a Tooltip (hover or focus any button here to see it in action).',
  controls: [
    { type: 'select', name: 'tone', options: ['neutral', 'primary', 'danger'], defaultValue: 'neutral' },
    { type: 'select', name: 'size', options: ['sm', 'md'], defaultValue: 'md' },
    { type: 'boolean', name: 'disabled', defaultValue: false },
    { type: 'boolean', name: 'active', defaultValue: false },
  ],
  render: (v) => <Stage v={v} />,
  code: (v) => {
    const props = [
      v.tone !== 'neutral' ? ` tone="${v.tone}"` : '',
      v.size !== 'md' ? ` size="${v.size}"` : '',
      v.disabled ? ' disabled' : '',
      v.active ? ' active' : '',
    ].join('');
    return `import { IconButton } from '@dinesh-gamage/uikit/icon-button';
import { Icon } from '@dinesh-gamage/uikit/icon';
import { faPen } from '@fortawesome/free-solid-svg-icons';

<IconButton${props} icon={<Icon icon={faPen} />} label="Edit" onClick={() => {}} />`;
  },
};

export default function IconButtonDemo() {
  return <DemoPage demo={demo} />;
}
