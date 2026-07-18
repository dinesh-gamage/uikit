import { toast, type ToastPosition, type ToastTone } from '../../src/toast';
import { DemoPage, type DemoDef } from '../framework/DemoPage';
import './demo-widgets.scss';

const TONES: ToastTone[] = ['success', 'error', 'warning', 'info'];

const MESSAGES: Record<ToastTone, string> = {
  success: 'Changes saved successfully.',
  error: 'Something went wrong. Please try again.',
  warning: 'Storage is almost full.',
  info: 'A new version is available.',
};

const demo: DemoDef = {
  title: 'Toast',
  description:
    'Singleton toast notifications — import toast and call it from anywhere, no provider required. Auto-dismisses (pauses on hover), stacks in a configurable corner.',
  controls: [
    {
      type: 'select',
      name: 'position',
      options: ['bottom-right', 'bottom-left', 'top-right', 'top-left'],
      defaultValue: 'bottom-right',
    },
    { type: 'select', name: 'tone', options: TONES, defaultValue: 'success' },
    { type: 'text', name: 'title', defaultValue: '' },
    { type: 'number', name: 'duration', label: 'duration (ms)', defaultValue: 5000, min: 500, max: 30000 },
  ],
  render: (v) => {
    const fire = (tone: ToastTone) => {
      toast.configure({ position: v.position as ToastPosition });
      toast[tone]({
        title: (v.title as string) || undefined,
        message: MESSAGES[tone],
        duration: v.duration as number,
      });
    };
    return (
      <div className="sc-demo-widgets">
        <div className="sc-demo-widgets__buttons">
          <button className="sc-demo-widgets__button" onClick={() => fire(v.tone as ToastTone)}>
            Show {v.tone} toast
          </button>
          <button className="sc-demo-widgets__button" onClick={() => TONES.forEach(fire)}>
            Show all four
          </button>
        </div>
      </div>
    );
  },
  code: (v) => {
    const configure =
      v.position !== 'bottom-right' ? `toast.configure({ position: '${v.position}' });\n\n` : '';
    const simple = !v.title && v.duration === 5000;
    const call = simple
      ? `toast.${v.tone}('${MESSAGES[v.tone as ToastTone]}');`
      : `toast.${v.tone}({${v.title ? `\n  title: '${v.title}',` : ''}\n  message: '${MESSAGES[v.tone as ToastTone]}',${
          v.duration !== 5000 ? `\n  duration: ${v.duration},` : ''
        }\n});`;
    return `import { toast } from '@dinesh-gamage/uikit/toast';

${configure}${call}`;
  },
};

export default function ToastDemo() {
  return <DemoPage demo={demo} />;
}
