import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSceneRenderer } from "./scene_renderer";

/** `gpu_canvas_view.test.ts`'s own docstring on why jsdom needs
 * `GPUBufferUsage`/`GPUTextureUsage` stubbed -- the same real,
 * WebGPU-browser-only runtime globals `scene_renderer.ts`'s own
 * `gpuUsageFlags()` reads. */
function stubWebGpuGlobals(): void {
  vi.stubGlobal("GPUBufferUsage", { VERTEX: 1, INDEX: 2, UNIFORM: 4, COPY_DST: 8 });
  vi.stubGlobal("GPUTextureUsage", { RENDER_ATTACHMENT: 1 });
}

function fakeDevice() {
  const createdBuffers: { destroy: ReturnType<typeof vi.fn> }[] = [];
  const createdTextures: { destroy: ReturnType<typeof vi.fn> }[] = [];
  const device = {
    queue: { submit: vi.fn(), writeBuffer: vi.fn() },
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
    createBuffer: vi.fn(() => {
      const buffer = { destroy: vi.fn() };
      createdBuffers.push(buffer);
      return buffer;
    }),
    createTexture: vi.fn(() => {
      const texture = { createView: () => ({}), destroy: vi.fn() };
      createdTextures.push(texture);
      return texture;
    }),
    createShaderModule: vi.fn(() => ({})),
    createRenderPipeline: vi.fn(() => ({ getBindGroupLayout: () => ({}) })),
    createBindGroup: vi.fn(() => ({})),
    destroy: vi.fn(),
  };
  return { device, createdBuffers, createdTextures };
}

function fakeContext() {
  return { configure: vi.fn(), getCurrentTexture: () => ({ createView: () => ({}) }) };
}

function fakeCanvas(width = 300, height = 150): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

describe("createSceneRenderer", () => {
  beforeEach(() => {
    stubWebGpuGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds one shared pipeline and both meshes' own buffers once, at creation, not per frame", () => {
    const { device } = fakeDevice();
    createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
    expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
    // cube vertex+index, sphere vertex+index == 4 static mesh buffers,
    // plus one uniform buffer per entity (16 cubes+spheres, CUBE_COUNT
    // + SPHERE_COUNT in scene_renderer.ts) == 20 createBuffer() calls
    // total at setup.
    expect(device.createBuffer).toHaveBeenCalledTimes(4 + 16);
  });

  it("renderFrame() submits exactly one command buffer and writes one uniform buffer per entity", () => {
    const { device } = fakeDevice();
    const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
    device.queue.writeBuffer.mockClear(); // drop the 4 static mesh-upload writes createSceneRenderer() itself already made, at setup
    renderer.renderFrame(0);
    expect(device.queue.submit).toHaveBeenCalledTimes(1);
    expect(device.queue.writeBuffer).toHaveBeenCalledTimes(16); // one per entity, this frame only
  });

  it("creates exactly one depth texture per distinct canvas size, reusing it across frames at a stable size", () => {
    const { device } = fakeDevice();
    const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
    renderer.renderFrame(0);
    renderer.renderFrame(16);
    renderer.renderFrame(32);
    expect(device.createTexture).toHaveBeenCalledTimes(1);
  });

  it("recreates (and destroys the old) depth texture when the canvas is resized between frames", () => {
    const { device, createdTextures } = fakeDevice();
    const canvas = fakeCanvas(300, 150);
    const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", canvas);
    renderer.renderFrame(0);
    canvas.width = 600;
    canvas.height = 300;
    renderer.renderFrame(16);
    expect(device.createTexture).toHaveBeenCalledTimes(2);
    expect(createdTextures[0].destroy).toHaveBeenCalledTimes(1);
  });

  it("destroy() tears down the depth texture, both meshes' own buffers, and every entity's own uniform buffer", () => {
    const { device, createdBuffers, createdTextures } = fakeDevice();
    const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
    renderer.renderFrame(0); // creates the depth texture
    renderer.destroy();
    expect(createdTextures[0].destroy).toHaveBeenCalledTimes(1);
    for (const buffer of createdBuffers) expect(buffer.destroy).toHaveBeenCalledTimes(1);
  });
});
