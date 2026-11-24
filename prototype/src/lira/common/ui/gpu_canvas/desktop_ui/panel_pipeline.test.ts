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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/panel_pipeline.test
 * │ Filename        │ panel_pipeline.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for panel_pipeline.ts against a fake WebGPU device.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/panel_pipeline.test
 * @file panel_pipeline.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fakeDevice, stubWebGpuGlobals } from "./gpu_test_support";
import {
  createPanelPipeline,
  createPanelQuadMesh,
  createPanelResource,
  destroyPanelQuadMesh,
  destroyPanelResource,
  drawPanel,
  PANEL_MODE_GLASS,
  PANEL_MODE_SHADOW,
  PANEL_MODE_SOLID,
  PANEL_UNIFORM_FLOAT_COUNT,
  rebindPanelResource,
  writePanelUniforms,
  type PanelInstance,
} from "./panel_pipeline";

describe("panel_pipeline", () => {
  beforeEach(() => stubWebGpuGlobals());
  afterEach(() => vi.unstubAllGlobals());

  it("creates exactly one render pipeline with an alpha-blended, cullMode:none, depth-free target", () => {
    const { device } = fakeDevice();
    createPanelPipeline(device as never, "bgra8unorm");
    expect(device.createRenderPipeline).toHaveBeenCalledTimes(1);
    const descriptor = device.createRenderPipeline.mock.calls[0][0] as { fragment: { targets: { blend?: unknown }[] }; depthStencil?: unknown; primitive: { cullMode: string } };
    expect(descriptor.fragment.targets[0].blend).toBeDefined();
    expect(descriptor.depthStencil).toBeUndefined();
    expect(descriptor.primitive.cullMode).toBe("none");
  });

  it("createPanelQuadMesh uploads exactly one 4-vertex quad and one 6-index buffer, once", () => {
    const { device } = fakeDevice();
    const mesh = createPanelQuadMesh(device as never);
    expect(device.createBuffer).toHaveBeenCalledTimes(2);
    expect(device.queue.writeBuffer).toHaveBeenCalledTimes(2);
    destroyPanelQuadMesh(mesh);
    expect(mesh.vertexBuffer.destroy).toHaveBeenCalledTimes(1);
    expect(mesh.indexBuffer.destroy).toHaveBeenCalledTimes(1);
  });

  it("createPanelResource binds the uniform buffer, the shared sampler, and the shared backdrop view, in that binding order", () => {
    const { device } = fakeDevice();
    const pipeline = createPanelPipeline(device as never, "bgra8unorm");
    const sampler = { id: "sampler" };
    const backdropView = { id: "backdrop" };
    const resource = createPanelResource(device as never, pipeline, sampler as never, backdropView as never);
    const bindGroupCall = device.createBindGroup.mock.calls.at(-1)![0] as { entries: { binding: number; resource: unknown }[] };
    expect(bindGroupCall.entries[0]).toEqual({ binding: 0, resource: { buffer: resource.uniformBuffer } });
    expect(bindGroupCall.entries[1]).toEqual({ binding: 1, resource: sampler });
    expect(bindGroupCall.entries[2]).toEqual({ binding: 2, resource: backdropView });
  });

  it("rebindPanelResource replaces the bindGroup in place, against the same uniform buffer but a new backdrop view", () => {
    const { device } = fakeDevice();
    const pipeline = createPanelPipeline(device as never, "bgra8unorm");
    const sampler = { id: "sampler" };
    const oldView = { id: "old" };
    const newView = { id: "new" };
    const resource = createPanelResource(device as never, pipeline, sampler as never, oldView as never);
    const oldBindGroup = resource.bindGroup;
    rebindPanelResource(device as never, pipeline, resource, sampler as never, newView as never);
    expect(resource.bindGroup).not.toBe(oldBindGroup);
    const latestCall = device.createBindGroup.mock.calls.at(-1)![0] as { entries: { binding: number; resource: unknown }[] };
    expect(latestCall.entries[0]).toEqual({ binding: 0, resource: { buffer: resource.uniformBuffer } });
    expect(latestCall.entries[2]).toEqual({ binding: 2, resource: newView });
  });

  it("writePanelUniforms packs viewport/centre/half-extent/corner radius/mode at the documented float offsets", () => {
    const { device } = fakeDevice();
    const pipeline = createPanelPipeline(device as never, "bgra8unorm");
    const resource = createPanelResource(device as never, pipeline, {} as never, {} as never);
    device.queue.writeBuffer.mockClear();
    const instance: PanelInstance = {
      rect: { x: 10, y: 20, width: 100, height: 50 },
      cornerRadius: 12,
      mode: PANEL_MODE_GLASS,
      borderWidth: 1.5,
      shadowSoftness: 0,
      fillColor: [0.1, 0.2, 0.3, 0.4],
      borderColor: [0.5, 0.6, 0.7, 0.8],
      glassTint: [0.9, 0.8, 0.7, 0.25],
    };
    writePanelUniforms(device as never, resource, 1000, 700, instance);
    expect(device.queue.writeBuffer).toHaveBeenCalledTimes(1);
    const written = device.queue.writeBuffer.mock.calls[0][2] as Float32Array;
    expect(written).toHaveLength(PANEL_UNIFORM_FLOAT_COUNT);
    expect([...written.slice(0, 4)]).toEqual([1000, 700, 60, 45]); // viewport, then rect's own true centre (10+50, 20+25)
    expect([...written.slice(4, 8)]).toEqual([50, 25, 12, PANEL_MODE_GLASS]); // half-extent, cornerRadius, mode
    expect(written[8]).toBeCloseTo(1.5, 10); // borderWidth
    // Float32Array itself rounds every value to f32 precision, so the
    // expected side has to go through the same rounding -- comparing
    // directly against the original f64 literals is what actually
    // failed here first.
    expect([...written.slice(12, 16)]).toEqual([...new Float32Array(instance.fillColor)]);
    expect([...written.slice(16, 20)]).toEqual([...new Float32Array(instance.borderColor)]);
    expect([...written.slice(20, 24)]).toEqual([...new Float32Array(instance.glassTint)]);
  });

  it("drawPanel sets the pipeline, this panel's own bindGroup, the shared quad buffers, and draws 6 indices", () => {
    const { device, passes } = fakeDevice();
    const pipeline = createPanelPipeline(device as never, "bgra8unorm");
    const mesh = createPanelQuadMesh(device as never);
    const resource = createPanelResource(device as never, pipeline, {} as never, {} as never);
    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({});
    drawPanel(pass as never, pipeline, mesh, resource);
    expect(passes.at(-1)!.setPipeline).toHaveBeenCalledWith(pipeline);
    expect(passes.at(-1)!.setBindGroup).toHaveBeenCalledWith(0, resource.bindGroup);
    expect(passes.at(-1)!.drawIndexed).toHaveBeenCalledWith(6);
  });

  it("destroyPanelResource tears down only the uniform buffer, never the shared quad mesh", () => {
    const { device } = fakeDevice();
    const pipeline = createPanelPipeline(device as never, "bgra8unorm");
    const resource = createPanelResource(device as never, pipeline, {} as never, {} as never);
    destroyPanelResource(resource);
    expect(resource.uniformBuffer.destroy).toHaveBeenCalledTimes(1);
  });

  it("PANEL_MODE_SOLID/GLASS/SHADOW are distinct numeric constants", () => {
    expect(new Set([PANEL_MODE_SOLID, PANEL_MODE_GLASS, PANEL_MODE_SHADOW]).size).toBe(3);
  });
});
