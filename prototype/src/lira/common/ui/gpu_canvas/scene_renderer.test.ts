import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { deviceOrientationToRotation, multiply, type Mat4 } from "./mat4";
import { computeBounds, createSceneRenderer } from "./scene_renderer";

/** `renderFrame()`'s own real write order: every `entityResources`
 * uniform first, the camera cube's own uniform last (`scene_renderer.ts`'s
 * own code, unchanged by this file) -- so once a camera is attached,
 * the *last* `device.queue.writeBuffer()` call of any given frame is
 * always the camera's own `cameraUniformScratch`. Unlike the sixteen
 * solid entities' own uniform, the camera's own layout carries only
 * `modelViewProj` (`shader.ts`'s own `CAMERA_UNIFORM_FLOAT_COUNT`,
 * 16 floats, not 36 -- the camera cube is unlit, so there's no
 * separate `model` field for a normal transform to need); this
 * captures that whole, real `modelViewProj`, not a sub-slice of it. */
function captureCameraMvp(device: ReturnType<typeof fakeDevice>["device"], renderer: ReturnType<typeof createSceneRenderer>, nowMs: number): Mat4 {
  device.queue.writeBuffer.mockClear();
  renderer.renderFrame(nowMs);
  return (device.queue.writeBuffer.mock.calls.at(-1)![2] as Float32Array).slice(0, 16) as unknown as Mat4;
}

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

describe("computeBounds", () => {
  it("is symmetric around the origin on every axis, at any aspect ratio", () => {
    for (const aspect of [0.5, 1, 1.78, 3]) {
      const bounds = computeBounds(aspect);
      expect(bounds.min[0]).toBe(-bounds.max[0]);
      expect(bounds.min[1]).toBe(-bounds.max[1]);
      expect(bounds.min[2]).toBe(-bounds.max[2]);
    }
  });

  it("scales width linearly with aspect ratio while height (and z) stay fixed", () => {
    const narrow = computeBounds(1);
    const wide = computeBounds(2);
    expect(wide.max[0]).toBeCloseTo(narrow.max[0] * 2, 10);
    expect(wide.max[1]).toBeCloseTo(narrow.max[1], 10);
    expect(wide.max[2]).toBeCloseTo(narrow.max[2], 10);
  });

  it("is noticeably larger than the old fixed +/-2.5 half-height -- the real regression this fix exists to guard: a real phone showed every entity clustered in a small, fixed central patch regardless of the real canvas size", () => {
    const bounds = computeBounds(1);
    expect(bounds.max[1]).toBeGreaterThan(3);
  });

  it("stays well clear of the frustum's own true edge at the closest z an entity can reach -- a safety margin, not an exact fit, so no cube visibly clips mid-bounce", () => {
    const aspect = 1.5;
    const bounds = computeBounds(aspect);
    const cameraEyeZ = 10;
    const nearDistance = cameraEyeZ - bounds.max[2]; // the true closest approach to the camera
    const trueHalfHeightAtNear = nearDistance * Math.tan(((55 * Math.PI) / 180) / 2);
    expect(bounds.max[1]).toBeLessThan(trueHalfHeightAtNear);
  });
});

describe("the camera cube's own position and rotation", () => {
  beforeEach(() => {
    stubWebGpuGlobals();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("never changes its own written transform across frames while orientation stays fixed -- the only way that can hold is if position never drifts (no bounce physics for this entity)", () => {
    const { device } = fakeDevice();
    const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
    renderer.attachCamera(fakeCamera() as never);
    renderer.attachOrientation({ orientation: { alpha: 12, beta: 34, gamma: -56 } });

    const first = Array.from(captureCameraMvp(device, renderer, 0));
    const later = Array.from(captureCameraMvp(device, renderer, 5000)); // five full seconds later

    expect(later).toEqual(first);
  });

  it("falls back to its own auto-rotation (a visibly changing transform over time) when no orientation is ever attached", () => {
    const { device } = fakeDevice();
    const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
    renderer.attachCamera(fakeCamera() as never);

    const first = Array.from(captureCameraMvp(device, renderer, 0));
    const later = Array.from(captureCameraMvp(device, renderer, 500));

    expect(later).not.toEqual(first);
  });

  it("rotates to exactly match a real device-orientation reading, with nothing else folded in unexpectedly", () => {
    const { device } = fakeDevice();
    const renderer = createSceneRenderer(device as never, fakeContext() as never, "bgra8unorm", fakeCanvas());
    renderer.attachCamera(fakeCamera() as never);

    // deviceOrientationToRotation(0,0,0) is the identity (mat4.test.ts's
    // own check on that) -- so with the camera cube's own translation
    // fixed at the origin and scale fixed at 1, the written
    // modelViewProj for this one reading *is* the camera's own real
    // view-projection matrix, recovered here without needing to export
    // CAMERA_EYE/TARGET/UP/FOV_Y_RADIANS just for this test to read.
    renderer.attachOrientation({ orientation: { alpha: 0, beta: 0, gamma: 0 } });
    const viewProjection = captureCameraMvp(device, renderer, 0);

    renderer.attachOrientation({ orientation: { alpha: 37, beta: -42, gamma: 15 } });
    const mvp = captureCameraMvp(device, renderer, 16);

    const expectedRotation = deviceOrientationToRotation(37, -42, 15);
    const expectedMvp = multiply(viewProjection, expectedRotation);
    for (let i = 0; i < 16; i++) expect(mvp[i]).toBeCloseTo(expectedMvp[i], 4);
  });
});
