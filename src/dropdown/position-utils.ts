/** Pure placement math for Dropdown. No DOM access — takes plain rects so it's trivially testable. */

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

export type DropdownPosition =
  | 'bottom-start'
  | 'bottom'
  | 'bottom-end'
  | 'top-start'
  | 'top'
  | 'top-end'
  | 'right-start'
  | 'left-start';

export interface Placement {
  top: number;
  left: number;
  /** Set only when neither side has room for the panel's natural height and it had to be clamped. */
  maxHeight?: number;
  /** True when the panel was flipped to the opposite side of its requested position. */
  flipped: boolean;
}

const EDGE = 8;
const MIN_SPACE = 120;

function clamp(value: number, min: number, max: number): number {
  // `max` can be < `min` in a very small viewport; keep the panel pinned to the min edge in that case.
  return Math.min(Math.max(value, min), Math.max(min, max));
}

function horizontalAlign(position: DropdownPosition, anchor: Rect, panelWidth: number): number {
  switch (position) {
    case 'bottom-end':
    case 'top-end':
      return anchor.left + anchor.width - panelWidth;
    case 'bottom':
    case 'top':
      return anchor.left + anchor.width / 2 - panelWidth / 2;
    default:
      return anchor.left;
  }
}

function computeVerticalPlacement(anchor: Rect, panel: Rect, viewport: Viewport, position: DropdownPosition, gap: number): Placement {
  const requestedTop = position.startsWith('top');
  const spaceBelow = viewport.height - (anchor.top + anchor.height) - gap;
  const spaceAbove = anchor.top - gap;
  const fits = (space: number) => space >= panel.height;

  let placeAbove: boolean;
  let flipped = false;
  let maxHeight: number | undefined;

  if (!requestedTop) {
    if (fits(spaceBelow)) {
      placeAbove = false;
    } else if (fits(spaceAbove)) {
      placeAbove = true;
      flipped = true;
    } else {
      placeAbove = spaceAbove > spaceBelow;
      flipped = placeAbove;
      maxHeight = Math.max(placeAbove ? spaceAbove : spaceBelow, MIN_SPACE);
    }
  } else {
    if (fits(spaceAbove)) {
      placeAbove = true;
    } else if (fits(spaceBelow)) {
      placeAbove = false;
      flipped = true;
    } else {
      placeAbove = spaceAbove >= spaceBelow;
      flipped = !placeAbove;
      maxHeight = Math.max(placeAbove ? spaceAbove : spaceBelow, MIN_SPACE);
    }
  }

  const panelHeight = maxHeight != null ? Math.min(panel.height, maxHeight) : panel.height;
  const top = placeAbove ? anchor.top - gap - panelHeight : anchor.top + anchor.height + gap;
  const left = clamp(horizontalAlign(position, anchor, panel.width), EDGE, viewport.width - panel.width - EDGE);

  return { top, left, maxHeight, flipped };
}

function computeSidePlacement(anchor: Rect, panel: Rect, viewport: Viewport, position: DropdownPosition, gap: number): Placement {
  const requestedLeft = position === 'left-start';
  const spaceRight = viewport.width - (anchor.left + anchor.width) - gap;
  const spaceLeft = anchor.left - gap;
  const fits = (space: number) => space >= panel.width;

  let placeLeft: boolean;
  let flipped = false;

  if (!requestedLeft) {
    if (fits(spaceRight)) {
      placeLeft = false;
    } else if (fits(spaceLeft)) {
      placeLeft = true;
      flipped = true;
    } else {
      placeLeft = spaceLeft > spaceRight;
      flipped = placeLeft;
    }
  } else {
    if (fits(spaceLeft)) {
      placeLeft = true;
    } else if (fits(spaceRight)) {
      placeLeft = false;
      flipped = true;
    } else {
      placeLeft = spaceLeft >= spaceRight;
      flipped = !placeLeft;
    }
  }

  const left = placeLeft ? anchor.left - gap - panel.width : anchor.left + anchor.width + gap;
  const top = clamp(anchor.top, EDGE, viewport.height - panel.height - EDGE);

  return { top, left, maxHeight: undefined, flipped };
}

/**
 * Computes fixed-position top/left (and, when space is tight, a clamped maxHeight) for a
 * dropdown panel relative to its anchor. Overflow correction order: (1) flip to the opposite
 * side on the primary axis when the requested side doesn't have room but the opposite does; if
 * neither does, keep whichever side has more room and clamp maxHeight to it (min 120px). (2)
 * clamp the cross axis so the panel stays inside the viewport with an 8px margin.
 */
export function computePlacement(anchor: Rect, panel: Rect, viewport: Viewport, position: DropdownPosition, gap = EDGE): Placement {
  if (position === 'right-start' || position === 'left-start') {
    return computeSidePlacement(anchor, panel, viewport, position, gap);
  }
  return computeVerticalPlacement(anchor, panel, viewport, position, gap);
}
