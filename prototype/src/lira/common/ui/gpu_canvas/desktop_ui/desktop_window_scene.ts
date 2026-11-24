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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/desktop_window_scene
 * │ Filename        │ desktop_window_scene.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ The library's own entry point: composes layout.ts/panel_pipeline.ts/
 * │                 │ backdrop.ts/icons.ts/text_pipeline.ts/font_atlas.ts into one real,
 * │                 │ interactive "modern OS window" scene, drawn entirely through WebGPU --
 * │                 │ a window positioned (and draggable by its own title bar) on a
 * │                 │ desktop, not the desktop itself.
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/desktop_window_scene
 * @file desktop_window_scene.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { backdropResolution, createBackdropPipelines, createBackdropResources, createBackdropTextures, destroyBackdropResources, destroyBackdropTextures, drawBackdrop, writeBackdropUniforms } from "./backdrop";
import { bakeFontAtlas, type FontAtlas } from "./font_atlas";
import { CONTROL_DOT_ICONS, createLinePipeline, createLineResource, destroyLineResource, drawLine, instantiateIconCircles, instantiateIconLines, TOOLBAR_ICONS, writeLineUniforms, type LineInstance, type LineResource } from "./icons";
import { clampWindowPosition, computeDesktopWindowLayout, DEFAULT_DESKTOP_WINDOW_LAYOUT_CONFIG, hitTestRects, rectCenter, rectContainsPoint, type ControlDotId, type Rect, type WindowPosition } from "./layout";
import {
  createPanelPipeline,
  createPanelQuadMesh,
  createPanelResource,
  destroyPanelQuadMesh,
  destroyPanelResource,
  drawPanel,
  PANEL_MODE_GLASS,
  PANEL_MODE_SHADOW,
  PANEL_MODE_SOLID,
  rebindPanelResource,
  writePanelUniforms,
  type PanelInstance,
  type PanelResource,
  type Rgba,
} from "./panel_pipeline";
import { createTextPipelineBundle, createTextResource, destroyTextPipelineBundle, destroyTextResource, drawText, writeTextQuads } from "./text_pipeline";
import type { GpuCanvasContextLike, GpuDeviceLike } from "../webgpu_types";

const WINDOW_TITLE = "LIRA Desktop";
const CONTENT_MESSAGE = "A reusable, WebGPU-drawn window chrome -- panel_pipeline.ts, backdrop.ts, icons.ts and text_pipeline.ts, composed here.";
const REOPEN_LABEL = "Reopen Window";

const CONTROL_DOT_COLORS: Record<ControlDotId, Rgba> = {
  close: [0.92, 0.32, 0.31, 1],
  minimize: [0.96, 0.75, 0.18, 1],
  maximize: [0.2, 0.76, 0.34, 1],
};

const PANEL_POOL_SIZE = 20;
const LINE_POOL_SIZE = 16;

/** Every interactive bit this scene's own real state tracks -- `hoveredId`/
 * `pressedId` are whatever `layout.ts`'s own `hitTestRects()` returned
 * against the *previous* frame's own hit targets (`hitTargets` below),
 * since pointer events can arrive between frames; `focused` is a plain
 * "was the last press inside the window frame" flag (real OS windows
 * use the same rule), driving the dimmer/brighter glass tint and
 * border this file's own `renderFrame()` applies. `windowPosition` is
 * the one real degree of freedom that makes the window a thing *on*
 * the desktop rather than the desktop itself -- `undefined` only ever
 * before the very first `renderFrame()` call (meaning "not yet placed
 * anywhere, so centre it"); every frame after that writes its own
 * resolved, clamped position straight back into this field, so "never
 * dragged" and "dragged back to exactly the centre" end up
 * indistinguishable, which is correct -- there's nothing more special
 * about the initial centred position than any other. `dragging`/
 * `dragOffset` exist only *during* a drag gesture, between a
 * `handlePointerDown()` that started on the title bar's own empty
 * space and the `handlePointerUp()`/`handlePointerLeave()` that ends
 * it. */
interface SceneState {
  focused: boolean;
  closed: boolean;
  minimized: boolean;
  maximized: boolean;
  hoveredId: string | undefined;
  pressedId: string | undefined;
  windowPosition: WindowPosition | undefined;
  dragging: boolean;
  dragOffset: WindowPosition;
}

export interface DesktopWindowScene {
  renderFrame(nowMs: number): void;
  /** `px`/`py` are real canvas pixel coordinates -- `gpu_canvas_view.ts`'s
   * own pointer listener is the "minimal vanilla JS" this feature's own
   * specification calls for (capturing *input*, not drawing anything);
   * every visible response to it -- hover highlight, press feedback,
   * the window's own focus styling, or the window actually moving
   * while being dragged by its own title bar -- is still a WebGPU draw
   * this state change merely feeds into on the *next* `renderFrame()`
   * call, never a DOM/CSS effect of its own. */
  handlePointerMove(px: number, py: number): void;
  handlePointerDown(px: number, py: number): void;
  handlePointerUp(px: number, py: number): void;
  handlePointerLeave(): void;
  destroy(): void;
}

/** `createAtlas`'s own real default (`() => bakeFontAtlas()`) bakes a
 * real font atlas via an ordinary 2D canvas -- `font_atlas.ts`'s own
 * docstring on why jsdom (this project's own test environment) can
 * never do that (no real `<canvas>` 2D rasteriser at all). The same
 * injection-point shape `gpu_canvas_view.ts`'s own `createCamera`/
 * `createOrientationSensor` parameters already use, for the same
 * reason: a test exercising this scene's own composition/interaction
 * logic supplies a small, hand-built `FontAtlas` instead. */
export function createDesktopWindowScene(device: GpuDeviceLike, context: GpuCanvasContextLike, format: string, canvas: HTMLCanvasElement, createAtlas: () => FontAtlas = () => bakeFontAtlas()): DesktopWindowScene {
  const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });
  const panelPipeline = createPanelPipeline(device, format);
  const quadMesh = createPanelQuadMesh(device);
  const linePipeline = createLinePipeline(device, format);
  const backdropPipelines = createBackdropPipelines(device, format);
  const atlas: FontAtlas = createAtlas();
  const textBundle = createTextPipelineBundle(device, format, atlas);

  let backdropTextures = createBackdropTextures(device, format, Math.max(1, canvas.width), Math.max(1, canvas.height));
  let backdropResources = createBackdropResources(device, backdropPipelines, backdropTextures, sampler);

  const panelPool: PanelResource[] = Array.from({ length: PANEL_POOL_SIZE }, () => createPanelResource(device, panelPipeline, sampler, backdropTextures.finalView));
  const linePool: LineResource[] = Array.from({ length: LINE_POOL_SIZE }, () => createLineResource(device, linePipeline));

  const titleText = createTextResource(device, textBundle);
  const messageText = createTextResource(device, textBundle);
  const statusText = createTextResource(device, textBundle);
  const reopenText = createTextResource(device, textBundle);

  // Seeded from the real textures just created above, not a sentinel
  // like -1 -- resizeBackdropIfNeeded()'s own job is to notice a
  // *later* resize, not to immediately treat the very first
  // renderFrame() call as one and redundantly recreate what setup
  // already built correctly against this same real canvas size.
  let backdropWidth = backdropTextures.width;
  let backdropHeight = backdropTextures.height;
  let hitTargets: readonly { readonly id: string; readonly rect: Rect }[] = [];
  let focusTestRect: Rect = { x: 0, y: 0, width: 0, height: 0 };
  // The one other rect handlePointerDown() below needs to know about
  // outside hitTargets -- the title bar's own current rect, so a press
  // that misses every control dot but still lands on the title bar's
  // own empty space can be told apart from a press on the desktop
  // behind the window entirely.
  let lastTitleBar: Rect = { x: 0, y: 0, width: 0, height: 0 };

  const state: SceneState = {
    focused: true,
    closed: false,
    minimized: false,
    maximized: false,
    hoveredId: undefined,
    pressedId: undefined,
    windowPosition: undefined,
    dragging: false,
    dragOffset: [0, 0],
  };

  function resizeBackdropIfNeeded(width: number, height: number): void {
    const { width: targetWidth, height: targetHeight } = backdropResolution(width, height);
    if (targetWidth === backdropWidth && targetHeight === backdropHeight) return;
    destroyBackdropResources(backdropResources);
    destroyBackdropTextures(backdropTextures);
    backdropTextures = createBackdropTextures(device, format, width, height);
    backdropResources = createBackdropResources(device, backdropPipelines, backdropTextures, sampler);
    // Every pooled panel's own bindGroup referenced the *old* backdrop
    // texture's view -- panel_pipeline.ts's own rebindPanelResource()
    // docstring on why that's now a dangling reference that has to be
    // replaced, not left stale.
    for (const panel of panelPool) rebindPanelResource(device, panelPipeline, panel, sampler, backdropTextures.finalView);
    backdropWidth = targetWidth;
    backdropHeight = targetHeight;
  }

  function statusMessage(): string {
    if (state.minimized) return "Minimized";
    if (state.maximized && state.hoveredId === undefined) return "Maximized";
    if (state.hoveredId && ["back", "search", "settings", "info"].includes(state.hoveredId)) return `Hovering: ${state.hoveredId}`;
    return "Ready";
  }

  function renderFrame(nowMs: number): void {
    const width = Math.max(1, canvas.width);
    const height = Math.max(1, canvas.height);
    resizeBackdropIfNeeded(width, height);
    writeBackdropUniforms(device, backdropResources, backdropTextures, nowMs / 1000);

    const layoutConfig = state.maximized ? { ...DEFAULT_DESKTOP_WINDOW_LAYOUT_CONFIG, margin: 0 } : DEFAULT_DESKTOP_WINDOW_LAYOUT_CONFIG;
    // Two layout passes, not one: the first (no explicit position) is
    // only ever consulted for its own *size* and its own centred
    // default -- the real desktop position actually used this frame is
    // whatever `state.windowPosition` already holds (a previous frame's
    // own resolved position, or a drag in progress), clamped back into
    // reach of the current, real canvas size (`clampWindowPosition()`'s
    // own docstring on why that has to happen on every resize too, not
    // just every drag). Maximized skips both the stored position and
    // the clamp entirely -- a maximized window is always exactly where
    // `layoutConfig`'s own zero margin puts it, and dragging is
    // disabled while maximized (`handlePointerDown()` below) precisely
    // so there's never a "dragged-while-maximized" position to resolve
    // here. The *resolved* position is written back into
    // `state.windowPosition` every frame (even when nothing was
    // dragged) so next frame starts from exactly where this one ended
    // up, not from a stale pre-clamp value.
    const unpositioned = computeDesktopWindowLayout(width, height, layoutConfig);
    const defaultPosition: WindowPosition = [unpositioned.window.x, unpositioned.window.y];
    const resolvedPosition: WindowPosition = state.maximized ? defaultPosition : clampWindowPosition(state.windowPosition ?? defaultPosition, unpositioned.window.width, width, height);
    if (!state.maximized) state.windowPosition = resolvedPosition;
    const layout = computeDesktopWindowLayout(width, height, layoutConfig, resolvedPosition);
    const effectiveWindowRect = state.minimized ? layout.titleBar : layout.window;
    focusTestRect = effectiveWindowRect;
    lastTitleBar = layout.titleBar;

    const panelInstances: PanelInstance[] = [];
    const lineInstances: LineInstance[] = [];
    const newHitTargets: { id: string; rect: Rect }[] = [];

    // A soft, SDF-based drop shadow beneath the whole frame
    // (panel_pipeline.ts's own PANEL_MODE_SHADOW) -- offset down and
    // slightly larger than the frame itself, the same "real shadow,
    // not a flat dark rectangle" look the spec's own "multi-layered
    // soft drop shadows" calls for.
    panelInstances.push({
      rect: { x: effectiveWindowRect.x - 6, y: effectiveWindowRect.y + 10, width: effectiveWindowRect.width + 12, height: effectiveWindowRect.height + 12 },
      cornerRadius: layoutConfig.cornerRadius + 6,
      mode: PANEL_MODE_SHADOW,
      borderWidth: 0,
      shadowSoftness: 26,
      fillColor: [0, 0, 0, state.closed ? 0 : 0.35],
      borderColor: [0, 0, 0, 0],
      glassTint: [0, 0, 0, 0],
    });

    if (state.closed) {
      const reopenRect: Rect = { x: width / 2 - 70, y: height / 2 - 20, width: 140, height: 40 };
      newHitTargets.push({ id: "reopen", rect: reopenRect });
      const hot = state.hoveredId === "reopen" || state.pressedId === "reopen";
      panelInstances.push({
        rect: reopenRect,
        cornerRadius: 20,
        mode: PANEL_MODE_GLASS,
        borderWidth: 1.5,
        shadowSoftness: 0,
        fillColor: [0, 0, 0, 0],
        borderColor: [1, 1, 1, 0.3],
        glassTint: [0.1, 0.11, 0.16, state.pressedId === "reopen" ? 0.55 : hot ? 0.46 : 0.34],
      });
      writeTextQuads(device, reopenText, atlas, REOPEN_LABEL, reopenRect.x + 20, reopenRect.y + 13, 14, [1, 1, 1, 0.92], width, height);
    } else {
      // One translucent frosted pane behind the *whole* frame, not one
      // per band -- a real window's own title bar blends seamlessly
      // into its body; separate per-band glass rects would instead
      // show a visible notch where two independently-rounded corners
      // meet at a shared, perfectly straight edge. The border this one
      // panel draws (panel_pipeline.ts's own borderWidth/borderColor)
      // is this whole frame's own single hairline outline.
      const focusAmount = state.focused ? 1 : 0.55;
      panelInstances.push({
        rect: effectiveWindowRect,
        cornerRadius: layoutConfig.cornerRadius,
        mode: PANEL_MODE_GLASS,
        borderWidth: 1.5,
        shadowSoftness: 0,
        fillColor: [0, 0, 0, 0],
        borderColor: [1, 1, 1, 0.22 * focusAmount],
        glassTint: [0.08, 0.09, 0.14, state.focused ? 0.3 : 0.44],
      });

      for (const { id, rect } of layout.controlDots) {
        newHitTargets.push({ id, rect });
        panelInstances.push({
          rect,
          cornerRadius: rect.width / 2,
          mode: PANEL_MODE_SOLID,
          borderWidth: 0,
          shadowSoftness: 0,
          fillColor: CONTROL_DOT_COLORS[id],
          borderColor: [0, 0, 0, 0],
          glassTint: [0, 0, 0, 0],
        });
        if (state.hoveredId === id) {
          const [cx, cy] = rectCenter(rect);
          lineInstances.push(...instantiateIconLines(CONTROL_DOT_ICONS[id], cx, cy, rect.width * 0.62, 1.3, [0, 0, 0, 0.55]));
        }
      }

      const titleX = layout.controlDots[layout.controlDots.length - 1].rect.x + layout.controlDots[layout.controlDots.length - 1].rect.width + 18;
      const titleY = layout.titleBar.y + (layout.titleBar.height - 14) / 2;
      writeTextQuads(device, titleText, atlas, WINDOW_TITLE, titleX, titleY, 14, [1, 1, 1, state.focused ? 0.95 : 0.6], width, height);

      if (!state.minimized) {
        lineInstances.push({ from: [layout.toolbar.x, layout.toolbar.y], to: [layout.toolbar.x + layout.toolbar.width, layout.toolbar.y], thickness: 1, color: [1, 1, 1, 0.12] });
        lineInstances.push({ from: [layout.statusBar.x, layout.statusBar.y], to: [layout.statusBar.x + layout.statusBar.width, layout.statusBar.y], thickness: 1, color: [1, 1, 1, 0.12] });

        for (const { id, rect } of layout.toolbarButtons) {
          newHitTargets.push({ id, rect });
          const hovered = state.hoveredId === id;
          const pressed = state.pressedId === id;
          panelInstances.push({
            rect,
            cornerRadius: 8,
            mode: PANEL_MODE_SOLID,
            borderWidth: 0,
            shadowSoftness: 0,
            fillColor: [1, 1, 1, pressed ? 0.28 : hovered ? 0.16 : 0],
            borderColor: [0, 0, 0, 0],
            glassTint: [0, 0, 0, 0],
          });
          const iconColor: Rgba = [0.92, 0.93, 0.96, state.focused ? 0.92 : 0.55];
          const [cx, cy] = rectCenter(rect);
          lineInstances.push(...instantiateIconLines(TOOLBAR_ICONS[id], cx, cy, rect.width * 0.78, 1.6, iconColor));
          panelInstances.push(...instantiateIconCircles(TOOLBAR_ICONS[id], cx, cy, rect.width * 0.78, 1.6, iconColor));
        }

        writeTextQuads(device, messageText, atlas, CONTENT_MESSAGE, layout.content.x + layoutConfig.contentPadding, layout.content.y + layoutConfig.contentPadding, 13, [0.88, 0.89, 0.93, state.focused ? 0.85 : 0.5], width, height);
        writeTextQuads(device, statusText, atlas, statusMessage(), layout.statusBar.x + layoutConfig.contentPadding, layout.statusBar.y + (layout.statusBar.height - 11) / 2, 11, [0.8, 0.82, 0.88, 0.8], width, height);
      }
    }

    hitTargets = newHitTargets;

    // One writePanelUniforms()/writeLineUniforms() call per instance,
    // against this same frame's own pooled resources, in list order --
    // the same "allocate a generous pool once, write+draw only as many
    // as this frame actually needs" shape `scene_renderer.ts`'s own
    // fixed sixteen-entity loop already uses, just with the *count*
    // varying frame to frame here (closed/minimized hide whole groups
    // of instances) rather than staying fixed.
    if (panelInstances.length > panelPool.length || lineInstances.length > linePool.length) {
      throw new Error(`Desktop window scene produced more instances (${panelInstances.length} panels, ${lineInstances.length} lines) than its own fixed pool size (${panelPool.length}/${linePool.length}) -- grow PANEL_POOL_SIZE/LINE_POOL_SIZE.`);
    }
    panelInstances.forEach((instance, index) => writePanelUniforms(device, panelPool[index], width, height, instance));
    lineInstances.forEach((instance, index) => writeLineUniforms(device, linePool[index], width, height, instance));

    const encoder = device.createCommandEncoder();
    drawBackdrop(encoder, backdropPipelines, backdropTextures, backdropResources);

    const pass = encoder.beginRenderPass({ colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store" }] });
    // The crisp, unblurred wallpaper (backdrop.ts's own wallpaperTexture
    // pass already rendered it this same frame) is also this scene's
    // own visible desktop background -- drawn again here, directly into
    // the real swapchain target, reusing the exact same pipeline and
    // bind group (cheap: a few analytic gradient/exp() calls per
    // pixel), rather than blitting the offscreen texture back in a
    // fourth pass.
    pass.setPipeline(backdropPipelines.wallpaperPipeline);
    pass.setBindGroup(0, backdropResources.wallpaperBindGroup);
    pass.draw(3);

    panelInstances.forEach((_instance, index) => drawPanel(pass, panelPipeline, quadMesh, panelPool[index]));
    lineInstances.forEach((_instance, index) => drawLine(pass, linePipeline, quadMesh, linePool[index]));
    if (state.closed) {
      drawText(pass, textBundle.pipeline, reopenText);
    } else {
      drawText(pass, textBundle.pipeline, titleText);
      if (!state.minimized) {
        drawText(pass, textBundle.pipeline, messageText);
        drawText(pass, textBundle.pipeline, statusText);
      }
    }
    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  function handlePointerMove(px: number, py: number): void {
    if (state.dragging) {
      // Unclamped here on purpose -- clampWindowPosition() runs once,
      // centrally, at the top of the *next* renderFrame() call (the
      // same place a plain resize is clamped too), rather than
      // duplicating that same clamp here against whatever this frame's
      // own canvas size happens to be.
      state.windowPosition = [px - state.dragOffset[0], py - state.dragOffset[1]];
      return; // dragging suppresses hover -- real window managers don't highlight whatever the cursor passes over mid-drag either
    }
    state.hoveredId = hitTestRects(hitTargets, px, py);
  }

  function handlePointerDown(px: number, py: number): void {
    const hitId = hitTestRects(hitTargets, px, py);
    state.pressedId = hitId;
    state.focused = state.closed || rectContainsPoint(focusTestRect, px, py);
    // A drag starts only on the title bar's own empty space -- not on
    // a control dot (hitId would already name one), not while closed
    // (no title bar to grab) or maximized (nowhere to move it: the
    // window already fills the desktop, same reasoning
    // `renderFrame()`'s own docstring on skipping the clamp gives).
    if (!state.closed && !state.maximized && hitId === undefined && rectContainsPoint(lastTitleBar, px, py)) {
      state.dragging = true;
      const [windowX, windowY] = state.windowPosition ?? [0, 0];
      state.dragOffset = [px - windowX, py - windowY];
    }
  }

  function handlePointerUp(px: number, py: number): void {
    if (state.dragging) {
      state.dragging = false;
      state.pressedId = undefined;
      return; // a drag is its own gesture -- never also a click on whatever happens to be under the pointer when it's released
    }
    const releasedOverSamePressedTarget = state.pressedId !== undefined && state.pressedId === hitTestRects(hitTargets, px, py);
    if (releasedOverSamePressedTarget) {
      switch (state.pressedId) {
        case "close":
          state.closed = true;
          break;
        case "minimize":
          state.minimized = !state.minimized;
          break;
        case "maximize":
          state.maximized = !state.maximized;
          break;
        case "reopen":
          state.closed = false;
          break;
        default:
          break; // toolbar buttons: hover/press visual feedback only, no persistent side effect
      }
    }
    state.pressedId = undefined;
  }

  function handlePointerLeave(): void {
    state.hoveredId = undefined;
    state.pressedId = undefined;
    state.dragging = false; // the pointer leaving the canvas ends a drag in progress, rather than leaving it stuck active with no further move events to update it
  }

  function destroy(): void {
    destroyBackdropResources(backdropResources);
    destroyBackdropTextures(backdropTextures);
    for (const panel of panelPool) destroyPanelResource(panel);
    destroyPanelQuadMesh(quadMesh);
    for (const line of linePool) destroyLineResource(line);
    destroyTextResource(titleText);
    destroyTextResource(messageText);
    destroyTextResource(statusText);
    destroyTextResource(reopenText);
    destroyTextPipelineBundle(textBundle);
  }

  return { renderFrame, handlePointerMove, handlePointerDown, handlePointerUp, handlePointerLeave, destroy };
}
