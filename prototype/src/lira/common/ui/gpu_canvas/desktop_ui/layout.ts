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

/** The window's own top-left corner in desktop (canvas) pixel space --
 * the one real degree of freedom `desktop_window_scene.ts`'s own drag
 * interaction ever changes. A plain `[x, y]` tuple, the same house
 * style `rectCenter()`/`IconVec2` already use, not a `Rect` (which also
 * carries a size this type is never meant to): the window is
 * positionable, not resizable, by this feature's own design -- dragging
 * its own title bar moves it, nothing drags an edge to resize it. */
export type WindowPosition = readonly [number, number];

/** The whole window frame's own rects, derived fresh from the real,
 * current canvas size every call -- the same "never cache a layout
 * against a size that can change under you" discipline
 * `scene_renderer.ts`'s own `computeBounds()` already established for
 * the cube/sphere scene's bounds, here applied to a 2D window frame
 * instead of a 3D camera frustum. `window`'s own *size* is always
 * derived from the canvas (inset by `config.margin` on every side,
 * clamped to a sane minimum on a tiny canvas rather than collapsing to
 * zero or going negative); its *position* is `position` when the
 * caller supplies one (`desktop_window_scene.ts`'s own current,
 * possibly dragged-and-clamped `WindowPosition`), or centred in the
 * canvas when it doesn't -- a window is never positioned anywhere
 * until something (a drag, or simply never having been dragged yet)
 * says where, and "centred" is the one honest default for that,
 * mirroring a real desktop's own first-launch window placement.
 * `content`'s own height is clamped at zero the same way `width`/
 * `height` are, for the same reason (a canvas short enough that the
 * toolbar and status bar would otherwise overlap). */
export function computeDesktopWindowLayout(canvasWidth: number, canvasHeight: number, config: DesktopWindowLayoutConfig = DEFAULT_DESKTOP_WINDOW_LAYOUT_CONFIG, position?: WindowPosition): DesktopWindowLayout {
  const width = Math.max(MIN_WINDOW_WIDTH, canvasWidth - config.margin * 2);
  const height = Math.max(MIN_WINDOW_HEIGHT, canvasHeight - config.margin * 2);
  const x = position ? position[0] : (canvasWidth - width) / 2;
  const y = position ? position[1] : (canvasHeight - height) / 2;
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

/** How many pixels of the window's own frame always stay reachable on
 * every edge, however far it's dragged -- a real window manager's own
 * usual rule (dragging to a screen edge never lets a window vanish
 * entirely), applied here as a hard clamp rather than a soft
 * suggestion: without it, a dragged-then-resized desktop could leave
 * the window's own title bar (the only thing a drag can ever grab)
 * completely off-canvas and unrecoverable by any pointer gesture. */
const MIN_DRAGGABLE_EDGE_PX = 80;

/** Keeps a (possibly just-dragged) `WindowPosition` within reach of the
 * real, current desktop -- `desktop_window_scene.ts`'s own
 * `renderFrame()` calls this every frame, after a drag *and* after a
 * plain resize (the same stored position can go out of reach either
 * way, a canvas shrinking out from under an already-positioned window
 * just as much as a drag past its own edge). The window's own left/
 * right can still go mostly off-canvas (only `MIN_DRAGGABLE_EDGE_PX`
 * has to remain on each side), but its top never goes above the
 * desktop at all -- there's no reason to ever lose the title bar
 * upward, the one edge a real desktop doesn't extend past either.
 * There's no equivalent height parameter -- only the top edge is ever
 * clamped against going out of reach, so the window's own height never
 * enters the calculation at all. */
export function clampWindowPosition(position: WindowPosition, windowWidth: number, canvasWidth: number, canvasHeight: number): WindowPosition {
  const minX = MIN_DRAGGABLE_EDGE_PX - windowWidth;
  const maxX = Math.max(minX, canvasWidth - MIN_DRAGGABLE_EDGE_PX);
  const minY = 0;
  const maxY = Math.max(minY, canvasHeight - MIN_DRAGGABLE_EDGE_PX);
  return [Math.min(Math.max(position[0], minX), maxX), Math.min(Math.max(position[1], minY), maxY)];
}
