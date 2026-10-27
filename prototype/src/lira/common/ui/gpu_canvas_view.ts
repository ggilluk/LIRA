/** TypeScript's own bundled `lib.dom.d.ts` declares no WebGPU types at
 * all (confirmed directly, `console_commands/gpu.ts`'s own docstring),
 * and no `@webgpu/types` dependency exists in this project -- the same
 * narrow local type shim that file already uses, kept deliberately
 * separate rather than shared: this view reads `GPUDevice`/
 * `GPUCanvasContext`, `gpu.ts` reads `GPUAdapter.limits`/`.features`,
 * and neither shape is complete enough to be worth promoting into a
 * common module for one overlapping field (`requestAdapter`). */
interface GpuAdapterLike {
  requestDevice(): Promise<GpuDeviceLike>;
}

interface GpuDeviceLike {
  readonly queue: { submit(buffers: readonly unknown[]): void };
  createCommandEncoder(): GpuCommandEncoderLike;
  destroy(): void;
}

interface GpuCommandEncoderLike {
  beginRenderPass(descriptor: unknown): { end(): void };
  finish(): unknown;
}

interface GpuCanvasContextLike {
  configure(config: unknown): void;
  getCurrentTexture(): { createView(): unknown };
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
 * `ComponentId`/`COMPONENTS`) -- a blank canvas with nothing drawn
 * into it but a real, continuously-submitted clear-colour render pass,
 * meant as the starting harness for later experiments converting this
 * UI to a GPU-rendered framework, not a finished feature of its own.
 * Real GPU work end to end -- `requestAdapter()` -> `requestDevice()`
 * -> a configured `GPUCanvasContext` -> one real command buffer
 * submitted every frame -- not a static placeholder canvas.
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
 * self-healing against `PortalShell`'s own re-mount behaviour. */
export class GpuCanvasView {
  private container: HTMLElement | undefined;
  private device: GpuDeviceLike | undefined;
  private animationFrame: number | undefined;
  private resizeObserver: ResizeObserver | undefined;
  /** Bumped by every `mount()` call -- `start()`'s own guard against a
   * slower, now-superseded setup (still awaiting `requestAdapter()`/
   * `requestDevice()`) finishing after a *later* `mount()` already
   * took over, the same `renderToken` pattern `PortalShell.loadView()`
   * uses for its own async race. */
  private sessionToken = 0;

  mount(container: HTMLElement): void {
    this.destroy();
    this.container = container;
    const token = ++this.sessionToken;
    container.innerHTML = `<canvas class="gpu-canvas-surface"></canvas>`;
    void this.start(token);
  }

  /** Tears down whatever this instance currently owns -- cancels the
   * render loop, disconnects the resize observer, and destroys the
   * real `GPUDevice`, if one was ever created (every early-exit path
   * in `start()` below returns before `this.device` is ever set, so
   * this is always safe to call even when setup never got that far).
   * Called at the top of every `mount()` (this class's own docstring
   * above) and safe to call repeatedly or when nothing is running. */
  destroy(): void {
    if (this.animationFrame !== undefined) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = undefined;
    }
    this.resizeObserver?.disconnect();
    this.resizeObserver = undefined;
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

      const startedAt = performance.now();
      const frame = () => {
        if (token !== this.sessionToken) return; // destroy()/a later mount() already stopped this session
        const t = (performance.now() - startedAt) / 1000;
        const encoder = device.createCommandEncoder();
        const pass = encoder.beginRenderPass({
          colorAttachments: [
            {
              view: context.getCurrentTexture().createView(),
              clearValue: { r: 0.08 + 0.05 * Math.sin(t), g: 0.14, b: 0.16 + 0.05 * Math.cos(t), a: 1 },
              loadOp: "clear",
              storeOp: "store",
            },
          ],
        });
        pass.end();
        device.queue.submit([encoder.finish()]);
        this.animationFrame = requestAnimationFrame(frame);
      };
      this.animationFrame = requestAnimationFrame(frame);
    } catch (error) {
      if (token !== this.sessionToken || !this.container) return;
      this.destroy();
      this.container.innerHTML = `<div class="portal-view-empty">${escapeHtml(error instanceof Error ? error.message : String(error))}</div>`;
    }
  }
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
