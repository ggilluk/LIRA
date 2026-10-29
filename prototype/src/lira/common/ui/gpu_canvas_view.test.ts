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

/** `GpuCanvasView`'s own render loop now runs `scene_renderer.ts`'s
 * real `createSceneRenderer()`, not a flat clear-colour pass -- this
 * fake has to answer every resource-creation call that setup makes
 * (buffers, a texture, a shader module, a pipeline, bind groups), not
 * just the two calls `GpuCanvasView` itself still makes directly
 * (`createCommandEncoder`/`queue.submit`). Every created resource is
 * minimal but real enough to round-trip through `scene_renderer.ts`'s
 * own code without type or logic errors -- `createBuffer()`/
 * `createTexture()` return objects with their own `destroy()` spy, so
 * `destroy()` tests here are still meaningful. */
function fakeDevice() {
  return {
    queue: { submit: vi.fn(), writeBuffer: vi.fn(), copyExternalImageToTexture: vi.fn() },
    createCommandEncoder: () => ({
      beginRenderPass: () => ({
        setPipeline: vi.fn(),
        setBindGroup: vi.fn(),
        setVertexBuffer: vi.fn(),
        setIndexBuffer: vi.fn(),
        drawIndexed: vi.fn(),
        end: vi.fn(),
      }),
      finish: () => ({}),
    }),
    createBuffer: vi.fn(() => ({ destroy: vi.fn() })),
    createTexture: vi.fn(() => ({ createView: () => ({}), destroy: vi.fn() })),
    createSampler: vi.fn(() => ({})),
    createShaderModule: vi.fn(() => ({})),
    createRenderPipeline: vi.fn(() => ({ getBindGroupLayout: () => ({}) })),
    createBindGroup: vi.fn(() => ({})),
    destroy: vi.fn(),
  };
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

/** A fake `CameraCapture`-shaped object -- `GpuCanvasView`'s own
 * `createCamera` constructor parameter exists so tests can hand it
 * one of these instead of constructing a real `CameraCapture`
 * (`camera_capture.ts`'s own docstring on why that would need a real
 * `<video>` element jsdom cannot actually play). `start` defaults to
 * an immediately-resolving no-op -- most tests below care about the
 * WebGPU/scene path, not the camera one, so a camera that "succeeds"
 * doing nothing is the least surprising default; the dedicated camera
 * tests override every field that matters to them explicitly. */
function fakeCameraCapture(overrides: Partial<{ start: () => Promise<void>; stop: () => void; isReady: boolean; width: number; height: number }> = {}) {
  return {
    start: overrides.start ?? vi.fn(async () => {}),
    stop: overrides.stop ?? vi.fn(),
    element: {},
    isReady: overrides.isReady ?? true,
    width: overrides.width ?? 640,
    height: overrides.height ?? 480,
  };
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
    // `scene_renderer.ts`'s own `gpuUsageFlags()` reads these off
    // `globalThis` as real runtime constants in a WebGPU-supporting
    // browser -- jsdom implements no WebGPU at all, so they don't
    // exist here either; the actual numeric values don't matter to
    // any assertion below, only that each flag name resolves to
    // *something* `createBuffer`/`createTexture`'s own fake calls can
    // receive.
    vi.stubGlobal("GPUBufferUsage", { VERTEX: 1, INDEX: 2, UNIFORM: 4, COPY_DST: 8 });
    vi.stubGlobal("GPUTextureUsage", { RENDER_ATTACHMENT: 1, TEXTURE_BINDING: 2, COPY_DST: 4 });
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(() => null as unknown as RenderingContext);
  });

  afterEach(() => {
    delete (navigator as unknown as { gpu?: unknown }).gpu;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("shows an honest message when WebGPU is not supported (navigator.gpu is undefined, jsdom's own real default)", async () => {
    const logger = fakeLogger();
    const view = new GpuCanvasView(logger, () => fakeCameraCapture());
    const container = document.createElement("div");
    view.mount(container);
    await flush();
    expect(container.textContent).toContain("WebGPU is not supported");
    expect(container.querySelector("canvas")).toBeNull();
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("WebGPU is not supported")); // logged to the Portal's own visible Event Log, not just shown in the pane
  });

  it("shows an honest message when requestAdapter() finds no real adapter", async () => {
    stubGpu({ requestAdapter: async () => null, getPreferredCanvasFormat: () => "bgra8unorm" });
    const view = new GpuCanvasView(fakeLogger(), () => fakeCameraCapture());
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
    const view = new GpuCanvasView(fakeLogger(), () => fakeCameraCapture());
    const container = document.createElement("div");
    view.mount(container);
    await flush();
    expect(container.textContent).toContain("has no WebGPU context");
    expect(device.destroy).toHaveBeenCalledTimes(1); // assigned to this.device before the failing check, so the catch block's destroy() actually tears it down
  });

  it("configures a real GPUCanvasContext and submits one real command buffer per frame", async () => {
    const device = fakeDevice();
    const context = { configure: vi.fn(), getCurrentTexture: () => ({ createView: () => ({}) }) };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((id: string) => (id === "webgpu" ? (context as unknown as RenderingContext) : null));
    stubGpu({
      requestAdapter: async () => fakeAdapter(async () => device),
      getPreferredCanvasFormat: () => "bgra8unorm",
    });

    const view = new GpuCanvasView(fakeLogger(), () => fakeCameraCapture());
    const container = document.createElement("div");
    view.mount(container);
    await flush();

    expect(context.configure).toHaveBeenCalledWith(expect.objectContaining({ device, format: "bgra8unorm" }));
    expect(rafCallbacks).toHaveLength(1);

    rafCallbacks.shift()!(0); // run exactly one frame
    expect(device.queue.submit).toHaveBeenCalledTimes(1);
    expect(rafCallbacks).toHaveLength(1); // frame() rescheduled itself once, not invoked again
  });

  it("destroy() cancels the render loop, stops the camera, and destroys the real GPUDevice", async () => {
    const device = fakeDevice();
    const context = { configure: vi.fn(), getCurrentTexture: () => ({ createView: () => ({}) }) };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((id: string) => (id === "webgpu" ? (context as unknown as RenderingContext) : null));
    stubGpu({
      requestAdapter: async () => fakeAdapter(async () => device),
      getPreferredCanvasFormat: () => "bgra8unorm",
    });
    const camera = fakeCameraCapture();

    const view = new GpuCanvasView(fakeLogger(), () => camera);
    const container = document.createElement("div");
    view.mount(container);
    await flush();

    view.destroy();
    expect(device.destroy).toHaveBeenCalledTimes(1);
    expect(cancelledIds).toHaveLength(1);
    expect(camera.stop).toHaveBeenCalledTimes(1); // the real camera hardware, released -- not just dropped
  });

  it("mount() called again (PortalShell's own re-render behaviour) tears down the previous session before starting a new one", async () => {
    const firstDevice = fakeDevice();
    const secondDevice = fakeDevice();
    const context = { configure: vi.fn(), getCurrentTexture: () => ({ createView: () => ({}) }) };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((id: string) => (id === "webgpu" ? (context as unknown as RenderingContext) : null));

    let deviceCall = 0;
    stubGpu({
      requestAdapter: async () => fakeAdapter(async () => (deviceCall++ === 0 ? firstDevice : secondDevice)),
      getPreferredCanvasFormat: () => "bgra8unorm",
    });

    const view = new GpuCanvasView(fakeLogger(), () => fakeCameraCapture());
    const firstContainer = document.createElement("div");
    view.mount(firstContainer);
    await flush();
    expect(rafCallbacks).toHaveLength(1);

    const secondContainer = document.createElement("div");
    view.mount(secondContainer);
    await flush();

    expect(firstDevice.destroy).toHaveBeenCalledTimes(1); // the first session's own device, torn down
    expect(secondDevice.destroy).not.toHaveBeenCalled(); // the second (now current) session's own device, left running
  });

  describe("camera logging (the Portal's own visible Event Log, not console.warn -- this class's own docstring on why that bug mattered)", () => {
    function mountWithRealScene(logger: ReturnType<typeof fakeLogger>, camera: ReturnType<typeof fakeCameraCapture>) {
      const device = fakeDevice();
      const context = { configure: vi.fn(), getCurrentTexture: () => ({ createView: () => ({}) }) };
      vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation((id: string) => (id === "webgpu" ? (context as unknown as RenderingContext) : null));
      stubGpu({ requestAdapter: async () => fakeAdapter(async () => device), getPreferredCanvasFormat: () => "bgra8unorm" });
      const view = new GpuCanvasView(logger, () => camera);
      const container = document.createElement("div");
      view.mount(container);
      return container;
    }

    it("logs an info message with the real dimensions once the camera becomes ready", async () => {
      const logger = fakeLogger();
      const camera = fakeCameraCapture({ width: 1280, height: 720 });
      mountWithRealScene(logger, camera);
      await flush();
      expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("1280x720"));
    });

    it("logs a warn message with the real failure reason when the camera is unavailable, without touching the pane", async () => {
      const logger = fakeLogger();
      const camera = fakeCameraCapture({
        start: vi.fn(async () => {
          throw new Error("Permission denied");
        }),
      });
      const container = mountWithRealScene(logger, camera);
      await flush();
      expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining("Permission denied"));
      expect(container.textContent).not.toContain("Permission denied"); // the scene itself keeps rendering -- GpuCanvasView's own start() docstring on why a camera failure never blanks the pane
    });
  });
});
