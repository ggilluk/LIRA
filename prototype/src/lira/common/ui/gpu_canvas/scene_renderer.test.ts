import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSceneRenderer } from "./scene_renderer";

/** `gpu_canvas_view.test.ts`'s own docstring on why jsdom needs
 * `GPUBufferUsage`/`GPUTextureUsage` stubbed -- the same real,
 * WebGPU-browser-only runtime globals `scene_renderer.ts`'s own
 * `gpuUsageFlags()` reads. */
function stubWebGpuGlobals(): void {
  vi.stubGlobal("GPUBufferUsage", { VERTEX: 1, INDEX: 2, UNIFORM: 4, COPY_DST: 8 });
  vi.stubGlobal("GPUTextureUsage", { RENDER_ATTACHMENT: 1, TEXTURE_BINDING: 2, COPY_DST: 4 });
}

function fakeDevice() {
  const createdBuffers: { destroy: ReturnType<typeof vi.fn> }[] = [];
  const createdTextures: { destroy: ReturnType<typeof vi.fn> }[] = [];
  // One shared render-pass spy object, reused across every
  // `beginRenderPass()` call (every `renderFrame()` makes a fresh
  // `GPUCommandEncoder`, same as a real device would) -- so a test can
  // inspect `pass.drawIndexed`'s own call count across one or more
  // `renderFrame()` calls, not just within a single one it can't
  // otherwise reach the return value of.
  const pass = {
    setPipeline: vi.fn(),
    setBindGroup: vi.fn(),
    setVertexBuffer: vi.fn(),
    setIndexBuffer: vi.fn(),
    drawIndexed: vi.fn(),
    end: vi.fn(),
  };
  const device = {
    queue: { submit: vi.fn(), writeBuffer: vi.fn(), copyExternalImageToTexture: vi.fn() },
    createCommandEncoder: () => ({
      beginRenderPass: () => pass,
      finish: () => ({}),
    }),
    createBuffer: vi.fn(() => {
      const buffer = { destroy: vi.fn() };
      createdBuffers.push(buffer);
      return buffer;
    }),
    createTexture: vi.fn((_descriptor: { usage: number }) => {
      const texture = { createView: () => ({}), destroy: vi.fn() };
      createdTextures.push(texture);
      return texture;
    }),
    createSampler: vi.fn(() => ({})),
    createShaderModule: vi.fn(() => ({})),
    createRenderPipeline: vi.fn(() => ({ getBindGroupLayout: () => ({}) })),
    createBindGroup: vi.fn(() => ({})),
    destroy: vi.fn(),
  };
  return { device, createdBuffers, createdTextures, pass };
}

function fakeCamera(overrides: Partial<{ element: unknown; isReady: boolean; width: number; height: number }> = {}) {
  return { element: {}, isReady: true, width: 640, height: 480, ...overrides };
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

  describe("attachCamera", () => {
    it("creates one additional pipeline, sampler, texture, mesh buffers, and uniform buffer, at attach time", () => {
      const { device } = fakeDevice();
      const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
      device.createRenderPipeline.mockClear();
      device.createBuffer.mockClear();
      device.createTexture.mockClear();
      renderer.attachCamera(fakeCamera() as never);
      expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
      expect(device.createSampler).toHaveBeenCalledTimes(1);
      expect(device.createTexture).toHaveBeenCalledTimes(1); // the camera texture itself, not the (not yet created) depth texture
      expect(device.createBuffer).toHaveBeenCalledTimes(3); // the camera cube's own vertex + index buffers, plus its uniform buffer
    });

    it("creates the camera texture with RENDER_ATTACHMENT usage -- the real spec requirement copyExternalImageToTexture() needs, missing which silently left the cube black on a real device (confirmed on a real phone; WebGPU validation errors from a missing usage flag are never thrown as a catchable JS exception, this renderer's own docstring on why)", () => {
      const { device } = fakeDevice();
      const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
      device.createTexture.mockClear();
      renderer.attachCamera(fakeCamera() as never);
      const [[descriptor]] = device.createTexture.mock.calls;
      // RENDER_ATTACHMENT=1, TEXTURE_BINDING=2, COPY_DST=4 (this file's
      // own stubWebGpuGlobals()) -- all three bits set, bitwise OR'd.
      expect(descriptor.usage & 1).toBe(1);
      expect(descriptor.usage & 2).toBe(2);
      expect(descriptor.usage & 4).toBe(4);
    });

    it("is a no-op when called a second time -- this renderer's own docstring on why there's never more than one camera cube", () => {
      const { device } = fakeDevice();
      const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
      renderer.attachCamera(fakeCamera() as never);
      device.createRenderPipeline.mockClear();
      renderer.attachCamera(fakeCamera() as never);
      expect(device.createRenderPipeline).not.toHaveBeenCalled();
    });

    it("renderFrame() copies a fresh video frame into the texture and draws one extra entity, while the camera is ready", () => {
      const { device, pass } = fakeDevice();
      const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
      renderer.attachCamera(fakeCamera() as never);
      pass.drawIndexed.mockClear();
      renderer.renderFrame(0);
      expect(device.queue.copyExternalImageToTexture).toHaveBeenCalledTimes(1);
      expect(pass.drawIndexed).toHaveBeenCalledTimes(8 + 8 + 1); // CUBE_COUNT + SPHERE_COUNT + the camera cube
    });

    it("skips the texture copy when the camera isn't ready yet, without failing to draw the rest of the scene", () => {
      const { device } = fakeDevice();
      const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
      renderer.attachCamera(fakeCamera({ isReady: false }) as never);
      expect(() => renderer.renderFrame(0)).not.toThrow();
      expect(device.queue.copyExternalImageToTexture).not.toHaveBeenCalled();
    });

    it("destroy() tears down the camera's own texture and buffers too, alongside everything else", () => {
      const { device, createdBuffers, createdTextures } = fakeDevice();
      const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
      renderer.attachCamera(fakeCamera() as never);
      renderer.renderFrame(0); // also creates the depth texture
      renderer.destroy();
      for (const buffer of createdBuffers) expect(buffer.destroy).toHaveBeenCalledTimes(1);
      for (const texture of createdTextures) expect(texture.destroy).toHaveBeenCalledTimes(1);
    });
  });
});
