import { useState } from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Modal } from './Modal';

afterEach(() => {
  cleanup();
  document.documentElement.style.overflow = '';
});

describe('Modal', () => {
  it('renders nothing when closed, and portals to document.body when open', () => {
    const { rerender } = render(
      <Modal open={false} onClose={vi.fn()} title="Hello">
        body
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();

    rerender(
      <Modal open onClose={vi.fn()}>
        body
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    expect(dialog.closest('body')).toBe(document.body);
    expect(screen.getByText('body')).toBeTruthy();
  });

  it('calls onClose on Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        body
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes on backdrop click but not on panel click', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <button type="button">inside</button>
      </Modal>,
    );

    fireEvent.mouseDown(screen.getByText('inside'));
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.mouseDown(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on backdrop click when closeOnBackdrop is false', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} closeOnBackdrop={false}>
        body
      </Modal>,
    );
    fireEvent.mouseDown(screen.getByRole('dialog').parentElement as HTMLElement);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('locks body scroll while open and restores it on close, with nested-modal counting', () => {
    function Harness() {
      const [outerOpen, setOuterOpen] = useState(true);
      const [innerOpen, setInnerOpen] = useState(true);
      return (
        <>
          <Modal open={outerOpen} onClose={() => setOuterOpen(false)}>
            <Modal open={innerOpen} onClose={() => setInnerOpen(false)}>
              inner
            </Modal>
          </Modal>
        </>
      );
    }
    const { rerender } = render(<Harness />);
    expect(document.documentElement.style.overflow).toBe('hidden');

    // Simulate closing just the inner modal — outer is still open, so the lock must remain.
    rerender(
      <Modal open onClose={vi.fn()}>
        <Modal open={false} onClose={vi.fn()}>
          inner
        </Modal>
      </Modal>,
    );
    expect(document.documentElement.style.overflow).toBe('hidden');

    cleanup();
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('focuses the panel on open and returns focus to the trigger on close', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            trigger
          </button>
          <Modal open={open} onClose={() => setOpen(false)}>
            body
          </Modal>
        </>
      );
    }
    render(<Harness />);
    const trigger = screen.getByText('trigger');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    const dialog = screen.getByRole('dialog');
    // The close button is the panel's first focusable descendant, so it receives focus.
    expect(dialog.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(trigger);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.activeElement).toBe(trigger);
  });
});
