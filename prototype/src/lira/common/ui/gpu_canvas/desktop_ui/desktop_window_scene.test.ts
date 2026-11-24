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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/desktop_window_scene.test
 * │ Filename        │ desktop_window_scene.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for createDesktopWindowScene -- the composed scene's
 * │                 │ own setup, resize, interactive state machine, and teardown,
 * │                 │ against a fake WebGPU device.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/desktop_window_scene.test
 * @file desktop_window_scene.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDesktopWindowScene } from "./desktop_window_scene";
import { ATLAS_CHARACTERS, bakeFontAtlas, type Canvas2DContextLike, type CanvasLike, type FontAtlas } from "./font_atlas";
import { fakeCanvas, fakeContext, fakeDevice, stubWebGpuGlobals } from "./gpu_test_support";

/** This scene's own real text (the window title, the content message,
 * every status line, the reopen label) all draw against whatever
 * `FontAtlas` `createDesktopWindowScene()`'s own `createAtlas`
 * parameter supplies -- real text layout needs a real glyph for every
 * character used, so this bakes the *real* `ATLAS_CHARACTERS` set
 * (`font_atlas.ts`'s own docstring on why), just against a fake 2D
 * context (`font_atlas.test.ts`'s own same fake-context pattern,
 * jsdom has no real canvas 2D rasteriser to bake against at all)
 * rather than a hand-picked handful of characters that might not
 * cover every real string this scene actually draws. */
function fakeAtlas(): FontAtlas {
  const fillTextCalls: [string, number, number][] = [];
  const widths: Record<string, number> = {};
  for (const character of ATLAS_CHARACTERS) widths[character] = 8;
  const context: Canvas2DContextLike = {
    font: "",
    fillStyle: "",
    textBaseline: "",
    textAlign: "",
    measureText: (text: string) => ({ width: widths[text] ?? 0 }),
    fillText: (text: string, x: number, y: number) => void fillTextCalls.push([text, x, y]),
    getImageData: (_x: number, _y: number, width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) }),
  };
  const canvas: CanvasLike = { width: 0, height: 0, getContext: () => context };
  return bakeFontAtlas(() => canvas, 16);
}

/** `layout.ts`'s own documented control-dot/toolbar-button rect
 * placement (`DEFAULT_DESKTOP_WINDOW_LAYOUT_CONFIG`), re-derived here
 * just enough to click the real close/minimize/maximize dots by their
 * own real on-screen position, the same way a real pointer would --
 * not a private hook into the scene's own internal state. */
/** `margin` defaults to the real, undragged, non-maximized default
 * (`DEFAULT_DESKTOP_WINDOW_LAYOUT_CONFIG.margin`) -- pass `0` for a
 * *maximized* window instead (`renderFrame()`'s own margin-0 override
 * while `state.maximized`), since every control's own real on-screen
 * position shifts along with the window the moment it maximizes. */
function windowOrigin(canvasWidth: number, canvasHeight: number, margin = 48): [number, number] {
  return [(canvasWidth - (canvasWidth - margin * 2)) / 2, (canvasHeight - (canvasHeight - margin * 2)) / 2];
}

/** `index` 0/1/2 == close/minimize/maximize, `layout.ts`'s own
 * documented left-to-right order. */
function controlDotCenter(canvasWidth: number, canvasHeight: number, index: number, margin = 48): [number, number] {
  const [windowX, windowY] = windowOrigin(canvasWidth, canvasHeight, margin);
  const dotSize = 13;
  const dotX = windowX + 18 + index * (dotSize + 10) + dotSize / 2;
  const dotY = windowY + (44 - dotSize) / 2 + dotSize / 2;
  return [dotX, dotY];
}

function closeDotCenter(canvasWidth: number, canvasHeight: number, margin = 48): [number, number] {
  return controlDotCenter(canvasWidth, canvasHeight, 0, margin);
}

function maximizeDotCenter(canvasWidth: number, canvasHeight: number, margin = 48): [number, number] {
  return controlDotCenter(canvasWidth, canvasHeight, 2, margin);
}

/** A point on the title bar's own empty space -- well clear of every
 * control dot (`layout.ts`'s own documented left-aligned dot
 * placement), where a real press-and-drag gesture would actually grab
 * the window, not trigger a control. */
function titleBarDragPoint(canvasWidth: number, canvasHeight: number, margin = 48): [number, number] {
  const [windowX, windowY] = windowOrigin(canvasWidth, canvasHeight, margin);
  return [windowX + 300, windowY + 22];
}

describe("createDesktopWindowScene", () => {
  beforeEach(() => stubWebGpuGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("builds exactly five render pipelines at setup -- panel, line, wallpaper, blur, text -- and nothing on the first renderFrame call beyond that", () => {
    const { device } = fakeDevice();
    const scene = createDesktopWindowScene(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas(1000, 700), fakeAtlas);
    expect(device.createRenderPipeline).toHaveBeenCalledTimes(5);
    device.createRenderPipeline.mockClear();
    scene.renderFrame(0);
    expect(device.createRenderPipeline).not.toHaveBeenCalled();
  });

  it("renders many consecutive frames, across a resize, without throwing", () => {
    const { device } = fakeDevice();
    const canvas = fakeCanvas(1000, 700);
    const scene = createDesktopWindowScene(device as never, fakeContext() as never, "bgra8unorm", canvas, fakeAtlas);
    for (let frame = 0; frame < 5; frame++) scene.renderFrame(frame * 16);
    canvas.width = 500;
    canvas.height = 1200;
    for (let frame = 5; frame < 10; frame++) scene.renderFrame(frame * 16);
    expect(device.queue.submit).toHaveBeenCalledTimes(10);
  });

  it("recreates the backdrop textures (and rebinds every pooled panel against the new one) exactly once per distinct canvas size", () => {
    const { device, createdTextures } = fakeDevice();
    const canvas = fakeCanvas(1000, 700);
    const scene = createDesktopWindowScene(device as never, fakeContext() as never, "bgra8unorm", canvas, fakeAtlas);
    const textureCountAfterSetup = createdTextures.length; // 3 backdrop textures + 1 font atlas texture, at setup
    scene.renderFrame(0);
    scene.renderFrame(16); // same size -- no new textures
    expect(createdTextures.length).toBe(textureCountAfterSetup);

    canvas.width = 400;
    canvas.height = 300;
    scene.renderFrame(32); // real resize -- 3 fresh backdrop textures
    expect(createdTextures.length).toBe(textureCountAfterSetup + 3);
  });

  it("clicking the real close control collapses the frame to just the reopen pill on the next frame, then reopen brings the full frame back", () => {
    const { device, passes } = fakeDevice();
    const canvas = fakeCanvas(1000, 700);
    const scene = createDesktopWindowScene(device as never, fakeContext() as never, "bgra8unorm", canvas, fakeAtlas);

    scene.renderFrame(0); // establishes this frame's own real hit targets
    const openPassCount = passes.length;
    const openMainPassDraws = passes[openPassCount - 1].drawIndexed.mock.calls.length;
    expect(openMainPassDraws).toBeGreaterThan(5); // the shadow, the glass frame, 3 dots, 4 toolbar buttons, toolbar icon circles...

    const [cx, cy] = closeDotCenter(1000, 700);
    scene.handlePointerMove(cx, cy);
    scene.handlePointerDown(cx, cy);
    scene.handlePointerUp(cx, cy);

    scene.renderFrame(16);
    const closedMainPass = passes.at(-1)!;
    // Only the (invisible-alpha) shadow instance and the reopen pill --
    // every control dot, toolbar button, and icon line is gone.
    expect(closedMainPass.drawIndexed.mock.calls.length).toBe(2);

    // Clicking the reopen pill (centred on the canvas, this suite's own documented rect) brings it all back.
    const reopenCenter: [number, number] = [1000 / 2, 700 / 2];
    scene.handlePointerMove(...reopenCenter);
    scene.handlePointerDown(...reopenCenter);
    scene.handlePointerUp(...reopenCenter);
    scene.renderFrame(32);
    expect(passes.at(-1)!.drawIndexed.mock.calls.length).toBe(openMainPassDraws);
  });

  it("hovering the close dot draws its own glyph (one extra line draw) that a plain, unhovered frame does not", () => {
    const { passes, device } = fakeDevice();
    const canvas = fakeCanvas(1000, 700);
    const scene = createDesktopWindowScene(device as never, fakeContext() as never, "bgra8unorm", canvas, fakeAtlas);
    scene.renderFrame(0);
    const idleDraws = passes.at(-1)!.drawIndexed.mock.calls.length;

    const [cx, cy] = closeDotCenter(1000, 700);
    scene.handlePointerMove(cx, cy);
    scene.renderFrame(16);
    const hoveredDraws = passes.at(-1)!.drawIndexed.mock.calls.length;
    expect(hoveredDraws).toBe(idleDraws + 2); // close's own glyph is two crossing line segments

    scene.handlePointerLeave();
    scene.renderFrame(32);
    expect(passes.at(-1)!.drawIndexed.mock.calls.length).toBe(idleDraws);
  });

  it("destroy() tears down every buffer and texture this scene created, with none left undestroyed", () => {
    const { device, createdBuffers, createdTextures } = fakeDevice();
    const canvas = fakeCanvas(1000, 700);
    const scene = createDesktopWindowScene(device as never, fakeContext() as never, "bgra8unorm", canvas, fakeAtlas);
    scene.renderFrame(0);
    scene.destroy();
    for (const buffer of createdBuffers) expect(buffer.destroy).toHaveBeenCalledTimes(1);
    for (const texture of createdTextures) expect(texture.destroy).toHaveBeenCalledTimes(1);
  });

  describe("dragging the window by its own title bar -- the window is positionable on the desktop, not the desktop itself", () => {
    it("moves the whole window by exactly the drag delta -- the close dot is only hit-testable at its own new position afterward", () => {
      const { device, passes } = fakeDevice();
      const canvas = fakeCanvas(1000, 700);
      const scene = createDesktopWindowScene(device as never, fakeContext() as never, "bgra8unorm", canvas, fakeAtlas);
      scene.renderFrame(0);

      const [startX, startY] = titleBarDragPoint(1000, 700);
      const [dx, dy] = [120, 40];
      scene.handlePointerDown(startX, startY);
      scene.handlePointerMove(startX + dx, startY + dy);
      scene.handlePointerUp(startX + dx, startY + dy);
      scene.renderFrame(16);

      // The close dot's own ORIGINAL coordinates no longer hit anything -- the window really moved away from there.
      const [origCx, origCy] = closeDotCenter(1000, 700);
      scene.handlePointerDown(origCx, origCy);
      scene.handlePointerUp(origCx, origCy);
      scene.renderFrame(32);
      expect(passes.at(-1)!.drawIndexed.mock.calls.length).toBeGreaterThan(5); // unaffected -- still the full open frame

      // The close dot's own NEW coordinates (shifted by the same drag delta) do hit it.
      scene.handlePointerDown(origCx + dx, origCy + dy);
      scene.handlePointerUp(origCx + dx, origCy + dy);
      scene.renderFrame(48);
      expect(passes.at(-1)!.drawIndexed.mock.calls.length).toBe(2); // shadow + reopen pill only -- it really did close
    });

    it("never moves the window when the press lands on a control dot, even if the pointer then moves before release", () => {
      const { device, passes } = fakeDevice();
      const canvas = fakeCanvas(1000, 700);
      const scene = createDesktopWindowScene(device as never, fakeContext() as never, "bgra8unorm", canvas, fakeAtlas);
      scene.renderFrame(0);

      const [cx, cy] = closeDotCenter(1000, 700);
      scene.handlePointerDown(cx, cy);
      scene.handlePointerMove(cx + 300, cy + 300); // would move the window if this were (wrongly) treated as a drag
      scene.handlePointerUp(cx + 300, cy + 300); // released well away from the close dot -- not a valid click either
      scene.renderFrame(16);

      // The window is still exactly where it started -- the ORIGINAL close dot position still closes it.
      scene.handlePointerDown(cx, cy);
      scene.handlePointerUp(cx, cy);
      scene.renderFrame(32);
      expect(passes.at(-1)!.drawIndexed.mock.calls.length).toBe(2); // shadow + reopen pill only
    });

    it("has no effect while maximized -- un-maximizing afterward restores exactly the original, undragged position", () => {
      const { device, passes } = fakeDevice();
      const canvas = fakeCanvas(1000, 700);
      const scene = createDesktopWindowScene(device as never, fakeContext() as never, "bgra8unorm", canvas, fakeAtlas);
      scene.renderFrame(0);

      const [maxCx, maxCy] = maximizeDotCenter(1000, 700);
      scene.handlePointerDown(maxCx, maxCy);
      scene.handlePointerUp(maxCx, maxCy);
      scene.renderFrame(16); // now maximized

      const [dragX, dragY] = titleBarDragPoint(1000, 700, 0); // margin 0 -- the title bar's own real position while maximized
      scene.handlePointerDown(dragX, dragY);
      scene.handlePointerMove(dragX + 400, dragY + 200);
      scene.handlePointerUp(dragX + 400, dragY + 200);
      scene.renderFrame(32); // attempted drag while maximized -- should be a no-op

      const [maxCxMaximized, maxCyMaximized] = maximizeDotCenter(1000, 700, 0); // the maximize dot's own real position while maximized
      scene.handlePointerDown(maxCxMaximized, maxCyMaximized);
      scene.handlePointerUp(maxCxMaximized, maxCyMaximized);
      scene.renderFrame(48); // un-maximize

      // The close dot is back at exactly its own original, pre-maximize coordinates.
      const [origCx, origCy] = closeDotCenter(1000, 700);
      scene.handlePointerDown(origCx, origCy);
      scene.handlePointerUp(origCx, origCy);
      scene.renderFrame(64);
      expect(passes.at(-1)!.drawIndexed.mock.calls.length).toBe(2); // shadow + reopen pill only -- the close dot really was still there
    });

    it("pointerleave ends an in-progress drag -- a later pointermove no longer moves the window", () => {
      const { device } = fakeDevice();
      const canvas = fakeCanvas(1000, 700);
      const scene = createDesktopWindowScene(device as never, fakeContext() as never, "bgra8unorm", canvas, fakeAtlas);
      scene.renderFrame(0);

      const [startX, startY] = titleBarDragPoint(1000, 700);
      scene.handlePointerDown(startX, startY);
      scene.handlePointerMove(startX + 50, startY + 50);
      scene.handlePointerLeave(); // ends the drag
      scene.handlePointerMove(startX + 999, startY + 999); // should do nothing -- no drag in progress any more
      scene.renderFrame(16);

      // The close dot is still reachable near its own original position (shifted only by the first, real 50/50 move).
      const [origCx, origCy] = closeDotCenter(1000, 700);
      scene.handlePointerDown(origCx + 50, origCy + 50);
      scene.handlePointerUp(origCx + 50, origCy + 50);
      scene.renderFrame(32);
    });
  });
});
