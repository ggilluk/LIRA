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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/layout
 * │ Filename        │ layout.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Pure, GPU-free geometry for the desktop window UI: the rounded-
 * │                 │ rect signed distance field every GPU shader in this folder also
 * │                 │ implements, window/title-bar/toolbar/content/status-bar layout,
 * │                 │ and plain rectangle hit-testing.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/layout
 * @file layout.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** Top-left/size rectangle in pixel space (the canvas's own real
 * `width`/`height`, not CSS pixels) -- every layout rect in this folder
 * is one of these; `panel_pipeline.ts`'s own per-panel uniform wants
 * centre/half-extent instead (`rectCenter()`/`rectHalfExtent()` below
 * convert), since that's the natural frame for a signed distance field
 * centred on the shape's own middle. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export function rectCenter(rect: Rect): readonly [number, number] {
  return [rect.x + rect.width / 2, rect.y + rect.height / 2];
}

export function rectHalfExtent(rect: Rect): readonly [number, number] {
  return [rect.width / 2, rect.height / 2];
}

/** Plain axis-aligned containment, not the true rounded-corner shape --
 * deliberately: a toolbar button's hover/press hit-test only has to
 * feel right under a real pointer, and the few pixels a rounded corner
 * shaves off a rectangular hit-test are not worth carrying the real
 * `roundedRectSdf()` (and its own `radius` parameter) through every
 * call site that only ever needs "is the pointer over this control". */
export function rectContainsPoint(rect: Rect, px: number, py: number): boolean {
  return px >= rect.x && px <= rect.x + rect.width && py >= rect.y && py <= rect.y + rect.height;
}

/** First matching id, in list order, or `undefined` over empty space --
 * `desktop_window_scene.ts`'s own hover/press tracking calls this once
 * per pointer event against the current frame's own control-dot and
 * toolbar-button rects, rather than hand-rolling the same loop at each
 * call site. */
export function hitTestRects<T extends string>(entries: readonly { readonly id: T; readonly rect: Rect }[], px: number, py: number): T | undefined {
  for (const entry of entries) if (rectContainsPoint(entry.rect, px, py)) return entry.id;
  return undefined;
}

/** The standard rounded-box signed distance field (Inigo Quilez's own
 * `sdRoundBox`, the well-known closed form -- not something derived
 * from scratch here): negative inside the shape, zero exactly on its
 * boundary, positive outside; magnitude is the real Euclidean distance
 * to the nearest edge once outside, and to the nearest edge from
 * inside too (not just "inside"/"outside" as a boolean). `radius = 0`
 * degenerates to a plain axis-aligned box; `radius = min(halfWidth,
 * halfHeight)` with `halfWidth = halfHeight` degenerates to an exact
 * circle (`layout.test.ts`'s own regression check for both). Every GPU
 * shader in this folder that draws a rounded panel or a circular
 * traffic-light dot (`panel_pipeline.ts`) implements this *same*
 * formula directly in WGSL (no `#include` mechanism exists to literally
 * share it), so this copy exists to document the one true formula
 * everything else must agree with, and to let it be unit-tested at all
 * -- WGSL math has no test runner of its own. */
export function roundedRectSdf(px: number, py: number, halfWidth: number, halfHeight: number, radius: number): number {
  const qx = Math.abs(px) - halfWidth + radius;
  const qy = Math.abs(py) - halfHeight + radius;
  const outside = Math.hypot(Math.max(qx, 0), Math.max(qy, 0));
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - radius;
}

/** Every tunable pixel measurement `computeDesktopWindowLayout()` below
 * needs, gathered in one place rather than scattered magic numbers --
 * a real caller can override any subset of `DEFAULT_DESKTOP_WINDOW_LAYOUT_CONFIG`
 * (e.g. a future denser/compact theme) without this function's own
 * signature changing. */
export interface DesktopWindowLayoutConfig {
  readonly margin: number;
  readonly cornerRadius: number;
  readonly titleBarHeight: number;
  readonly toolbarHeight: number;
  readonly statusBarHeight: number;
  readonly controlDotSize: number;
  readonly controlDotGap: number;
  readonly controlsPaddingLeft: number;
  readonly toolbarButtonSize: number;
  readonly toolbarButtonGap: number;
  readonly toolbarPaddingLeft: number;
  readonly contentPadding: number;
}

export const DEFAULT_DESKTOP_WINDOW_LAYOUT_CONFIG: DesktopWindowLayoutConfig = {
  margin: 48,
  cornerRadius: 16,
  titleBarHeight: 44,
  toolbarHeight: 48,
  statusBarHeight: 28,
  controlDotSize: 13,
  controlDotGap: 10,
  controlsPaddingLeft: 18,
  toolbarButtonSize: 32,
  toolbarButtonGap: 10,
  toolbarPaddingLeft: 16,
  contentPadding: 20,
};

/** The window frame's own three traffic-light controls, left to right
 * -- real ids, not array indices, so `desktop_window_scene.ts`'s own
 * click handling (`hitTestRects()` above returns one of these) reads as
 * "the close control was pressed", not "control 0 was pressed". */
export const CONTROL_DOT_IDS = ["close", "minimize", "maximize"] as const;
export type ControlDotId = (typeof CONTROL_DOT_IDS)[number];

/** The toolbar's own four action buttons, left to right -- same "real
 * id, not index" reasoning as `CONTROL_DOT_IDS` above. `icons.ts`'s own
 * `TOOLBAR_ICONS` record is keyed by these same ids. */
export const TOOLBAR_BUTTON_IDS = ["back", "search", "settings", "info"] as const;
export type ToolbarButtonId = (typeof TOOLBAR_BUTTON_IDS)[number];

const MIN_WINDOW_WIDTH = 240;
const MIN_WINDOW_HEIGHT = 180;

export interface DesktopWindowLayout {
  readonly window: Rect;
  readonly titleBar: Rect;
  readonly toolbar: Rect;
  readonly content: Rect;
  readonly statusBar: Rect;
  readonly controlDots: readonly { readonly id: ControlDotId; readonly rect: Rect }[];
  readonly toolbarButtons: readonly { readonly id: ToolbarButtonId; readonly rect: Rect }[];
}

/** The whole window frame's own rects, derived fresh from the real,
 * current canvas size every call -- the same "never cache a layout
 * against a size that can change under you" discipline
 * `scene_renderer.ts`'s own `computeBounds()` already established for
 * the cube/sphere scene's bounds, here applied to a 2D window frame
 * instead of a 3D camera frustum. `window` is centred in the canvas,
 * inset by `config.margin` on every side, clamped to a sane minimum
 * size on a tiny canvas rather than collapsing to zero or going
 * negative; `content`'s own height is clamped at zero the same way,
 * for the same reason (a canvas short enough that the toolbar and
 * status bar would otherwise overlap). */
export function computeDesktopWindowLayout(canvasWidth: number, canvasHeight: number, config: DesktopWindowLayoutConfig = DEFAULT_DESKTOP_WINDOW_LAYOUT_CONFIG): DesktopWindowLayout {
  const width = Math.max(MIN_WINDOW_WIDTH, canvasWidth - config.margin * 2);
  const height = Math.max(MIN_WINDOW_HEIGHT, canvasHeight - config.margin * 2);
  const x = (canvasWidth - width) / 2;
  const y = (canvasHeight - height) / 2;
  const windowRect: Rect = { x, y, width, height };

  const titleBar: Rect = { x, y, width, height: config.titleBarHeight };
  const toolbar: Rect = { x, y: y + config.titleBarHeight, width, height: config.toolbarHeight };
  const statusBar: Rect = { x, y: y + height - config.statusBarHeight, width, height: config.statusBarHeight };
  const contentTop = toolbar.y + toolbar.height;
  const content: Rect = { x, y: contentTop, width, height: Math.max(0, statusBar.y - contentTop) };

  const controlDots = CONTROL_DOT_IDS.map((id, index) => ({
    id,
    rect: {
      x: x + config.controlsPaddingLeft + index * (config.controlDotSize + config.controlDotGap),
      y: y + (config.titleBarHeight - config.controlDotSize) / 2,
      width: config.controlDotSize,
      height: config.controlDotSize,
    },
  }));

  const toolbarButtons = TOOLBAR_BUTTON_IDS.map((id, index) => ({
    id,
    rect: {
      x: x + config.toolbarPaddingLeft + index * (config.toolbarButtonSize + config.toolbarButtonGap),
      y: toolbar.y + (config.toolbarHeight - config.toolbarButtonSize) / 2,
      width: config.toolbarButtonSize,
      height: config.toolbarButtonSize,
    },
  }));

  return { window: windowRect, titleBar, toolbar, content, statusBar, controlDots, toolbarButtons };
}
