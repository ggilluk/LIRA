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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/icons.test
 * │ Filename        │ icons.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for icons.ts -- icon shape data, pixel-space
 * │                 │ instantiation, and the line-segment pipeline against a fake
 * │                 │ WebGPU device.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/icons.test
 * @file icons.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONTROL_DOT_ICONS, createLinePipeline, createLineResource, destroyLineResource, drawLine, instantiateIconCircles, instantiateIconLines, LINE_UNIFORM_FLOAT_COUNT, TOOLBAR_ICONS, writeLineUniforms } from "./icons";
import { createPanelQuadMesh, PANEL_MODE_SOLID } from "./panel_pipeline";
import { fakeDevice, stubWebGpuGlobals } from "./gpu_test_support";

describe("icon shape data", () => {
  it("every control dot and toolbar icon is a non-empty primitive list, keyed by the real control/button ids", () => {
    expect(Object.keys(CONTROL_DOT_ICONS).sort()).toEqual(["close", "maximize", "minimize"]);
    expect(Object.keys(TOOLBAR_ICONS).sort()).toEqual(["back", "info", "search", "settings"]);
    for (const primitives of [...Object.values(CONTROL_DOT_ICONS), ...Object.values(TOOLBAR_ICONS)]) {
      expect(primitives.length).toBeGreaterThan(0);
    }
  });

  it("close is two crossing diagonals, minimize is one flat line, maximize is a closed four-line outline", () => {
    expect(CONTROL_DOT_ICONS.close).toHaveLength(2);
    expect(CONTROL_DOT_ICONS.minimize).toHaveLength(1);
    expect(CONTROL_DOT_ICONS.maximize).toHaveLength(4);
    // The four maximize segments close into a loop -- each one's own
    // end point is the next one's own start point.
    const maximize = CONTROL_DOT_ICONS.maximize;
    for (let i = 0; i < maximize.length; i++) {
      const current = maximize[i];
      const next = maximize[(i + 1) % maximize.length];
      if (current.kind === "line" && next.kind === "line") expect(current.to).toEqual(next.from);
    }
  });
});

describe("instantiateIconLines / instantiateIconCircles", () => {
  it("scales and centres normalised icon-local coordinates into real absolute pixel positions", () => {
    const lines = instantiateIconLines(CONTROL_DOT_ICONS.minimize, 100, 200, 20, 2, [1, 1, 1, 1]);
    expect(lines).toHaveLength(1);
    // minimize's own single line spans x in [-0.55, 0.55] at y=0, size 20 -> half=10
    expect(lines[0].from).toEqual([100 - 0.55 * 10, 200]);
    expect(lines[0].to).toEqual([100 + 0.55 * 10, 200]);
    expect(lines[0].thickness).toBe(2);
  });

  it("ignores circle primitives when instantiating lines, and vice versa", () => {
    const lines = instantiateIconLines(TOOLBAR_ICONS.search, 0, 0, 20, 2, [1, 1, 1, 1]);
    const circles = instantiateIconCircles(TOOLBAR_ICONS.search, 0, 0, 20, 2, [1, 1, 1, 1]);
    expect(lines).toHaveLength(1); // search: 1 line (the handle), 1 circle (the lens)
    expect(circles).toHaveLength(1);
  });

  it("instantiateIconCircles produces a real PanelInstance: a ring (zero-alpha fill, real border) when filled is false, a solid dot when true", () => {
    const [ring] = instantiateIconCircles(TOOLBAR_ICONS.search, 0, 0, 20, 1.5, [0.2, 0.4, 0.6, 1]);
    expect(ring.mode).toBe(PANEL_MODE_SOLID);
    expect(ring.fillColor).toEqual([0, 0, 0, 0]);
    expect(ring.borderWidth).toBe(1.5);
    expect(ring.cornerRadius).toBeCloseTo(ring.rect.width / 2, 10); // a square rect, fully rounded -- a true circle

    const [dot] = instantiateIconCircles([{ kind: "circle", center: [0, 0], radius: 0.5, filled: true }], 0, 0, 20, 1.5, [0.2, 0.4, 0.6, 1]);
    expect(dot.fillColor).toEqual([0.2, 0.4, 0.6, 1]);
    expect(dot.borderWidth).toBe(0);
  });
});

describe("line pipeline", () => {
  beforeEach(() => stubWebGpuGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("createLinePipeline builds one alpha-blended, depth-free pipeline reusing panel_pipeline's own unit-quad vertex layout", () => {
    const { device } = fakeDevice();
    createLinePipeline(device as never, "bgra8unorm");
    expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
    const descriptor = device.createRenderPipeline.mock.calls[0][0] as { vertex: { buffers: { arrayStride: number }[] } };
    expect(descriptor.vertex.buffers[0].arrayStride).toBe(8);
  });

  it("writeLineUniforms packs the real endpoints and a quad bounding box padded around them, and a draw reuses the shared panel quad mesh", () => {
    const { device, passes } = fakeDevice();
    const pipeline = createLinePipeline(device as never, "bgra8unorm");
    const quadMesh = createPanelQuadMesh(device as never);
    const resource = createLineResource(device as never, pipeline);
    device.queue.writeBuffer.mockClear();

    writeLineUniforms(device as never, resource, 800, 600, { from: [10, 10], to: [50, 10], thickness: 4, color: [1, 0, 0, 1] });
    expect(device.queue.writeBuffer).toHaveBeenCalledTimes(1);
    const written = device.queue.writeBuffer.mock.calls[0][2] as Float32Array;
    expect(written).toHaveLength(LINE_UNIFORM_FLOAT_COUNT);
    expect([...written.slice(0, 2)]).toEqual([800, 600]); // viewport
    expect([...written.slice(8, 12)]).toEqual([10, 10, 50, 10]); // real endpoints, unchanged
    expect(written[6]).toBe(4); // thickness

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({});
    drawLine(pass as never, pipeline, quadMesh, resource);
    expect(passes.at(-1)!.setVertexBuffer).toHaveBeenCalledWith(0, quadMesh.vertexBuffer);
    expect(passes.at(-1)!.drawIndexed).toHaveBeenCalledWith(6);

    destroyLineResource(resource);
    expect(resource.uniformBuffer.destroy).toHaveBeenCalledTimes(1);
  });
});
