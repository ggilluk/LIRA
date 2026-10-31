import { createSceneRenderer, type SceneRenderer } from "./gpu_canvas/scene_renderer";
import type { GpuCanvasContextLike, GpuDeviceLike } from "./gpu_canvas/webgpu_types";
import { CameraCapture } from "../data/camera_capture";
import { DeviceOrientationSensor } from "../data/device_orientation";

/** The narrow view this file needs of a real `Logger` (`role/logger.ts`)
 * -- `info`/`warn`/`error` only, the same "structural interface over
 * the real class" call `console_commands/types.ts`'s own
 * `MetricsProvider` already made. A real `Logger` instance satisfies
 * this (its own three methods are public), but `Logger` itself has
 * private fields a plain test double can't replicate -- typing this
 * parameter as `Logger` directly would make `gpu_canvas_view.test.ts`'s
 * own `fakeLogger()` a type error for no real benefit, since nothing
 * here ever needs `Logger`'s own `source`/`sink`. */
interface LoggerLike {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/** TypeScript's own bundled `lib.dom.d.ts` declares no WebGPU types at
 * all (confirmed directly, `console_commands/gpu.ts`'s own docstring),
 * and no `@webgpu/types` dependency exists in this project -- the same
 * narrow local type shim that file already uses. `GpuDeviceLike`/
 * `GpuCanvasContextLike` themselves come from `gpu_canvas/webgpu_types.ts`
 * now, not a separate copy here: `createSceneRenderer()` below needs
 * the *full* shape (buffers, pipelines, textures), so this file's own
 * device/context are already that same full shape by the time they're
 * handed over -- keeping a second, narrower local copy just for this
 * file's own `queue.submit`/`createCommandEncoder` calls would only
 * invite the two to drift apart. `GpuAdapterLike`/`NavigatorGpuLike`
 * stay local -- `scene_renderer.ts` never touches an adapter or
 * `navigator` at all, only the device/context this file hands it once
 * setup already succeeded. */
interface GpuAdapterLike {
  requestDevice(): Promise<GpuDeviceLike>;
}

interface NavigatorGpuLike {
  requestAdapter(): Promise<GpuAdapterLike | null>;
  getPreferredCanvasFormat(): string;
}

function gpuOf(nav: Navigator): NavigatorGpuLike | undefined {
  return (nav as Navigator & { gpu?: NavigatorGpuLike }).gpu;
}

/** `HTMLCanvasElement.getContext()`'s own overloads (lib.dom.d.ts) only
 * know about `"2d"`/`"webgl"`/`"webgl2"`/`"bitmaprenderer"` -- `"webgpu"`
 * is a real, standard context id no current TS lib declares, so this
 * is the one cast this file needs beyond `gpuOf()`'s own. */
function webgpuContextOf(canvas: HTMLCanvasElement): GpuCanvasContextLike | null {
  return (canvas as HTMLCanvasElement & { getContext(id: "webgpu"): GpuCanvasContextLike | null }).getContext("webgpu");
}

/** The narrow view `start()` below actually needs of a `CameraCapture`
 * -- `scene_renderer.ts`'s own `CameraSource` plus the two lifecycle
 * methods this file itself calls. `createCamera`'s own default
 * (`() => new CameraCapture()`) is what every real caller gets; the
 * injection point exists so a test can substitute a fake one without
 * constructing a real `<video>` element and triggering jsdom's own
 * real inability to decode media (`camera_capture.test.ts`'s own
 * docstring on the same gap, one layer down). */
interface CameraCaptureLike {
  start(): Promise<void>;
  stop(): void;
  readonly element: unknown;
  readonly isReady: boolean;
  readonly width: number;
  readonly height: number;
}

/** `CameraCaptureLike`'s own exact counterpart for a
 * `DeviceOrientationSensor` -- `createOrientationSensor`'s own default
 * (`() => new DeviceOrientationSensor()`) is what every real caller
 * gets; the injection point exists for the same reason `createCamera`'s
 * own does (this file's own docstring on it). */
interface DeviceOrientationSensorLike {
  start(): Promise<void>;
  stop(): void;
  readonly orientation: { alpha: number; beta: number; gamma: number } | undefined;
}

/** GpuCanvasView: a dedicated, self-contained WebGPU sandbox mounted
 * into the Portal's own "Canvas" component tab (portal_shell.ts's own
 * `ComponentId`/`COMPONENTS`) -- a live scene of rotating, bouncing
 * cubes and spheres (`gpu_canvas/scene_renderer.ts`'s own real
 * `SceneRenderer`), plus -- once a real camera becomes available -- a
 * live camera feed textured onto one more cube in that same scene
 * (`common/data/camera_capture.ts`'s own `CameraCapture`), pinned at
 * the centre and, once a real device-orientation reading becomes
 * available too (`common/data/device_orientation.ts`'s own
 * `DeviceOrientationSensor`), tilting to match the phone's own real
 * orientation instead of spinning on its own. Meant as the starting
 * harness for later experiments converting this UI to a GPU-rendered
 * framework, not a finished feature of its own. Real GPU work end to
 * end --
 * `requestAdapter()` -> `requestDevice()` -> a configured
 * `GPUCanvasContext` -> one real, depth-tested command buffer
 * submitted every frame -- not a static placeholder canvas. This file
 * itself stays the thin mount/lifecycle/error-handling shell; every
 * actual GPU resource (pipeline, meshes, per-entity buffers) and the
 * per-frame scene update live in `gpu_canvas/scene_renderer.ts`
 * instead, so this class's own job is still legible on its own --
 * device setup and teardown -- without the scene's own details mixed
 * into it.
 *
 * Self-contained the same way `ConsoleView`/`ServiceStatusView` are
 * (their own docstrings), but unlike either, `mount()` can be called
 * again against a brand-new container for the *same* still-running
 * session: `PortalShell.render()` tears down and rebuilds its whole
 * `.portal-view` subtree via `innerHTML` on every call, including
 * while the Canvas tab is already selected (e.g. a WordNet seed run
 * finishing in the background fires a full `render()` regardless of
 * which component tab is active). A real `GPUDevice` and
 * `requestAnimationFrame` loop are actual live resources that keep
 * running against a now-detached canvas if nothing stops them, so
 * `mount()` always `destroy()`s whatever session it already owns
 * before starting a new one -- not merely idempotent, actively
 * self-healing against `PortalShell`'s own re-mount behaviour.
 *
 * `logger` (`role/logger.ts`'s own `Logger`, the same one every other
 * named Service already logs through) is where every real outcome
 * here actually goes -- WebGPU/adapter/context failures, and every
 * camera outcome (requesting access, becoming ready, or failing for
 * any reason). Earlier, camera failures only ever reached
 * `console.warn()`, invisible on a phone with no attached devtools;
 * this is the real bug a live test on an actual phone surfaced (this
 * class's own `start()` docstring on the texture bug that same test
 * also caught) -- every one of these now lands in the Portal's own
 * visible Event Log instead, the same place a WordNet seed run's own
 * progress already shows up. */
export class GpuCanvasView {
  private container: HTMLElement | undefined;
  private device: GpuDeviceLike | undefined;
  private renderer: SceneRenderer | undefined;
  private cameraCapture: CameraCaptureLike | undefined;
  private orientationSensor: DeviceOrientationSensorLike | undefined;
  private animationFrame: number | undefined;
  private resizeObserver: ResizeObserver | undefined;
  /** Bumped by every `mount()` call -- `start()`'s own guard against a
   * slower, now-superseded setup (still awaiting `requestAdapter()`/
   * `requestDevice()`) finishing after a *later* `mount()` already
   * took over, the same `renderToken` pattern `PortalShell.loadView()`
   * uses for its own async race. */
  private sessionToken = 0;

  constructor(
    private readonly logger: LoggerLike,
    private readonly createCamera: () => CameraCaptureLike = () => new CameraCapture(),
    private readonly createOrientationSensor: () => DeviceOrientationSensorLike = () => new DeviceOrientationSensor(),
  ) {}

  mount(container: HTMLElement): void {
    this.destroy();
    this.container = container;
    const token = ++this.sessionToken;
    container.innerHTML = `<canvas class="gpu-canvas-surface"></canvas>`;
    void this.start(token);
  }

  /** Tears down whatever this instance currently owns -- cancels the
   * render loop, disconnects the resize observer, stops the real
   * camera hardware (`CameraCapture.stop()`'s own docstring on why
   * that's an actual, necessary step, not just dropping a reference),
   * destroys every GPU resource `SceneRenderer.destroy()` owns
   * (meshes, per-entity buffers, the depth texture, and the camera
   * cube's own texture/buffers if one was ever attached), and destroys
   * the real `GPUDevice` itself, if one was ever created (every
   * early-exit path in `start()` below returns before `this.device` is
   * ever set, so this is always safe to call even when setup never got
   * that far). Camera first (releasing real hardware ahead of
   * anything else is the more time-sensitive teardown -- a camera's
   * own recording indicator staying lit a moment longer than it needs
   * to is a real, visible user-facing wrongness, nothing else here
   * is), then the renderer, then the device -- the device's own
   * `destroy()` would eventually invalidate the renderer's own
   * resources anyway, but tearing them down explicitly first is the
   * same "don't rely on cascading teardown" call
   * `SceneRenderer.destroy()`'s own docstring makes. The orientation
   * sensor's own `stop()` has no real hardware to release (its own
   * docstring), but is stopped alongside the camera regardless -- a
   * torn-down session should leave no listener of its own attached to
   * `window`. Called at the top of every `mount()` (this class's own
   * docstring above) and safe to call repeatedly or when nothing is
   * running. */
  destroy(): void {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.cameraCapture?.stop();
    this.cameraCapture = undefined;
    this.orientationSensor?.stop();
    this.orientationSensor = undefined;
    this.renderer?.destroy();
    this.renderer = undefined;
    this.device?.destroy();
    this.device = undefined;
  }

  /** Unsupported browsers and adapter-less sandboxes are real, common
   * outcomes (confirmed live even in this project's own headless
   * Chromium -- `console_commands/gpu.ts`'s own design-log entry on
   * why), reported as an honest message in the pane rather than a
   * silently blank or fabricated canvas -- thrown as real `Error`s and
   * caught in one place below, the same "throw for a genuine failure"
   * convention `ConsoleCommand.run()` already uses. */
  private async start(token: number): Promise<void> {
    const container = this.container;
    if (!container) return;
    try {
      const gpu = gpuOf(navigator);
      if (!gpu) throw new Error("WebGPU is not supported in this browser (navigator.gpu is undefined).");

      const adapter = await gpu.requestAdapter();
      if (token !== this.sessionToken) return; // superseded by a later mount() while this awaited
      if (!adapter) throw new Error("WebGPU is supported, but no GPU adapter is available (requestAdapter() returned null).");

      const device = await adapter.requestDevice();
      if (token !== this.sessionToken) {
        device.destroy();
        return;
      }

      // Assigned before the context check below, not after: once this
      // is set, a thrown Error reaches the catch block's own
      // `this.destroy()` call and actually destroys this real device
      // rather than leaking it -- a device created successfully but
      // never assigned here would never be torn down by anything.
      this.device = device;

      const canvas = container.querySelector<HTMLCanvasElement>(".gpu-canvas-surface");
      const context = canvas ? webgpuContextOf(canvas) : null;
      if (!canvas || !context) throw new Error("This browser's canvas element has no WebGPU context.");

      context.configure({ device, format: gpu.getPreferredCanvasFormat() });

      const resize = () => {
        const ratio = window.devicePixelRatio || 1;
        canvas.width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
        canvas.height = Math.max(1, Math.floor(canvas.clientHeight * ratio));
      };
      this.resizeObserver = new ResizeObserver(resize);
      this.resizeObserver.observe(canvas);
      resize();

      // Pipeline, meshes, entities, and the depth texture are all
      // built once here, not per frame -- `SceneRenderer.renderFrame()`
      // below only ever updates per-entity uniform data and submits
      // one command buffer; `gpu_canvas/scene_renderer.ts`'s own
      // docstring on exactly what it owns and how `destroy()` tears it
      // back down.
      this.renderer = createSceneRenderer(device, context, gpu.getPreferredCanvasFormat(), canvas);
      const renderer = this.renderer;

      // Started here, but never awaited before the scene itself starts
      // rendering below -- a camera permission prompt can take an
      // arbitrary amount of time (or never resolve, if the user simply
      // never answers it), and whether a camera is ever available at
      // all is genuinely optional: the cube/sphere scene has to keep
      // running regardless. `CameraCapture.start()`'s own docstring on
      // why every failure here (no hardware, denied permission, an
      // unsupported browser) is an entirely ordinary outcome, not a
      // reason to blank the whole Canvas tab the way an adapter/device
      // failure does -- logged (via `this.logger`, the Portal's own
      // visible Event Log, not `console.warn()` -- this class's own
      // docstring on why that matters), not surfaced in the pane
      // itself, since there is nowhere honest to put a persistent
      // "camera denied" notice without implying the rest of the
      // already-working scene is broken too.
      this.logger.info("Requesting camera access…");
      const camera = this.createCamera();
      this.cameraCapture = camera;
      camera
        .start()
        .then(() => {
          if (token !== this.sessionToken) return;
          renderer.attachCamera(camera);
          this.logger.info(`Camera ready (${camera.width}x${camera.height}) -- textured onto one cube in the scene.`);
        })
        .catch((error: unknown) => {
          if (token !== this.sessionToken) return;
          this.logger.warn(`Camera unavailable: ${error instanceof Error ? error.message : String(error)}`);
        });

      // Independent of the camera above -- a separate real permission
      // (iOS Safari's own `requestPermission()`, `device_orientation.ts`'s
      // own docstring) that resolves or fails on its own schedule, with
      // its own entirely ordinary failure modes (unsupported browser,
      // denied permission). Until (and unless) it ever resolves, the
      // camera cube keeps its own existing auto-rotation fallback
      // (`scene_renderer.ts`'s own `renderFrame()`); there is nothing
      // here for this to block on.
      this.logger.info("Requesting device orientation access…");
      const orientationSensor = this.createOrientationSensor();
      this.orientationSensor = orientationSensor;
      orientationSensor
        .start()
        .then(() => {
          if (token !== this.sessionToken) return;
          renderer.attachOrientation(orientationSensor);
          this.logger.info("Device orientation ready -- the camera cube now tilts to match the phone's own real orientation.");
        })
        .catch((error: unknown) => {
          if (token !== this.sessionToken) return;
          this.logger.warn(`Device orientation unavailable: ${error instanceof Error ? error.message : String(error)}`);
        });

      const frame = () => {
        if (token !== this.sessionToken) return; // destroy()/a later mount() already stopped this session
        renderer.renderFrame(performance.now());
        this.animationFrame = requestAnimationFrame(frame);
      };
      this.animationFrame = requestAnimationFrame(frame);
    } catch (error) {
      if (token !== this.sessionToken || !this.container) return;
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(message);
      this.destroy();
      this.container.innerHTML = `<div class="portal-view-empty">${escapeHtml(message)}</div>`;
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
