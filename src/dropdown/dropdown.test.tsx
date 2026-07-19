import { useRef, useState } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Dropdown } from './Dropdown';
import { Modal } from '../modal';

beforeEach(() => {
  // jsdom's requestAnimationFrame is backed by setTimeout; run it synchronously so the
  // measure-then-position two-phase render settles immediately for these tests.
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
  vi.stubGlobal('cancelAnimationFrame', () => {});
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function Picker({ label, panelText = 'panel' }: { label: string; panelText?: string }) {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  return (
    <div>
      <button ref={anchorRef} type="button" onClick={() => setOpen(true)}>
        {label}
      </button>
      <Dropdown open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
        <div>{panelText}</div>
      </Dropdown>
    </div>
  );
}

describe('Dropdown exclusivity', () => {
  it('closes an already-open popover when another one opens', () => {
    render(
      <>
        <Picker label="Field A" panelText="panel-a" />
        <Picker label="Field B" panelText="panel-b" />
      </>,
    );

    fireEvent.click(screen.getByText('Field A'));
    expect(screen.getByText('panel-a')).toBeTruthy();

    fireEvent.click(screen.getByText('Field B'));
    expect(screen.queryByText('panel-a')).toBeNull();
    expect(screen.getByText('panel-b')).toBeTruthy();
  });
});

describe('Dropdown Escape handling', () => {
  it('closes only the popover and does not let Escape reach an ancestor bubble-phase listener', () => {
    const ancestorHandler = vi.fn();
    render(
      <div onKeyDown={ancestorHandler}>
        <Picker label="Field A" />
      </div>,
    );

    fireEvent.click(screen.getByText('Field A'));
    expect(screen.getByText('panel')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('panel')).toBeNull();
    expect(ancestorHandler).not.toHaveBeenCalled();
  });

  it('does not intercept Escape when no popover is open (Modal still closes normally)', () => {
    const onClose = vi.fn();
    render(<Modal open onClose={onClose}>body</Modal>);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('lets a picker inside a Modal close on Escape without closing the Modal, then a second Escape closes the Modal', () => {
    const onModalClose = vi.fn();

    function Harness() {
      return (
        <Modal open onClose={onModalClose}>
          <Picker label="Date field" />
        </Modal>
      );
    }

    render(<Harness />);
    fireEvent.click(screen.getByText('Date field'));
    expect(screen.getByText('panel')).toBeTruthy();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('panel')).toBeNull();
    expect(onModalClose).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onModalClose).toHaveBeenCalledTimes(1);
  });
});

describe('Dropdown outside interaction', () => {
  it('closes on mousedown outside the anchor/panel', () => {
    render(<Picker label="Field A" />);
    fireEvent.click(screen.getByText('Field A'));
    expect(screen.getByText('panel')).toBeTruthy();

    fireEvent.mouseDown(document.body);
    expect(screen.queryByText('panel')).toBeNull();
  });

  it('closes when focus moves outside the anchor/panel (blur to elsewhere)', () => {
    render(
      <>
        <Picker label="Field A" />
        <input aria-label="elsewhere" />
      </>,
    );
    fireEvent.click(screen.getByText('Field A'));
    expect(screen.getByText('panel')).toBeTruthy();

    fireEvent.focusIn(screen.getByLabelText('elsewhere'));
    expect(screen.queryByText('panel')).toBeNull();
  });

  it('does not close when focus moves inside the panel', () => {
    function PickerWithFocusablePanel() {
      const [open, setOpen] = useState(false);
      const anchorRef = useRef<HTMLButtonElement>(null);
      return (
        <div>
          <button ref={anchorRef} type="button" onClick={() => setOpen(true)}>
            Field A
          </button>
          <Dropdown open={open} onClose={() => setOpen(false)} anchorRef={anchorRef}>
            <button type="button">inside panel</button>
          </Dropdown>
        </div>
      );
    }

    render(<PickerWithFocusablePanel />);
    fireEvent.click(screen.getByText('Field A'));
    fireEvent.focusIn(screen.getByText('inside panel'));
    expect(screen.getByText('inside panel')).toBeTruthy();
  });
});
