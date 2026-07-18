import { useState } from 'react';
import { FileInput } from '../../src/file-input';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';

const ACCEPT_PRESETS: Record<string, string[] | undefined> = {
  any: undefined,
  'images only': ['image/*'],
};

function Preview({ v }: { v: ControlValues }) {
  const [value, setValue] = useState<File | File[] | null>(null);
  return (
    <FileInput
      label="Attachments"
      hint="Max 5 MB per file"
      mode={v.mode as 'compact' | 'expanded'}
      multiple={v.multiple}
      showPreview={v.showPreview}
      accept={ACCEPT_PRESETS[v.accept as string]}
      maxSize={5 * 1024 * 1024}
      disabled={v.disabled}
      value={value}
      onChange={(next, isValid) => {
        if (isValid) setValue(next);
      }}
    />
  );
}

const demo: DemoDef = {
  title: 'File Input',
  description:
    'File picker with drag & drop, keyboard support, image previews, and accept/size validation. Compact mode renders a single control row.',
  controls: [
    { type: 'select', name: 'mode', options: ['expanded', 'compact'], defaultValue: 'expanded' },
    { type: 'boolean', name: 'multiple', defaultValue: false },
    { type: 'boolean', name: 'showPreview', defaultValue: true },
    { type: 'select', name: 'accept', options: ['any', 'images only'], defaultValue: 'any' },
    { type: 'boolean', name: 'disabled', defaultValue: false },
  ],
  render: (v) => <Preview v={v} />,
  code: (v) => {
    const props = [
      v.mode !== 'expanded' ? `mode="${v.mode}"` : '',
      v.multiple ? 'multiple' : '',
      !v.showPreview ? 'showPreview={false}' : '',
      v.accept === 'images only' ? `accept={['image/*']}` : '',
      v.disabled ? 'disabled' : '',
    ].filter(Boolean);
    return `import { useState } from 'react';
import { FileInput } from '@dinesh-gamage/uikit/file-input';

const [files, setFiles] = useState(null);

<FileInput
  label="Attachments"
  hint="Max 5 MB per file"
  maxSize={5 * 1024 * 1024}${props.length ? '\n  ' + props.join('\n  ') : ''}
  value={files}
  onChange={(next, isValid) => { if (isValid) setFiles(next); }}
/>`;
  },
};

export default function FileInputDemo() {
  return <DemoPage demo={demo} />;
}
