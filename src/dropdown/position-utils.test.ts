import { describe, expect, it } from 'vitest';
import { computePlacement, type Rect, type Viewport } from './position-utils';

const viewport: Viewport = { width: 1024, height: 768 };

const anchor = (over: Partial<Rect> = {}): Rect => ({ top: 100, left: 100, width: 120, height: 32, ...over });
const panel = (over: Partial<Rect> = {}): Rect => ({ top: 0, left: 0, width: 200, height: 240, ...over });

describe('computePlacement', () => {
  it('places bottom-start below and left-aligned to the anchor, with the 8px gap', () => {
    const p = computePlacement(anchor(), panel(), viewport, 'bottom-start', 8);
    expect(p.top).toBe(100 + 32 + 8);
    expect(p.left).toBe(100);
    expect(p.flipped).toBe(false);
    expect(p.maxHeight).toBeUndefined();
  });

  it('flips to top when there is no room below but room above', () => {
    const lowAnchor = anchor({ top: 700, height: 32 }); // spaceBelow = 768 - 732 - 8 = 28, way less than panel height 240
    const p = computePlacement(lowAnchor, panel(), viewport, 'bottom-start', 8);
    expect(p.flipped).toBe(true);
    expect(p.top).toBe(700 - 8 - 240);
    expect(p.maxHeight).toBeUndefined();
  });

  it('flips top-start to bottom when there is no room above but room below', () => {
    const highAnchor = anchor({ top: 20, height: 32 }); // spaceAbove = 20 - 8 = 12, way less than panel height 240
    const p = computePlacement(highAnchor, panel(), viewport, 'top-start', 8);
    expect(p.flipped).toBe(true);
    expect(p.top).toBe(20 + 32 + 8);
  });

  it('keeps the larger side and clamps maxHeight (min 120) when neither side has room', () => {
    // Viewport short enough that neither above nor below fits a 240px panel.
    const shortViewport: Viewport = { width: 1024, height: 200 };
    const midAnchor = anchor({ top: 100, height: 20 }); // spaceAbove = 92, spaceBelow = 200-120-8=72
    const p = computePlacement(midAnchor, panel(), shortViewport, 'bottom-start', 8);
    // spaceAbove (92) > spaceBelow (72) -> keeps above, flips, clamps to max(92, 120) = 120
    expect(p.flipped).toBe(true);
    expect(p.maxHeight).toBe(120);
    expect(p.top).toBe(100 - 8 - 120);
  });

  it('clamps maxHeight to available space directly when that space already exceeds the 120px floor', () => {
    const shortViewport: Viewport = { width: 1024, height: 400 };
    // anchor near vertical middle so both sides are short of 240 but above 120
    const midAnchor = anchor({ top: 200, height: 20 }); // spaceAbove = 192, spaceBelow = 400-220-8=172
    const p = computePlacement(midAnchor, panel(), shortViewport, 'bottom-start', 8);
    expect(p.flipped).toBe(true); // spaceAbove(192) > spaceBelow(172)
    expect(p.maxHeight).toBe(192);
  });

  it('clamps left so the panel never crosses the left viewport edge', () => {
    const leftAnchor = anchor({ left: -50, width: 40 });
    const p = computePlacement(leftAnchor, panel(), viewport, 'bottom-start', 8);
    expect(p.left).toBe(8);
  });

  it('clamps left so the panel never crosses the right viewport edge', () => {
    const rightAnchor = anchor({ left: 1000, width: 40 });
    const p = computePlacement(rightAnchor, panel(), viewport, 'bottom-end', 8);
    // bottom-end aligns panel right edge to anchor right edge: left = anchor.left + anchor.width - panel.width
    // = 1000 + 40 - 200 = 840, well within viewport so no clamp needed; push anchor further right instead
    expect(p.left).toBeLessThanOrEqual(viewport.width - panel().width - 8);

    const farRightAnchor = anchor({ left: 2000, width: 40 });
    const p2 = computePlacement(farRightAnchor, panel(), viewport, 'bottom-start', 8);
    expect(p2.left).toBe(viewport.width - panel().width - 8);
  });

  it('centers a "bottom" position on the anchor', () => {
    const p = computePlacement(anchor(), panel(), viewport, 'bottom', 8);
    expect(p.left).toBe(100 + 120 / 2 - 200 / 2);
  });

  it('aligns "bottom-end" so the panel right edge matches the anchor right edge', () => {
    const p = computePlacement(anchor(), panel(), viewport, 'bottom-end', 8);
    expect(p.left).toBe(100 + 120 - 200);
  });

  it('supports matchTriggerWidth by simply accepting a panel width equal to the anchor width', () => {
    const wideAnchor = anchor({ width: 300 });
    const matchedPanel = panel({ width: 300 });
    const p = computePlacement(wideAnchor, matchedPanel, viewport, 'bottom-start', 8);
    expect(p.left).toBe(wideAnchor.left);
  });

  it('places right-start to the right of the anchor, top-aligned', () => {
    const p = computePlacement(anchor(), panel(), viewport, 'right-start', 8);
    expect(p.left).toBe(100 + 120 + 8);
    expect(p.top).toBe(100);
    expect(p.flipped).toBe(false);
  });

  it('flips right-start to the left when there is no room on the right', () => {
    const rightEdgeAnchor = anchor({ left: 900, width: 100 }); // spaceRight = 1024-1000-8=16, panel width 200 doesn't fit
    const p = computePlacement(rightEdgeAnchor, panel(), viewport, 'right-start', 8);
    expect(p.flipped).toBe(true);
    expect(p.left).toBe(900 - 8 - 200);
  });

  it('places left-start to the left of the anchor, top-aligned', () => {
    const p = computePlacement(anchor({ left: 500 }), panel(), viewport, 'left-start', 8);
    expect(p.left).toBe(500 - 8 - 200);
    expect(p.top).toBe(100);
  });

  it('leaves maxWidth undefined when the panel already fits the viewport', () => {
    const p = computePlacement(anchor(), panel(), viewport, 'bottom-start', 8);
    expect(p.maxWidth).toBeUndefined();
  });

  it('clamps maxWidth to the viewport minus edge margins on a narrow (mobile) viewport', () => {
    const narrowViewport: Viewport = { width: 320, height: 600 };
    const wideAnchor = anchor({ left: 20, width: 100 });
    const widePanel = panel({ width: 360 }); // wider than the 320px viewport
    const p = computePlacement(wideAnchor, widePanel, narrowViewport, 'bottom-start', 8);
    expect(p.maxWidth).toBe(320 - 8 * 2);
    expect(p.left).toBe(8); // pinned to the left edge since it can't fit at its natural width
  });
});
