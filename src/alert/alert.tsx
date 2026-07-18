import { enqueueDialog, type AlertOptions } from './store';
import { mountSingleton } from '../toast/mount';
import { AlertHost } from './AlertHost';

function ensureHost() {
  mountSingleton('uikit-alert-host', <AlertHost />);
}

/**
 * Promise-based singleton dialogs — no provider required.
 * One dialog shows at a time; further calls queue until the current one settles.
 *
 * ```ts
 * const ok = await alert.confirm({ title: 'Delete?', message: 'This cannot be undone.', tone: 'danger' });
 * await alert.show('Import finished.');
 * ```
 */
export const alert = {
  /** Confirm/cancel dialog. Resolves `true` on confirm, `false` on cancel/Escape/backdrop. */
  confirm(options: AlertOptions): Promise<boolean> {
    ensureHost();
    return new Promise<boolean>((resolve) => {
      enqueueDialog('confirm', options, resolve);
    });
  },

  /** Informational dialog with a single OK button. Resolves when closed. */
  show(options: AlertOptions): Promise<void> {
    ensureHost();
    return new Promise<void>((resolve) => {
      enqueueDialog('show', options, () => resolve());
    });
  },
};
