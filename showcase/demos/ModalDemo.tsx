import { useState } from 'react';
import { Modal, type ModalProps } from '../../src/modal';
import { Button } from '../../src/button';
import { Input } from '../../src/input';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';
import './demo-widgets.scss';

function Stage({ v }: { v: ControlValues }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const footer = v.withFooter ? (
    <>
      <Button variant="secondary" onClick={() => setOpen(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={() => setOpen(false)}>
        Save
      </Button>
    </>
  ) : undefined;

  return (
    <div className="sc-demo-widgets">
      <div className="sc-demo-widgets__buttons">
        <Button variant="primary" onClick={() => setOpen(true)}>
          Open modal
        </Button>
      </div>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={(v.title as string) || undefined}
        size={v.size as ModalProps['size']}
        closeOnBackdrop={!!v.closeOnBackdrop}
        footer={footer}
      >
        <div className="sc-demo-widgets__stack">
          <p>Tab through the fields below to see focus trapped visually inside the panel — it's the first thing focused on open, and focus returns to the "Open modal" button when this closes.</p>
          <Input label="Name" placeholder="Ada Lovelace" value={name} onChange={setName} />
          <Input label="Email" type="email" placeholder="ada@example.com" value={email} onChange={setEmail} />
        </div>
      </Modal>
    </div>
  );
}

const demo: DemoDef = {
  title: 'Modal',
  description:
    'Controlled dialog (not a singleton — mount one per usage, driven by `open`). Portaled to document.body, traps and restores focus, locks background scroll (nesting-aware), and closes on Escape or a backdrop click.',
  controls: [
    { type: 'select', name: 'size', options: ['sm', 'md', 'lg'], defaultValue: 'md' },
    { type: 'text', name: 'title', defaultValue: 'Edit profile' },
    { type: 'boolean', name: 'closeOnBackdrop', label: 'close on backdrop', defaultValue: true },
    { type: 'boolean', name: 'withFooter', label: 'with footer', defaultValue: true },
  ],
  render: (v) => <Stage v={v} />,
  code: (v) => {
    const props = [
      v.size !== 'md' ? ` size="${v.size}"` : '',
      v.title ? ` title="${v.title}"` : '',
      !v.closeOnBackdrop ? ' closeOnBackdrop={false}' : '',
    ].join('');
    return `import { useState } from 'react';
import { Modal } from '@dinesh-gamage/uikit/modal';

const [open, setOpen] = useState(false);

<Modal open={open} onClose={() => setOpen(false)}${props}${
      v.withFooter ? '\n  footer={<><Button onClick={close}>Cancel</Button><Button variant="primary">Save</Button></>}' : ''
    }>
  ...
</Modal>`;
  },
};

export default function ModalDemo() {
  return <DemoPage demo={demo} />;
}
