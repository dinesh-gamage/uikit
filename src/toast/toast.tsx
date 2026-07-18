import { addToast, configureToasts, dismissToast, type ToastConfig, type ToastInput, type ToastTone } from './store';
import { mountSingleton } from './mount';
import { ToastHost } from './ToastHost';

function fire(tone: ToastTone, input: ToastInput): string {
  mountSingleton('uikit-toast-host', <ToastHost />);
  return addToast(tone, input);
}

/**
 * Singleton toast API — no provider required.
 *
 * ```ts
 * toast.success('Saved');
 * const id = toast.error({ title: 'Failed', message: 'Try again', duration: 8000 });
 * toast.dismiss(id);
 * toast.configure({ position: 'top-right', duration: 4000 });
 * ```
 */
export const toast = {
  success: (input: ToastInput) => fire('success', input),
  error: (input: ToastInput) => fire('error', input),
  warning: (input: ToastInput) => fire('warning', input),
  info: (input: ToastInput) => fire('info', input),
  dismiss: (id: string) => dismissToast(id),
  configure: (opts: Partial<ToastConfig>) => configureToasts(opts),
};
