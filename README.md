# @dinesh-gamage/uikit

A clean, compact, themeable React component library. Every component is tree-shakeable, individually importable, and styled entirely through CSS custom properties for effortless light/dark theming.

## Install

```bash
npm i @dinesh-gamage/uikit
```

React 18 or 19 is a peer dependency. Font Awesome icons are optional — install `@fortawesome/free-solid-svg-icons` (or regular/brands) only if you use them with `Icon`.

## Usage

```tsx
// Whole library
import { Input, Select, toast } from '@dinesh-gamage/uikit';

// Or a single component (best for tree shaking / code splitting)
import { Input } from '@dinesh-gamage/uikit/input';
import { DatePicker } from '@dinesh-gamage/uikit/datetime';
```

Styles are injected automatically with each component import — no separate CSS import needed.

## Components

| Group | Components |
|---|---|
| Display | `Icon` (Font Awesome SVG defs or any image/data URL) |
| Inputs | `Input` (text/password/email/number, prefix/suffix), `Checkbox` (checkbox + switch), `RadioGroup`, `DatalistInput`, `FileInput` (compact/expanded + preview) |
| Pickers | `Select`, `MultiSelect` (async options, pills, custom rendering), `DatePicker`, `DateTimePicker`, `DateRangePicker` (presets), `TimeRangePicker` |
| Forms | `DynamicForm` (JSON schema, sections/sub-sections, validators, custom fields), `Field` |
| Data | `ListView` (search, tabs, toolbar, breadcrumb, details panel, paged/infinite loading), `InfoCard` |
| Charts | `BarChart` (grouped/stacked), `LineChart` (multi-series, area fill), `DonutChart`, `ProgressMeter`, `Sparkline` |
| Feedback | `toast` (singleton), `alert` (promise-based confirm/show), `Spinner`, `Skeleton`, `NotificationBlock` |

## Theming

All visuals derive from `--uikit-*` CSS variables. Override any of them in your app, or flip dark mode with:

```html
<html data-theme="dark">
```

See `src/styles/tokens.css` for the full token list.

## Development

```bash
npm run dev        # showcase app at http://localhost:5199
npm run test       # vitest
npm run typecheck  # tsc --noEmit
npm run build      # library build to dist/
```

The showcase (`showcase/`) is a dev-only playground with live prop controls and copyable code for every component. It is not part of the published package.

## License

MIT
