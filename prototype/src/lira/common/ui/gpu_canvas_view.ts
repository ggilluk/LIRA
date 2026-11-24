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
 * │ Module Name     │ lira/common/ui/gpu_canvas_view
 * │ Filename        │ gpu_canvas_view.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-27
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ GpuCanvasView: the Canvas tab, hosting the WebGPU-drawn desktop
 * │                 │ window UI and reporting failures visibly through the Logger.
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas_view
 * @file gpu_canvas_view.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { createDesktopWindowScene, type DesktopWindowScene } from "./gpu_canvas/desktop_ui/desktop_window_scene";
import type { GpuCanvasContextLike, GpuDeviceLike } from "./gpu_canvas/webgpu_types";

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
 * now, not a separate copy here: `createDesktopWindowScene()` below needs
 * the *full* shape (buffers, pipelines, textures), so this file's own
 * device/context are already that same full shape by the time they're
 * handed over -- keeping a second, narrower local copy just for this
 * file's own `queue.submit`/`createCommandEncoder` calls would only
 * invite the two to drift apart. `GpuAdapterLike`/`NavigatorGpuLike`
 * stay local -- the scene itself never touches an adapter or
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

/** GpuCanvasView: a dedicated, self-contained WebGPU sandbox mounted
 * into the Portal's own "Canvas" component tab (portal_shell.ts's own
 * `ComponentId`/`COMPONENTS`) -- a real, interactive "modern OS
 * desktop window" UI (`gpu_canvas/desktop_ui/desktop_window_scene.ts`'s
 * own `DesktopWindowScene`: a title bar with working traffic-light
 * controls, a toolbar, a content area, and a status bar, every pixel
 * of it -- frosted-glass panels, soft shadows, vector icons, and text
 * alike -- drawn by WebGPU draw calls, never DOM/CSS/SVG), replacing
 * this tab's own earlier rotating cube/sphere/camera scene (now
 * unmounted, not deleted -- `gpu_canvas/scene_renderer.ts`,
 * `role/camera_capture.ts` and `role/device_orientation.ts` all still
 * exist as their own reusable modules, just no longer constructed
 * here). Meant as the starting harness for later experiments
 * converting this UI to a GPU-rendered framework, not a finished
 * feature of its own. Real GPU work end to end --
 * `requestAdapter()` -> `requestDevice()` -> a configured
 * `GPUCanvasContext` -> one real command buffer submitted every frame
 * -- not a static placeholder canvas. This file itself stays the thin
 * mount/lifecycle/error-handling/pointer-input shell; every actual GPU
 * resource (pipelines, meshes, per-element buffers) and the per-frame
 * scene update live in `gpu_canvas/desktop_ui/desktop_window_scene.ts`
 * instead, so this class's own job is still legible on its own --
 * device setup, teardown, and forwarding pointer input -- without the
 * scene's own details mixed into it. Pointer input itself is the one
 * real piece of "minimal vanilla JS" this feature's own specification
 * calls for (`pointermove`/`pointerdown`/`pointerup`/`pointerleave`
 * listeners on the canvas below, converting CSS-pixel event
 * coordinates into the real backing-store pixel space the scene's own
 * layout is computed in) -- capturing input only, never drawing
 * anything itself; every visible response (hover highlight, press
 * feedback, the window's own focus styling) is still a WebGPU draw the
 * scene makes on its own next `renderFrame()` call.
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
 * here actually goes -- WebGPU/adapter/context failures. Earlier,
 * failures like these only ever reached `console.warn()`, invisible on
 * a phone with no attached devtools; this is the real bug a live test
 * on an actual phone surfaced, back when this tab's own camera feature
 * first shipped -- every one of these now lands in the Portal's own
 * visible Event Log instead, the same place a WordNet seed run's own
 * progress already shows up. */
export class GpuCanvasView {
  private container: HTMLElement | undefined;
  private device: GpuDeviceLike | undefined;
  private scene: DesktopWindowScene | undefined;
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
    // `createDesktopWindowScene`'s own real default -- every real
    // caller gets the genuine scene. The injection point exists for
    // the same reason `createCamera`/`createOrientationSensor` used to
    // here: `createDesktopWindowScene()` bakes a real font atlas via an
    // ordinary 2D canvas (`font_atlas.ts`'s own docstring on why jsdom,
    // this project's own test environment, can never do that), so
    // `gpu_canvas_view.test.ts`'s own tests substitute a fake scene
    // entirely here -- this class's own job is mount/destroy/resize/
    // pointer-forwarding, already fully exercised without ever
    // constructing a real scene; `desktop_window_scene.test.ts` is
    // where the scene's own real behaviour is actually tested.
    private readonly createScene: (device: GpuDeviceLike, context: GpuCanvasContextLike, format: string, canvas: HTMLCanvasElement) => DesktopWindowScene = createDesktopWindowScene,
  ) {}

  mount(container: HTMLElement): void {
    this.destroy();
    this.container = container;
    const token = ++this.sessionToken;
    container.innerHTML = `<canvas class="gpu-canvas-surface"></canvas>`;
    void this.start(token);
  }

  /** Tears down whatever this instance currently owns -- cancels the
   * render loop, disconnects the resize observer, destroys every GPU
   * resource `DesktopWindowScene.destroy()` owns (every pipeline,
   * buffer, and offscreen texture the scene built), and destroys the
   * real `GPUDevice` itself, if one was ever created (every early-exit
   * path in `start()` below returns before `this.device` is ever set,
   * so this is always safe to call even when setup never got that
   * far). The scene is torn down before the device -- the device's own
   * `destroy()` would eventually invalidate the scene's own resources
   * anyway, but tearing them down explicitly first is the same "don't
   * rely on cascading teardown" discipline this file's own earlier
   * device-leak bug (this class's own design-log history) was about.
   * Called at the top of every `mount()` (this class's own docstring
   * above) and safe to call repeatedly or when nothing is running. */
  destroy(): void {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
    this.scene?.destroy();
    this.scene = undefined;
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

      // Every pipeline, the font atlas, and the offscreen blur/shadow
      // textures are all built once here, not per frame --
      // `DesktopWindowScene.renderFrame()` below only ever updates
      // uniform/vertex data and submits one command buffer per frame;
      // `desktop_ui/desktop_window_scene.ts`'s own docstring on exactly
      // what it owns and how `destroy()` tears it back down.
      this.scene = this.createScene(device, context, gpu.getPreferredCanvasFormat(), canvas);
      const scene = this.scene;

      // Converts a pointer event's own CSS-pixel position (relative to
      // the viewport, `event.clientX`/`clientY`) into the real
      // backing-store pixel space `resize()` above already sized
      // `canvas.width`/`canvas.height` to -- the same coordinate frame
      // `layout.ts`'s own `computeDesktopWindowLayout()` lays the whole
      // scene out in, so a hit-test against it has to be in that frame
      // too, not raw CSS pixels (the two only match 1:1 when
      // `devicePixelRatio` is exactly 1). `token`-guarded the same way
      // `frame()` below is -- a pointer event arriving for a now-
      // superseded session (a later `mount()` already took over) must
      // never reach a scene already mid-`destroy()`.
      const toCanvasPixels = (event: PointerEvent): readonly [number, number] => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / Math.max(1, rect.width);
        const scaleY = canvas.height / Math.max(1, rect.height);
        return [(event.clientX - rect.left) * scaleX, (event.clientY - rect.top) * scaleY];
      };
      canvas.addEventListener("pointermove", (event) => {
        if (token !== this.sessionToken) return;
        const [x, y] = toCanvasPixels(event);
        scene.handlePointerMove(x, y);
      });
      canvas.addEventListener("pointerdown", (event) => {
        if (token !== this.sessionToken) return;
        const [x, y] = toCanvasPixels(event);
        scene.handlePointerDown(x, y);
      });
      canvas.addEventListener("pointerup", (event) => {
        if (token !== this.sessionToken) return;
        const [x, y] = toCanvasPixels(event);
        scene.handlePointerUp(x, y);
      });
      canvas.addEventListener("pointerleave", () => {
        if (token !== this.sessionToken) return;
        scene.handlePointerLeave();
      });

      const frame = () => {
        if (token !== this.sessionToken) return; // destroy()/a later mount() already stopped this session
        scene.renderFrame(performance.now());
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
