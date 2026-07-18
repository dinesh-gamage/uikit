import { faHeart, faRocket, faUser, faGear, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { Icon } from '../../src/icon';
import { DemoPage, type DemoDef } from '../framework/DemoPage';

const ICONS = { heart: faHeart, rocket: faRocket, user: faUser, gear: faGear, check: faCircleCheck } as const;
const IMAGE =
  'data:image/svg+xml;base64,' +
  btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#4f6df5"/></svg>');

const demo: DemoDef = {
  title: 'Icon',
  description:
    'Renders a Font Awesome free icon (compiled into your bundle, tree-shaken per icon) or any image URL / data URL. SVG icons inherit currentColor.',
  controls: [
    { type: 'select', name: 'icon', options: [...Object.keys(ICONS), 'image-url'], defaultValue: 'rocket' },
    { type: 'number', name: 'size', defaultValue: 32, min: 8, max: 128 },
    { type: 'text', name: 'color', defaultValue: '#4f6df5' },
    { type: 'boolean', name: 'spin', defaultValue: false },
    { type: 'text', name: 'title', label: 'title (a11y)', defaultValue: '' },
  ],
  render: (v) => (
    <Icon
      icon={v.icon === 'image-url' ? IMAGE : ICONS[v.icon as keyof typeof ICONS]}
      size={v.size}
      color={v.color || undefined}
      spin={v.spin}
      title={v.title || undefined}
    />
  ),
  code: (v) => {
    const src = v.icon === 'image-url' ? `"https://example.com/logo.png"` : `fa${v.icon[0].toUpperCase()}${v.icon.slice(1)}`;
    const imp =
      v.icon === 'image-url'
        ? ''
        : `import { fa${v.icon[0].toUpperCase()}${v.icon.slice(1)} } from '@fortawesome/free-solid-svg-icons';\n`;
    return `${imp}import { Icon } from '@dinesh-gamage/uikit/icon';

<Icon icon={${src}} size={${v.size}}${v.color ? ` color="${v.color}"` : ''}${v.spin ? ' spin' : ''}${v.title ? ` title="${v.title}"` : ''} />`;
  },
};

export default function IconDemo() {
  return <DemoPage demo={demo} />;
}
