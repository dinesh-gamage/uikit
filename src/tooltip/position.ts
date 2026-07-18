/** Pure placement math for Tooltip. No DOM access — takes plain rects so it's trivially testable. */

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

const GAP = 6;
const MARGIN = 6;

function clamp(value: number, min: number, max: number): number {
  // `max` can be < `min` in a very small viewport; keep the bubble pinned to the min edge in that case.
  return Math.min(Math.max(value, min), Math.max(min, max));
}

/**
 * Computes fixed-position top/left for a tooltip bubble relative to its anchor, centered on the
 * cross axis, with a fixed gap on the primary axis and an 6px viewport-edge clamp.
 */
export function computeTooltipPlacement(anchor: Rect, bubble: Rect, viewport: Viewport, position: TooltipPosition): { top: number; left: number } {
  let top: number;
  let left: number;

  switch (position) {
    case 'bottom':
      top = anchor.top + anchor.height + GAP;
      left = anchor.left + anchor.width / 2 - bubble.width / 2;
      break;
    case 'left':
      top = anchor.top + anchor.height / 2 - bubble.height / 2;
      left = anchor.left - GAP - bubble.width;
      break;
    case 'right':
      top = anchor.top + anchor.height / 2 - bubble.height / 2;
      left = anchor.left + anchor.width + GAP;
      break;
    case 'top':
    default:
      top = anchor.top - GAP - bubble.height;
      left = anchor.left + anchor.width / 2 - bubble.width / 2;
      break;
  }

  top = clamp(top, MARGIN, viewport.height - bubble.height - MARGIN);
  left = clamp(left, MARGIN, viewport.width - bubble.width - MARGIN);

  return { top, left };
}
