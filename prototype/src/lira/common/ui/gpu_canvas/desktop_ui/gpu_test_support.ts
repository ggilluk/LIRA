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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/gpu_test_support
 * │ Filename        │ gpu_test_support.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Shared fake-WebGPU-device test harness for every *.test.ts in
 * │                 │ this folder -- not itself a test file (no *.test.ts suffix, so
 * │                 │ Vitest never collects it as one).
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/gpu_test_support
 * @file gpu_test_support.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { vi } from "vitest";

/** `scene_renderer.test.ts`'s own `fakeDevice()`/`fakeContext()`/
 * `fakeCanvas()`/`stubWebGpuGlobals()` harness, generalised for this
 * folder's own needs -- six separate pipelines (`panel_pipeline.ts`,
 * `backdrop.ts`'s wallpaper and blur passes, `icons.ts`, `text_pipeline.ts`)
 * each need the same fake device, so this is the one copy they all
 * import rather than six near-identical copies drifting apart. The one
 * real difference from `scene_renderer.test.ts`'s own version:
 * `beginRenderPass()` returns a *fresh* pass spy every call, collected
 * into `passes`, not one shared object reused across calls -- this
 * folder's own renderers draw multiple real passes in a single frame
 * (`backdrop.ts`'s own wallpaper pass, then its horizontal and vertical
 * blur passes, then the main window-frame pass), and a test asserting
 * "the blur pass drew exactly one full-screen triangle" needs to tell
 * that pass's own calls apart from the main pass's. */
export function fakeDevice() {
  const createdBuffers: { destroy: ReturnType<typeof vi.fn> }[] = [];
  const createdTextures: { descriptor: unknown; createView: ReturnType<typeof vi.fn>; destroy: ReturnType<typeof vi.fn> }[] = [];
  const passes: {
    setPipeline: ReturnType<typeof vi.fn>;
    setBindGroup: ReturnType<typeof vi.fn>;
    setVertexBuffer: ReturnType<typeof vi.fn>;
    setIndexBuffer: ReturnType<typeof vi.fn>;
    draw: ReturnType<typeof vi.fn>;
    drawIndexed: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  }[] = [];

  function makePass() {
    const pass = {
      setPipeline: vi.fn(),
      setBindGroup: vi.fn(),
      setVertexBuffer: vi.fn(),
      setIndexBuffer: vi.fn(),
      draw: vi.fn(),
      drawIndexed: vi.fn(),
      end: vi.fn(),
    };
    passes.push(pass);
    return pass;
  }

  const device = {
    queue: { submit: vi.fn(), writeBuffer: vi.fn(), copyExternalImageToTexture: vi.fn(), writeTexture: vi.fn() },
    createCommandEncoder: () => ({
      beginRenderPass: (_descriptor: unknown) => makePass(),
      finish: () => ({}),
    }),
    createBuffer: vi.fn((_descriptor: unknown) => {
      const buffer = { destroy: vi.fn() };
      createdBuffers.push(buffer);
      return buffer;
    }),
    createTexture: vi.fn((descriptor: unknown) => {
      const texture = { descriptor, createView: vi.fn(() => ({})), destroy: vi.fn() };
      createdTextures.push(texture);
      return texture;
    }),
    createSampler: vi.fn((_descriptor: unknown) => ({})),
    createShaderModule: vi.fn((_descriptor: unknown) => ({})),
    createRenderPipeline: vi.fn((_descriptor: unknown) => ({ getBindGroupLayout: (_index: number) => ({}) })),
    createBindGroup: vi.fn((_descriptor: unknown) => ({})),
    destroy: vi.fn(),
  };
  return { device, createdBuffers, createdTextures, passes };
}

export function fakeContext() {
  return { configure: vi.fn(), getCurrentTexture: () => ({ createView: () => ({}) }) };
}

export function fakeCanvas(width = 300, height = 150): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/** The same real, WebGPU-browser-only runtime globals
 * `webgpu_types.ts`'s own `gpuUsageFlags()` reads off `globalThis` --
 * jsdom (this project's own test environment) never defines them,
 * `scene_renderer.test.ts`'s own docstring on why every test touching
 * buffer/texture creation has to stub them in first. */
export function stubWebGpuGlobals(): void {
  vi.stubGlobal("GPUBufferUsage", { VERTEX: 1, INDEX: 2, UNIFORM: 4, COPY_DST: 8 });
  vi.stubGlobal("GPUTextureUsage", { RENDER_ATTACHMENT: 1, TEXTURE_BINDING: 2, COPY_DST: 4 });
}
