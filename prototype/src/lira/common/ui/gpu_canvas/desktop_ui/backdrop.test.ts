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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/backdrop.test
 * │ Filename        │ backdrop.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for backdrop.ts's own wallpaper + two-pass blur
 * │                 │ pipeline, against a fake WebGPU device.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/backdrop.test
 * @file backdrop.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  backdropResolution,
  createBackdropPipelines,
  createBackdropResources,
  createBackdropTextures,
  destroyBackdropResources,
  destroyBackdropTextures,
  drawBackdrop,
  rebindBackdropResources,
  writeBackdropUniforms,
} from "./backdrop";
import { fakeDevice, stubWebGpuGlobals } from "./gpu_test_support";

describe("backdropResolution", () => {
  it("halves both dimensions, rounded, clamped to at least 1x1", () => {
    expect(backdropResolution(800, 600)).toEqual({ width: 400, height: 300 });
    expect(backdropResolution(1, 1)).toEqual({ width: 1, height: 1 });
  });
});

describe("backdrop", () => {
  beforeEach(() => stubWebGpuGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("createBackdropPipelines builds exactly two render pipelines (wallpaper, blur)", () => {
    const { device } = fakeDevice();
    createBackdropPipelines(device as never, "bgra8unorm");
    expect(device.createRenderPipeline).toHaveBeenCalledTimes(2);
  });

  it("createBackdropTextures creates three same-size, half-resolution textures with RENDER_ATTACHMENT|TEXTURE_BINDING usage", () => {
    const { device, createdTextures } = fakeDevice();
    const textures = createBackdropTextures(device as never, "bgra8unorm", 800, 600);
    expect(textures.width).toBe(400);
    expect(textures.height).toBe(300);
    expect(createdTextures).toHaveLength(3);
    for (const texture of createdTextures) {
      const descriptor = texture.descriptor as { size: number[]; usage: number };
      expect(descriptor.size).toEqual([400, 300]);
      expect(descriptor.usage).toBe(1 | 2); // RENDER_ATTACHMENT | TEXTURE_BINDING, per stubWebGpuGlobals()
    }
  });

  it("createBackdropResources wires the horizontal blur pass to sample the wallpaper texture, and the vertical pass to sample the intermediate texture", () => {
    const { device } = fakeDevice();
    const pipelines = createBackdropPipelines(device as never, "bgra8unorm");
    const textures = createBackdropTextures(device as never, "bgra8unorm", 800, 600);
    const sampler = { id: "sampler" };
    createBackdropResources(device as never, pipelines, textures, sampler as never);
    const bindGroupCalls = device.createBindGroup.mock.calls as [{ entries: { binding: number; resource: unknown }[] }][];
    // wallpaperBindGroup (1 entry), then blurHorizontal (3 entries, sampling wallpaperView), then blurVertical (3 entries, sampling intermediateView)
    expect(bindGroupCalls[0][0].entries).toHaveLength(1);
    expect(bindGroupCalls[1][0].entries[2]).toEqual({ binding: 2, resource: textures.wallpaperView });
    expect(bindGroupCalls[2][0].entries[2]).toEqual({ binding: 2, resource: textures.intermediateView });
  });

  it("rebindBackdropResources replaces only the two blur bind groups, against a new textures set, leaving the wallpaper bind group untouched", () => {
    const { device } = fakeDevice();
    const pipelines = createBackdropPipelines(device as never, "bgra8unorm");
    const textures = createBackdropTextures(device as never, "bgra8unorm", 800, 600);
    const sampler = { id: "sampler" };
    const resources = createBackdropResources(device as never, pipelines, textures, sampler as never);
    const originalWallpaperBindGroup = resources.wallpaperBindGroup;

    const newTextures = createBackdropTextures(device as never, "bgra8unorm", 1600, 1200);
    rebindBackdropResources(device as never, pipelines, resources, newTextures, sampler as never);

    expect(resources.wallpaperBindGroup).toBe(originalWallpaperBindGroup);
    const latestCalls = device.createBindGroup.mock.calls.slice(-2) as [{ entries: { binding: number; resource: unknown }[] }][];
    expect(latestCalls[0][0].entries[2]).toEqual({ binding: 2, resource: newTextures.wallpaperView });
    expect(latestCalls[1][0].entries[2]).toEqual({ binding: 2, resource: newTextures.intermediateView });
  });

  it("writeBackdropUniforms writes the real time/aspect into the wallpaper uniform, and opposite (1,0)/(0,1) directions into the two blur uniforms", () => {
    const { device } = fakeDevice();
    const pipelines = createBackdropPipelines(device as never, "bgra8unorm");
    const textures = createBackdropTextures(device as never, "bgra8unorm", 800, 400); // aspect 2:1 once halved (400x200)
    const sampler = {};
    const resources = createBackdropResources(device as never, pipelines, textures, sampler as never);
    device.queue.writeBuffer.mockClear();

    writeBackdropUniforms(device as never, resources, textures, 12.5);

    expect(device.queue.writeBuffer).toHaveBeenCalledTimes(3);
    const [wallpaperCall, horizontalCall, verticalCall] = device.queue.writeBuffer.mock.calls as [unknown, number, Float32Array][];
    expect([...(wallpaperCall[2] as Float32Array)].slice(0, 2)).toEqual([12.5, 2]); // time, aspect (400/200 == 2)
    expect([...(horizontalCall[2] as Float32Array)].slice(2, 4)).toEqual([1, 0]); // horizontal direction
    expect([...(verticalCall[2] as Float32Array)].slice(2, 4)).toEqual([0, 1]); // vertical direction
  });

  it("drawBackdrop issues exactly three passes, in wallpaper -> horizontal blur -> vertical blur order, each drawing one full-screen triangle", () => {
    const { device, passes } = fakeDevice();
    const pipelines = createBackdropPipelines(device as never, "bgra8unorm");
    const textures = createBackdropTextures(device as never, "bgra8unorm", 800, 600);
    const resources = createBackdropResources(device as never, pipelines, textures, {} as never);
    const encoder = device.createCommandEncoder();

    drawBackdrop(encoder as never, pipelines, textures, resources);

    expect(passes).toHaveLength(3);
    expect(passes[0].setPipeline).toHaveBeenCalledWith(pipelines.wallpaperPipeline);
    expect(passes[0].setBindGroup).toHaveBeenCalledWith(0, resources.wallpaperBindGroup);
    expect(passes[1].setPipeline).toHaveBeenCalledWith(pipelines.blurPipeline);
    expect(passes[1].setBindGroup).toHaveBeenCalledWith(0, resources.blurHorizontalBindGroup);
    expect(passes[2].setBindGroup).toHaveBeenCalledWith(0, resources.blurVerticalBindGroup);
    for (const pass of passes) {
      expect(pass.draw).toHaveBeenCalledWith(3);
      expect(pass.end).toHaveBeenCalledTimes(1);
    }
  });

  it("destroyBackdropTextures / destroyBackdropResources tear down every texture and uniform buffer this module created", () => {
    const { device } = fakeDevice();
    const pipelines = createBackdropPipelines(device as never, "bgra8unorm");
    const textures = createBackdropTextures(device as never, "bgra8unorm", 800, 600);
    const resources = createBackdropResources(device as never, pipelines, textures, {} as never);

    destroyBackdropTextures(textures);
    expect(textures.wallpaperTexture.destroy).toHaveBeenCalledTimes(1);
    expect(textures.intermediateTexture.destroy).toHaveBeenCalledTimes(1);
    expect(textures.finalTexture.destroy).toHaveBeenCalledTimes(1);

    destroyBackdropResources(resources);
    expect(resources.wallpaperUniformBuffer.destroy).toHaveBeenCalledTimes(1);
    expect(resources.blurHorizontalUniformBuffer.destroy).toHaveBeenCalledTimes(1);
    expect(resources.blurVerticalUniformBuffer.destroy).toHaveBeenCalledTimes(1);
  });
});
