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
 * │ Module Name     │ lira/common/ui/gpu_canvas_view.test
 * │ Filename        │ gpu_canvas_view.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-27
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for GpuCanvasView with WebGPU, ResizeObserver and
 * │                 │ requestAnimationFrame stubbed, since jsdom has none of them. The
 * │                 │ real DesktopWindowScene is never constructed here -- a fake scene
 * │                 │ is injected via the createScene constructor parameter, since
 * │                 │ constructing a real one bakes a real font atlas against a real 2D
 * │                 │ canvas, which jsdom cannot provide (font_atlas.ts's own docstring).
 * │                 │ The scene's own real behaviour is desktop_window_scene.test.ts's
 * │                 │ job, not this file's.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas_view.test
 * @file gpu_canvas_view.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GpuCanvasView } from "./gpu_canvas_view";

/** jsdom (this project's own test environment) implements neither
 * WebGPU nor `ResizeObserver`/`requestAnimationFrame` at all (checked
 * directly) -- real, standard browser APIs this test has to stand in
 * for, not gaps in `gpu_canvas_view.ts` itself. `requestAnimationFrame`
 * is stubbed to *record* its callback rather than invoke it
 * immediately: `frame()` reschedules itself every call, so an
 * eagerly-invoking stub would recurse forever synchronously -- tests
 * that need a frame to actually run pop the recorded callback and
 * call it exactly once themselves. */
let rafCallbacks: FrameRequestCallback[] = [];
let cancelledIds: number[] = [];

function fakeAdapter(requestDevice: () => Promise<unknown>) {
  return { requestDevice };
}

/** The minimal fake device `GpuCanvasView` itself still talks to
 * directly -- `requestDevice()`'s own return value, torn down via
 * `destroy()`. Nothing here needs to answer pipeline/buffer/texture
 * creation calls any more: those all belonged to the real scene,
 * which every test below replaces with `fakeScene()`. */
function fakeDevice() {
  return { destroy: vi.fn() };
}

function stubGpu(gpu: unknown): void {
  (navigator as unknown as { gpu: unknown }).gpu = gpu;
}

async function flush(): Promise<void> {
  for (let i = 0; i < 5; i++) await Promise.resolve();
}

/** `GpuCanvasView`'s own real `Logger` dependency (role/logger.ts) --
 * a plain object satisfying its `info`/`warn`/`error` shape, not a
 * real `Logger` instance (which needs a `LogSink` of its own,
 * irrelevant here): these tests only ever assert on what was logged,
 * never where a real one would route it. */
function fakeLogger() {
  return { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
}

/** A fake `DesktopWindowScene` -- `GpuCanvasView`'s own `createScene`
 * constructor parameter exists so a test can hand it one of these
 * instead of constructing the real scene (this file's own docstring
 * on why: a real one bakes a real font atlas jsdom cannot rasterise).
 * `calls` records every `(device, context, format, canvas)` tuple
 * `createScene` was actually invoked with, so a test can confirm
 * `GpuCanvasView` hands the scene factory the real, already-configured
 * device/context/canvas, not placeholders. */
function fakeScene() {
  return { renderFrame: vi.fn(), handlePointerMove: vi.fn(), handlePointerDown: vi.fn(), handlePointerUp: vi.fn(), handlePointerLeave: vi.fn(), destroy: vi.fn() };
}

function fakeContext() {
  return { configure: vi.fn(), getCurrentTexture: () => ({ createView: () => ({}) }) };
}

function stubWebgpuContext(context: ReturnType<typeof fakeContext>): void {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((id: string) => (id === "webgpu" ? (context as unknown as RenderingContext) : null));
}

describe("GpuCanvasView", () => {
  beforeEach(() => {
    rafCallbacks = [];
    cancelledIds = [];
    let nextId = 1;
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return nextId++;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      cancelledIds.push(id);
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe(): void {}
        disconnect(): void {}
      },
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null as unknown as RenderingContext);
  });

  afterEach(() => {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows an honest message when WebGPU is not supported (navigator.gpu is undefined, jsdom's own real default)", async () => {
    const logger = fakeLogger();
    const view = new GpuCanvasView(logger, () => fakeScene());
    const container = document.createElement("div");
    view.mount(container);
    await flush();
    expect(container.textContent).toContain("WebGPU is not supported");
    expect(container.querySelector("canvas")).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("WebGPU is not supported")); // logged to the Portal's own visible Event Log, not just shown in the pane
  });

  it("shows an honest message when requestAdapter() finds no real adapter", async () => {
    stubGpu({ requestAdapter: async () => null, getPreferredCanvasFormat: () => "bgra8unorm" });
    const view = new GpuCanvasView(fakeLogger(), () => fakeScene());
    const container = document.createElement("div");
    view.mount(container);
    await flush();
    expect(container.textContent).toContain("no GPU adapter is available");
  });

  it("shows an honest message when the canvas has no WebGPU context (getContext('webgpu') returns null)", async () => {
    const device = fakeDevice();
    stubGpu({
      requestAdapter: async () => fakeAdapter(async () => device),
      getPreferredCanvasFormat: () => "bgra8unorm",
    });
    const view = new GpuCanvasView(fakeLogger(), () => fakeScene());
    const container = document.createElement("div");
    view.mount(container);
    await flush();
    expect(container.textContent).toContain("has no WebGPU context");
    expect(device.destroy).toHaveBeenCalledTimes(1); // assigned to this.device before the failing check, so the catch block's destroy() actually tears it down
  });

  it("configures a real GPUCanvasContext, hands createScene the real device/context/format/canvas, and runs the render loop", async () => {
    const device = fakeDevice();
    const context = fakeContext();
    stubWebgpuContext(context);
    stubGpu({
      requestAdapter: async () => fakeAdapter(async () => device),
      getPreferredCanvasFormat: () => "bgra8unorm",
    });

    const scene = fakeScene();
    const createScene = vi.fn(() => scene);
    const view = new GpuCanvasView(fakeLogger(), createScene);
    const container = document.createElement("div");
    view.mount(container);
    await flush();

    expect(context.configure).toHaveBeenCalledWith(expect.objectContaining({ device, format: "bgra8unorm" }));
    const canvas = container.querySelector("canvas");
    expect(createScene).toHaveBeenCalledWith(device, context, "bgra8unorm", canvas);
    expect(rafCallbacks).toHaveLength(1);

    rafCallbacks.shift()!(0); // run exactly one frame
    expect(scene.renderFrame).toHaveBeenCalledTimes(1);
    expect(rafCallbacks).toHaveLength(1); // frame() rescheduled itself once, not invoked again
  });

  it("destroy() cancels the render loop, destroys the scene, and destroys the real GPUDevice", async () => {
    const device = fakeDevice();
    stubWebgpuContext(fakeContext());
    stubGpu({ requestAdapter: async () => fakeAdapter(async () => device), getPreferredCanvasFormat: () => "bgra8unorm" });
    const scene = fakeScene();

    const view = new GpuCanvasView(fakeLogger(), () => scene);
    const container = document.createElement("div");
    view.mount(container);
    await flush();

    view.destroy();
    expect(device.destroy).toHaveBeenCalledTimes(1);
    expect(cancelledIds).toHaveLength(1);
    expect(scene.destroy).toHaveBeenCalledTimes(1);
  });

  it("mount() called again (PortalShell's own re-render behaviour) tears down the previous session before starting a new one", async () => {
    const firstDevice = fakeDevice();
    const secondDevice = fakeDevice();
    stubWebgpuContext(fakeContext());

    let deviceCall = 0;
    stubGpu({
      requestAdapter: async () => fakeAdapter(async () => (deviceCall++ === 0 ? firstDevice : secondDevice)),
      getPreferredCanvasFormat: () => "bgra8unorm",
    });

    const firstScene = fakeScene();
    const secondScene = fakeScene();
    let sceneCall = 0;
    const view = new GpuCanvasView(fakeLogger(), () => (sceneCall++ === 0 ? firstScene : secondScene));
    const firstContainer = document.createElement("div");
    view.mount(firstContainer);
    await flush();
    expect(rafCallbacks).toHaveLength(1);

    const secondContainer = document.createElement("div");
    view.mount(secondContainer);
    await flush();

    expect(firstDevice.destroy).toHaveBeenCalledTimes(1); // the first session's own device, torn down
    expect(firstScene.destroy).toHaveBeenCalledTimes(1);
    expect(secondDevice.destroy).not.toHaveBeenCalled(); // the second (now current) session's own device, left running
    expect(secondScene.destroy).not.toHaveBeenCalled();
  });

  describe("pointer input forwarding (the one real 'minimal vanilla JS' this feature's own spec calls for -- capturing input only, never drawing)", () => {
    async function mountWithFakeScene(): Promise<{ canvas: HTMLCanvasElement; scene: ReturnType<typeof fakeScene> }> {
      stubWebgpuContext(fakeContext());
      stubGpu({ requestAdapter: async () => fakeAdapter(async () => fakeDevice()), getPreferredCanvasFormat: () => "bgra8unorm" });
      const scene = fakeScene();
      const view = new GpuCanvasView(fakeLogger(), () => scene);
      const container = document.createElement("div");
      view.mount(container);
      await flush();
      const canvas = container.querySelector("canvas")!;
      // A known, real backing-store size and a known, different CSS
      // box -- `toCanvasPixels()`'s own real job is converting between
      // these two, so the test has to make them genuinely differ to
      // mean anything (devicePixelRatio == 1 would make every scale
      // factor a trivial 1, hiding a real bug in that conversion).
      Object.defineProperty(canvas, "width", { value: 400, configurable: true });
      Object.defineProperty(canvas, "height", { value: 200, configurable: true });
      vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ left: 10, top: 20, width: 200, height: 100, right: 210, bottom: 120, x: 10, y: 20, toJSON: () => ({}) });
      return { canvas, scene };
    }

    it("converts a pointermove's own CSS-pixel position into the canvas's own real backing-store pixel space", async () => {
      const { canvas, scene } = await mountWithFakeScene();
      canvas.dispatchEvent(new MouseEvent("pointermove", { clientX: 110, clientY: 70 })); // 100,50 CSS-local -> scale x2/y2 (400/200, 200/100) -> 200,100
      expect(scene.handlePointerMove).toHaveBeenCalledWith(200, 100);
    });

    it("forwards pointerdown and pointerup with the same real pixel conversion", async () => {
      const { canvas, scene } = await mountWithFakeScene();
      canvas.dispatchEvent(new MouseEvent("pointerdown", { clientX: 10, clientY: 20 })); // 0,0 CSS-local -> 0,0
      expect(scene.handlePointerDown).toHaveBeenCalledWith(0, 0);
      canvas.dispatchEvent(new MouseEvent("pointerup", { clientX: 210, clientY: 120 })); // 200,100 CSS-local -> 400,200
      expect(scene.handlePointerUp).toHaveBeenCalledWith(400, 200);
    });

    it("forwards pointerleave with no coordinates at all", async () => {
      const { canvas, scene } = await mountWithFakeScene();
      canvas.dispatchEvent(new MouseEvent("pointerleave"));
      expect(scene.handlePointerLeave).toHaveBeenCalledTimes(1);
    });

    it("never forwards a pointer event arriving on a stale, now-detached canvas from a session a later mount() already superseded", async () => {
      stubWebgpuContext(fakeContext());
      let sceneCall = 0;
      const firstScene = fakeScene();
      const secondScene = fakeScene();
      stubGpu({ requestAdapter: async () => fakeAdapter(async () => fakeDevice()), getPreferredCanvasFormat: () => "bgra8unorm" });
      const view = new GpuCanvasView(fakeLogger(), () => (sceneCall++ === 0 ? firstScene : secondScene));

      const firstContainer = document.createElement("div");
      view.mount(firstContainer);
      await flush();
      const staleCanvas = firstContainer.querySelector("canvas")!; // this exact element is about to be replaced, not reused, by the next mount()

      const secondContainer = document.createElement("div");
      view.mount(secondContainer); // same view, a later session -- supersedes the first one's own sessionToken
      await flush();

      staleCanvas.dispatchEvent(new MouseEvent("pointermove", { clientX: 10, clientY: 20 }));
      expect(firstScene.handlePointerMove).not.toHaveBeenCalled(); // the stale session's own listener is still attached, but guarded off by the sessionToken check

      const liveCanvas = secondContainer.querySelector("canvas")!;
      liveCanvas.dispatchEvent(new MouseEvent("pointermove", { clientX: 10, clientY: 20 }));
      expect(secondScene.handlePointerMove).toHaveBeenCalledTimes(1); // the current session's own canvas still forwards normally
    });
  });
});
