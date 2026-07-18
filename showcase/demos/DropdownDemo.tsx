import { useRef, useState } from 'react';
import { Dropdown, DropdownIndicator, type DropdownPosition } from '../../src/dropdown';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import type { ControlValues } from '../framework/controls';

const POSITIONS: DropdownPosition[] = [
  'bottom-start', 'bottom', 'bottom-end', 'top-start', 'top', 'top-end', 'right-start', 'left-start',
];

function Stage({ v }: { v: ControlValues }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="sc-dropdown-scroll">
      <div className="sc-dropdown-scroll__spacer">scroll ↓ — panel stays attached to its trigger</div>
      <button ref={anchorRef} className="sc-dropdown-trigger" onClick={() => setOpen((o) => !o)}>
        Open dropdown <DropdownIndicator open={open} />
      </button>
      <Dropdown
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        position={v.position}
        matchTriggerWidth={v.matchTriggerWidth}
        maxHeight={v.maxHeight}
      >
        <div className="sc-dropdown-panel">
          {['Profile', 'Settings', 'Billing', 'Integrations', 'Keyboard shortcuts', 'Help & support', 'Sign out'].map(
            (item) => (
              <button key={item} className="sc-dropdown-panel__item" onClick={() => setOpen(false)}>
                {item}
              </button>
            ),
          )}
        </div>
      </Dropdown>
      <div className="sc-dropdown-scroll__spacer">↑ scroll</div>
    </div>
  );
}

const demo: DemoDef = {
  title: 'Dropdown',
  description:
    'The anchored floating-panel primitive behind every select and picker. Measures the panel invisibly first, then places it with an 8px gap — flipping to the other side when out of viewport space, clamping height to what fits, and repositioning live on scroll, resize, and content growth.',
  controls: [
    { type: 'select', name: 'position', options: POSITIONS, defaultValue: 'bottom-start' },
    { type: 'boolean', name: 'matchTriggerWidth', defaultValue: false },
    { type: 'number', name: 'maxHeight', defaultValue: 320, min: 120, max: 600 },
  ],
  render: (v) => <Stage v={v} />,
  code: (v) => `import { useRef, useState } from 'react';
import { Dropdown, DropdownIndicator } from '@dinesh-gamage/uikit/dropdown';

const anchorRef = useRef<HTMLButtonElement>(null);
const [open, setOpen] = useState(false);

<button ref={anchorRef} onClick={() => setOpen(o => !o)}>
  Open dropdown <DropdownIndicator open={open} />
</button>
<Dropdown
  open={open}
  onClose={() => setOpen(false)}
  anchorRef={anchorRef}
  position="${v.position}"${v.matchTriggerWidth ? '\n  matchTriggerWidth' : ''}${v.maxHeight !== 320 ? `\n  maxHeight={${v.maxHeight}}` : ''}
>
  <MenuItems />
</Dropdown>`,
};

export default function DropdownDemo() {
  return <DemoPage demo={demo} />;
}
