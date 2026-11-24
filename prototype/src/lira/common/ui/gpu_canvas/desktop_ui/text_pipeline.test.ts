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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/text_pipeline.test
 * │ Filename        │ text_pipeline.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for text_pipeline.ts against a fake WebGPU device and
 * │                 │ a small hand-built FontAtlas.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/text_pipeline.test
 * @file text_pipeline.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { FontAtlas } from "./font_atlas";
import { fakeDevice, stubWebGpuGlobals } from "./gpu_test_support";
import { createTextPipelineBundle, createTextResource, destroyTextPipelineBundle, destroyTextResource, drawText, writeTextQuads } from "./text_pipeline";

function fakeAtlas(): FontAtlas {
  return {
    width: 100,
    height: 50,
    pixels: new Uint8ClampedArray(100 * 50 * 4),
    fontPixelSize: 20,
    glyphs: new Map([
      ["A", { u0: 0, v0: 0, u1: 0.1, v1: 0.2, width: 10, height: 20, advance: 10 }],
      [" ", { u0: 0.5, v0: 0, u1: 0.55, v1: 0.2, width: 5, height: 20, advance: 5 }],
    ]),
  };
}

describe("text_pipeline", () => {
  beforeEach(() => stubWebGpuGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("createTextPipelineBundle builds one pipeline, uploads the atlas bitmap once via writeTexture, and destroys the texture on teardown", () => {
    const { device } = fakeDevice();
    const atlas = fakeAtlas();
    const bundle = createTextPipelineBundle(device as never, "bgra8unorm", atlas);
    expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
    expect(device.queue.writeTexture).toHaveBeenCalledTimes(1);
    expect(device.queue.writeTexture.mock.calls[0][1]).toBe(atlas.pixels);
    destroyTextPipelineBundle(bundle);
    expect(bundle.atlasTexture.destroy).toHaveBeenCalledTimes(1);
  });

  it("createTextResource allocates a uniform buffer, a capacity-sized vertex buffer, and binds uniform+sampler+atlas view in that order", () => {
    const { device } = fakeDevice();
    const bundle = createTextPipelineBundle(device as never, "bgra8unorm", fakeAtlas());
    const resource = createTextResource(device as never, bundle);
    expect(resource.vertexCount).toBe(0);
    const bindGroupCall = device.createBindGroup.mock.calls.at(-1)![0] as { entries: { binding: number; resource: unknown }[] };
    expect(bindGroupCall.entries[0]).toEqual({ binding: 0, resource: { buffer: resource.uniformBuffer } });
    expect(bindGroupCall.entries[1]).toEqual({ binding: 1, resource: bundle.sampler });
    expect(bindGroupCall.entries[2]).toEqual({ binding: 2, resource: bundle.atlasView });
  });

  it("writeTextQuads emits 6 vertices per real glyph, scaled from the baked fontPixelSize to the requested on-screen pixelHeight", () => {
    const { device } = fakeDevice();
    const atlas = fakeAtlas();
    const bundle = createTextPipelineBundle(device as never, "bgra8unorm", atlas);
    const resource = createTextResource(device as never, bundle);
    device.queue.writeBuffer.mockClear();

    writeTextQuads(device as never, resource, atlas, "A", 10, 20, 10, [1, 1, 1, 1], 800, 600); // pixelHeight 10 == half the baked 20px size
    expect(resource.vertexCount).toBe(6);
    const vertexWrite = device.queue.writeBuffer.mock.calls.find((call) => call[0] === resource.vertexBuffer)!;
    const data = vertexWrite[2] as Float32Array;
    expect(data).toHaveLength(6 * 4);
    // First vertex: top-left of the glyph quad, at the real (x,y) origin, scale 0.5 -> width 5, height 10.
    expect([data[0], data[1]]).toEqual([10, 20]);
    // Second vertex: top-right, x advanced by the scaled glyph width (10*0.5=5).
    expect([data[4], data[5]]).toEqual([15, 20]);
    // Third vertex: bottom-right, y advanced by the scaled glyph height (20*0.5=10).
    expect([data[8], data[9]]).toEqual([15, 30]);
    // uv at the first vertex matches the glyph's own u0/v0.
    expect([data[2], data[3]]).toEqual([0, 0]);
  });

  it("skips a character missing from the atlas without emitting a quad, but still advances the cursor using the space glyph's own width", () => {
    const { device } = fakeDevice();
    const atlas = fakeAtlas();
    const bundle = createTextPipelineBundle(device as never, "bgra8unorm", atlas);
    const resource = createTextResource(device as never, bundle);

    writeTextQuads(device as never, resource, atlas, "AXA", 0, 0, 20, [1, 1, 1, 1], 800, 600); // "X" isn't in the fake atlas
    expect(resource.vertexCount).toBe(2 * 6); // only the two real "A" glyphs produced quads
  });

  it("writeTextQuads packs the real viewport and colour into the uniform buffer", () => {
    const { device } = fakeDevice();
    const atlas = fakeAtlas();
    const bundle = createTextPipelineBundle(device as never, "bgra8unorm", atlas);
    const resource = createTextResource(device as never, bundle);
    device.queue.writeBuffer.mockClear();

    writeTextQuads(device as never, resource, atlas, "A", 0, 0, 20, [0.2, 0.4, 0.6, 0.8], 1000, 700);
    const uniformWrite = device.queue.writeBuffer.mock.calls.find((call) => call[0] === resource.uniformBuffer)!;
    const data = uniformWrite[2] as Float32Array;
    expect([...data.slice(0, 2)]).toEqual([1000, 700]);
    expect([...new Float32Array(data.slice(4, 8))]).toEqual([...new Float32Array([0.2, 0.4, 0.6, 0.8])]);
  });

  it("drawText is a no-op (never touches the pass) when nothing has been written yet, and draws the real vertex count once something has", () => {
    const { device, passes } = fakeDevice();
    const atlas = fakeAtlas();
    const bundle = createTextPipelineBundle(device as never, "bgra8unorm", atlas);
    const resource = createTextResource(device as never, bundle);
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({});

    drawText(pass as never, bundle.pipeline, resource);
    expect(passes.at(-1)!.setPipeline).not.toHaveBeenCalled();

    writeTextQuads(device as never, resource, atlas, "AA", 0, 0, 20, [1, 1, 1, 1], 800, 600);
    drawText(pass as never, bundle.pipeline, resource);
    expect(passes.at(-1)!.setPipeline).toHaveBeenCalledWith(bundle.pipeline);
    expect(passes.at(-1)!.draw).toHaveBeenCalledWith(12);
  });

  it("destroyTextResource tears down both its own buffers", () => {
    const { device } = fakeDevice();
    const bundle = createTextPipelineBundle(device as never, "bgra8unorm", fakeAtlas());
    const resource = createTextResource(device as never, bundle);
    destroyTextResource(resource);
    expect(resource.uniformBuffer.destroy).toHaveBeenCalledTimes(1);
    expect(resource.vertexBuffer.destroy).toHaveBeenCalledTimes(1);
  });
});
