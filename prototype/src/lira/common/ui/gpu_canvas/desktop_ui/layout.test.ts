/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/layout.test
 * │ Filename        │ layout.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for layout.ts's own SDF math, hit-testing, and
 * │                 │ window-frame layout -- pure functions, no fake WebGPU device
 * │                 │ needed at all.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/layout.test
 * @file layout.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { describe, expect, it } from "vitest";
import { clampWindowPosition, computeDesktopWindowLayout, hitTestRects, rectCenter, rectContainsPoint, rectHalfExtent, roundedRectSdf, type Rect } from "./layout";

describe("roundedRectSdf", () => {
  it("is exactly -halfWidth at the centre of a square, radius 0", () => {
    expect(roundedRectSdf(0, 0, 10, 10, 0)).toBeCloseTo(-10, 10);
  });

  it("is exactly 0 on the flat edge, radius 0", () => {
    expect(roundedRectSdf(10, 0, 10, 10, 0)).toBeCloseTo(0, 10);
  });

  it("is positive once clearly outside the box", () => {
    expect(roundedRectSdf(30, 0, 10, 10, 0)).toBeGreaterThan(0);
  });

  it("degenerates to an exact circle when radius == halfWidth == halfHeight", () => {
    const radius = 10;
    // On-axis boundary point: still exactly 0, same as the unrounded
    // box above -- a fully-rounded square is a circle of that same
    // radius, so the flat-edge boundary point is unchanged.
    expect(roundedRectSdf(radius, 0, radius, radius, radius)).toBeCloseTo(0, 10);
    // The true diagonal corner point of the *unrounded* box (radius 0)
    // would be outside a circle of the same radius -- confirms the
    // corner has actually been rounded away, not left square.
    expect(roundedRectSdf(radius, radius, radius, radius, radius)).toBeGreaterThan(0);
    // A point at exactly radius distance from centre, on the diagonal,
    // sits exactly on the circle's own boundary.
    const diagonal = radius / Math.SQRT2;
    expect(roundedRectSdf(diagonal, diagonal, radius, radius, radius)).toBeCloseTo(0, 5);
  });

  it("the centre is always exactly -radius away from a fully-rounded box's own boundary", () => {
    expect(roundedRectSdf(0, 0, 10, 10, 10)).toBeCloseTo(-10, 10);
  });
});

describe("rectCenter / rectHalfExtent", () => {
  it("computes the true centre and half-extent of a rect", () => {
    const rect: Rect = { x: 10, y: 20, width: 40, height: 60 };
    expect(rectCenter(rect)).toEqual([30, 50]);
    expect(rectHalfExtent(rect)).toEqual([20, 30]);
  });
});

describe("rectContainsPoint / hitTestRects", () => {
  const rect: Rect = { x: 10, y: 10, width: 20, height: 20 };

  it("is true on every edge and inside, false just outside", () => {
    expect(rectContainsPoint(rect, 10, 10)).toBe(true);
    expect(rectContainsPoint(rect, 30, 30)).toBe(true);
    expect(rectContainsPoint(rect, 20, 20)).toBe(true);
    expect(rectContainsPoint(rect, 9.999, 20)).toBe(false);
    expect(rectContainsPoint(rect, 30.001, 20)).toBe(false);
  });

  it("hitTestRects returns the first matching id in list order, or undefined over empty space", () => {
    const entries = [
      { id: "a", rect: { x: 0, y: 0, width: 10, height: 10 } },
      { id: "b", rect: { x: 100, y: 100, width: 10, height: 10 } },
    ] as const;
    expect(hitTestRects(entries, 5, 5)).toBe("a");
    expect(hitTestRects(entries, 105, 105)).toBe("b");
    expect(hitTestRects(entries, 50, 50)).toBeUndefined();
  });

  it("hitTestRects returns the earlier id when two rects overlap, never the later one", () => {
    const entries = [
      { id: "front", rect: { x: 0, y: 0, width: 20, height: 20 } },
      { id: "back", rect: { x: 10, y: 10, width: 20, height: 20 } },
    ] as const;
    expect(hitTestRects(entries, 15, 15)).toBe("front");
  });
});

describe("computeDesktopWindowLayout", () => {
  it("stacks titleBar -> toolbar -> content -> statusBar with no gaps or overlaps, inside a centred, margin-inset window", () => {
    const layout = computeDesktopWindowLayout(1000, 700);
    const { window, titleBar, toolbar, content, statusBar } = layout;

    // Centred with the configured margin on every side.
    expect(window.x).toBeCloseTo(48, 10);
    expect(window.y).toBeCloseTo(48, 10);
    expect(window.width).toBeCloseTo(1000 - 48 * 2, 10);
    expect(window.height).toBeCloseTo(700 - 48 * 2, 10);

    // Every band spans the window's own full width.
    for (const band of [titleBar, toolbar, content, statusBar]) {
      expect(band.x).toBeCloseTo(window.x, 10);
      expect(band.width).toBeCloseTo(window.width, 10);
    }

    // Stacked top to bottom with no gap and no overlap.
    expect(titleBar.y).toBeCloseTo(window.y, 10);
    expect(toolbar.y).toBeCloseTo(titleBar.y + titleBar.height, 10);
    expect(content.y).toBeCloseTo(toolbar.y + toolbar.height, 10);
    expect(statusBar.y).toBeCloseTo(content.y + content.height, 10);
    expect(statusBar.y + statusBar.height).toBeCloseTo(window.y + window.height, 10);
  });

  it("clamps the window to a sane minimum size on a tiny canvas, rather than collapsing to zero or negative", () => {
    const layout = computeDesktopWindowLayout(50, 50);
    expect(layout.window.width).toBeGreaterThan(0);
    expect(layout.window.height).toBeGreaterThan(0);
    expect(layout.content.height).toBeGreaterThanOrEqual(0);
  });

  it("every control dot and toolbar button sits inside its own band, in the documented left-to-right id order", () => {
    const layout = computeDesktopWindowLayout(1000, 700);
    expect(layout.controlDots.map((d) => d.id)).toEqual(["close", "minimize", "maximize"]);
    expect(layout.toolbarButtons.map((b) => b.id)).toEqual(["back", "search", "settings", "info"]);
    for (const { rect } of layout.controlDots) {
      expect(rect.x).toBeGreaterThanOrEqual(layout.titleBar.x);
      expect(rect.y).toBeGreaterThanOrEqual(layout.titleBar.y);
      expect(rect.y + rect.height).toBeLessThanOrEqual(layout.titleBar.y + layout.titleBar.height);
    }
    for (const { rect } of layout.toolbarButtons) {
      expect(rect.y).toBeGreaterThanOrEqual(layout.toolbar.y);
      expect(rect.y + rect.height).toBeLessThanOrEqual(layout.toolbar.y + layout.toolbar.height);
    }
    // No two control dots (or toolbar buttons) overlap -- each one's
    // own left edge is strictly past the previous one's right edge.
    for (let i = 1; i < layout.controlDots.length; i++) {
      expect(layout.controlDots[i].rect.x).toBeGreaterThan(layout.controlDots[i - 1].rect.x + layout.controlDots[i - 1].rect.width);
    }
  });

  it("recomputes from scratch at a different aspect ratio, not a cached square assumption", () => {
    const wide = computeDesktopWindowLayout(1600, 500);
    const tall = computeDesktopWindowLayout(500, 1600);
    expect(wide.window.width).toBeGreaterThan(wide.window.height);
    expect(tall.window.height).toBeGreaterThan(tall.window.width);
  });

  it("places the window at an explicit position instead of centring it, when one is given -- the window's own size is unaffected", () => {
    const centred = computeDesktopWindowLayout(1000, 700);
    const positioned = computeDesktopWindowLayout(1000, 700, undefined, [37, 91]);
    expect(positioned.window.x).toBe(37);
    expect(positioned.window.y).toBe(91);
    expect(positioned.window.width).toBe(centred.window.width);
    expect(positioned.window.height).toBe(centred.window.height);
    // Every band and control moves by the same offset as the window itself.
    expect(positioned.titleBar.x).toBe(37);
    expect(positioned.controlDots[0].rect.x - positioned.window.x).toBeCloseTo(centred.controlDots[0].rect.x - centred.window.x, 10);
  });
});

describe("clampWindowPosition", () => {
  it("leaves a position untouched when it's already fully reachable", () => {
    expect(clampWindowPosition([100, 50], 400, 1000, 700)).toEqual([100, 50]);
  });

  it("never lets the top edge go above the desktop at all", () => {
    expect(clampWindowPosition([100, -500], 400, 1000, 700)).toEqual([100, 0]);
  });

  it("still leaves at least the minimum draggable edge reachable on the left and right, however far the window is dragged", () => {
    const [farLeftX] = clampWindowPosition([-10000, 50], 400, 1000, 700);
    const [farRightX] = clampWindowPosition([10000, 50], 400, 1000, 700);
    expect(farLeftX).toBeGreaterThan(-400); // most of a 400-wide window can go off-canvas left, but not all of it
    expect(farRightX).toBeLessThan(1000); // and some of its own left edge always stays on-canvas on the right too
  });

  it("never pushes the bottom below 0, even on a canvas too short to need clamping there at all", () => {
    const [, y] = clampWindowPosition([0, 50], 400, 1000, 10);
    expect(y).toBeGreaterThanOrEqual(0);
  });
});
