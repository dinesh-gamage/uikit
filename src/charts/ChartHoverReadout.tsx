import type { ReactNode } from 'react';
import './chart-shared.scss';

export interface ChartHoverReadoutProps {
  /**
   * Horizontal position as a percentage (0-100) of the stage wrapper's
   * width. Percentage rather than a pixel offset so the readout stays
   * correctly positioned as a responsive (`width: 100%`) chart SVG
   * scales with its container, without needing to measure layout on
   * every hover.
   */
  x: number;
  /** Vertical position in pixels from the top of the stage wrapper (charts render at a fixed height, so this is exact). */
  y: number;
  children: ReactNode;
}

/**
 * Small floating readout, absolutely positioned at `{ left: x, top: y }`
 * inside a `position: relative` "stage" wrapper that each chart provides
 * around its `<svg>`.
 *
 * Why this exists instead of reusing `src/tooltip/Tooltip.tsx`:
 * `Tooltip` is built around a single static DOM anchor -- measured once
 * via `getBoundingClientRect`, portaled to `document.body`, shown/hidden
 * on a hover delay. Chart hover needs something structurally different:
 * the mouse moves continuously across many sibling SVG shapes (bars,
 * line points, donut arc segments) that all live inside one `<svg>`, and
 * the readout's content must update per hovered/nearest shape on every
 * `mousemove`/`mouseenter` -- there's no single anchor to measure, and a
 * show/hide delay would just make the readout laggy while scrubbing
 * across a chart. A lightweight, built-in, absolutely-positioned readout
 * driven directly by chart-local mouse-position/hover-index state is
 * simpler and more correct for this access pattern, so charts render
 * their own instead of wrapping Tooltip.
 */
export function ChartHoverReadout({ x, y, children }: ChartHoverReadoutProps) {
  return (
    <div className="uikit-chart-hover" style={{ left: `${x}%`, top: y }}>
      {children}
    </div>
  );
}
