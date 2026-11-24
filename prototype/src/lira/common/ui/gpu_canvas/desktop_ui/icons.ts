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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/icons
 * │ Filename        │ icons.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Crisp, resolution-independent toolbar/control icons drawn as GPU
 * │                 │ vector primitives (capsule-SDF line segments and circles) instead
 * │                 │ of a loaded or embedded SVG/bitmap asset.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/icons
 * @file icons.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import type { ControlDotId, ToolbarButtonId } from "./layout";
import { PANEL_MODE_SOLID, type PanelInstance, type Rgba } from "./panel_pipeline";
import { gpuUsageFlags, type GpuBindGroupLike, type GpuBufferLike, type GpuDeviceLike, type GpuRenderPassEncoderLike, type GpuRenderPipelineLike } from "../webgpu_types";
import type { PanelQuadMesh } from "./panel_pipeline";

/** This project's own "no external asset or framework dependencies"
 * constraint (this feature's own specification) rules out an embedded
 * SVG path or a loaded bitmap glyph -- every icon below is instead a
 * short list of primitives in a normalised [-1,1] icon-local box, each
 * drawn as a real GPU shape: a `"line"` is a capsule (a thick line
 * segment with rounded ends, `LINE_SHADER_WGSL`'s own `sdCapsule()`
 * below), a `"circle"` is a `PanelInstance` (`panel_pipeline.ts`'s own
 * rounded-rect SDF degenerates to an exact circle at `radius ===
 * halfWidth === halfHeight`, `layout.ts`'s own docstring on the same
 * fact) -- `filled: false` draws it as a ring (zero-alpha fill, a real
 * border), `filled: true` as a solid dot. Vector shapes stay crisp at
 * any size or canvas resolution the same way a real SVG icon would,
 * without needing one. */
export type IconVec2 = readonly [number, number];

export type IconPrimitive = { readonly kind: "line"; readonly from: IconVec2; readonly to: IconVec2 } | { readonly kind: "circle"; readonly center: IconVec2; readonly radius: number; readonly filled: boolean };

/** The window frame's own three traffic-light glyphs -- drawn only
 * over the *hovered* control dot (`desktop_window_scene.ts`'s own
 * interaction state), the real control's own coloured circle is drawn
 * unconditionally every frame via `panel_pipeline.ts` directly, not
 * through this record at all. */
export const CONTROL_DOT_ICONS: Record<ControlDotId, readonly IconPrimitive[]> = {
  close: [
    { kind: "line", from: [-0.55, -0.55], to: [0.55, 0.55] },
    { kind: "line", from: [-0.55, 0.55], to: [0.55, -0.55] },
  ],
  minimize: [{ kind: "line", from: [-0.55, 0], to: [0.55, 0] }],
  maximize: [
    { kind: "line", from: [-0.5, -0.5], to: [0.5, -0.5] },
    { kind: "line", from: [0.5, -0.5], to: [0.5, 0.5] },
    { kind: "line", from: [0.5, 0.5], to: [-0.5, 0.5] },
    { kind: "line", from: [-0.5, 0.5], to: [-0.5, -0.5] },
  ],
};

/** The toolbar's own four action glyphs, always visible (unlike the
 * traffic lights' own glyphs above) -- `desktop_window_scene.ts`'s own
 * toolbar buttons draw their `PanelInstance` background first, then
 * these primitives centred on top, every frame. */
export const TOOLBAR_ICONS: Record<ToolbarButtonId, readonly IconPrimitive[]> = {
  back: [
    { kind: "line", from: [0.3, -0.6], to: [-0.4, 0] },
    { kind: "line", from: [-0.4, 0], to: [0.3, 0.6] },
  ],
  search: [
    { kind: "circle", center: [-0.15, -0.15], radius: 0.45, filled: false },
    { kind: "line", from: [0.25, 0.25], to: [0.65, 0.65] },
  ],
  settings: [
    { kind: "line", from: [-0.6, -0.45], to: [0.6, -0.45] },
    { kind: "line", from: [-0.6, 0], to: [0.6, 0] },
    { kind: "line", from: [-0.6, 0.45], to: [0.6, 0.45] },
    { kind: "circle", center: [-0.2, -0.45], radius: 0.16, filled: true },
    { kind: "circle", center: [0.3, 0], radius: 0.16, filled: true },
    { kind: "circle", center: [-0.1, 0.45], radius: 0.16, filled: true },
  ],
  info: [
    { kind: "circle", center: [0, 0], radius: 0.65, filled: false },
    { kind: "circle", center: [0, -0.32], radius: 0.09, filled: true },
    { kind: "line", from: [0, -0.05], to: [0, 0.42] },
  ],
};

/** Normalised icon-local coordinates (the arrays above, each roughly
 * within a [-1,1] box) to real, absolute pixel-space line instances,
 * centred at `(centerX, centerY)` and scaled by `size` -- the pixel
 * width/height of the icon's own bounding box, so a 20px toolbar icon
 * and a 13px control-dot glyph both read as "the same icon", just
 * scaled, not two different hand-tuned coordinate sets. */
export function instantiateIconLines(primitives: readonly IconPrimitive[], centerX: number, centerY: number, size: number, thickness: number, color: Rgba): readonly LineInstance[] {
  const half = size / 2;
  const lines: LineInstance[] = [];
  for (const primitive of primitives) {
    if (primitive.kind !== "line") continue;
    lines.push({
      from: [centerX + primitive.from[0] * half, centerY + primitive.from[1] * half],
      to: [centerX + primitive.to[0] * half, centerY + primitive.to[1] * half],
      thickness,
      color,
    });
  }
  return lines;
}

/** `instantiateIconLines()`'s own counterpart for the `"circle"`
 * primitives in the same list -- returned as real `PanelInstance`s
 * (`panel_pipeline.ts`'s own type), since a circle is drawn through
 * that same rounded-rect pipeline, not a pipeline of this file's own. */
export function instantiateIconCircles(primitives: readonly IconPrimitive[], centerX: number, centerY: number, size: number, ringThickness: number, color: Rgba): readonly PanelInstance[] {
  const half = size / 2;
  const circles: PanelInstance[] = [];
  for (const primitive of primitives) {
    if (primitive.kind !== "circle") continue;
    const cx = centerX + primitive.center[0] * half;
    const cy = centerY + primitive.center[1] * half;
    const radius = primitive.radius * half;
    circles.push({
      rect: { x: cx - radius, y: cy - radius, width: radius * 2, height: radius * 2 },
      cornerRadius: radius,
      mode: PANEL_MODE_SOLID,
      borderWidth: primitive.filled ? 0 : ringThickness,
      shadowSoftness: 0,
      fillColor: primitive.filled ? color : [0, 0, 0, 0],
      borderColor: color,
      glassTint: [0, 0, 0, 0],
    });
  }
  return circles;
}

export interface LineInstance {
  readonly from: readonly [number, number];
  readonly to: readonly [number, number];
  readonly thickness: number;
  readonly color: Rgba;
}

/** `from`/`to` are absolute pixel coordinates, the very same
 * coordinate frame `in.pixelPos` is computed in below -- unlike
 * `panel_pipeline.ts`'s own `vs_panel`, which only ever needs a
 * *local*, shape-centred coordinate for its symmetric rounded-rect
 * SDF, a line segment's own capsule SDF genuinely needs its two real
 * endpoints, not a local offset from some centre that would have to be
 * reconstructed. The quad this still draws (`createQuadVertexBounds()`
 * below) is sized generously around the segment -- its own on-screen
 * footprint, not the icon's whole bounding box -- padded by half the
 * stroke thickness plus a couple of antialiasing pixels on every side,
 * so the capsule's own rounded ends are never clipped by the quad
 * itself. */
const LINE_SHADER_WGSL = `
struct LineUniforms {
  data0: vec4<f32>, // viewportWidth, viewportHeight, quadCenterX, quadCenterY
  data1: vec4<f32>, // quadHalfWidth, quadHalfHeight, thickness, unused
  data2: vec4<f32>, // p0x, p0y, p1x, p1y (absolute pixel-space endpoints)
  color: vec4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: LineUniforms;

struct LineVertexOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) pixelPos: vec2<f32>,
};

@vertex
fn vs_line(@location(0) localPos: vec2<f32>) -> LineVertexOut {
  let halfSize = uniforms.data1.xy;
  let center = uniforms.data0.zw;
  let viewport = uniforms.data0.xy;
  let pixelPos = center + localPos * halfSize;
  var out: LineVertexOut;
  out.clipPosition = vec4<f32>((pixelPos.x / viewport.x) * 2.0 - 1.0, 1.0 - (pixelPos.y / viewport.y) * 2.0, 0.0, 1.0);
  out.pixelPos = pixelPos;
  return out;
}

// Inigo Quilez's own capsule (rounded line segment) signed distance
// field -- the real, standard formula, the same "transcribed, not
// derived" citation panel_pipeline.ts's own roundedRectSdf() makes.
fn sdCapsule(p: vec2<f32>, a: vec2<f32>, b: vec2<f32>, r: f32) -> f32 {
  let pa = p - a;
  let ba = b - a;
  let h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

@fragment
fn fs_line(in: LineVertexOut) -> @location(0) vec4<f32> {
  let thickness = uniforms.data1.z;
  let p0 = uniforms.data2.xy;
  let p1 = uniforms.data2.zw;
  let dist = sdCapsule(in.pixelPos, p0, p1, thickness * 0.5);
  let aa = 1.25;
  let alpha = (1.0 - smoothstep(0.0, aa, dist)) * uniforms.color.a;
  return vec4<f32>(uniforms.color.rgb, alpha);
}
`;

export const LINE_UNIFORM_SIZE_BYTES = 16 * 4; // data0/data1/data2/color, one vec4<f32> each
export const LINE_UNIFORM_FLOAT_COUNT = LINE_UNIFORM_SIZE_BYTES / 4;

export function createLinePipeline(device: GpuDeviceLike, format: string): GpuRenderPipelineLike {
  const shaderModule = device.createShaderModule({ code: LINE_SHADER_WGSL });
  return device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_line",
      // The exact same unit-quad vertex layout panel_pipeline.ts's own
      // createPanelQuadMesh() builds -- this pipeline reuses that very
      // mesh (desktop_window_scene.ts's own call sites), rather than
      // uploading a second, identical quad of its own.
      buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }] }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_line",
      targets: [{ format, blend: { color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" }, alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" } } }],
    },
    primitive: { topology: "triangle-list", cullMode: "none" },
  });
}

export interface LineResource {
  readonly uniformBuffer: GpuBufferLike;
  readonly bindGroup: GpuBindGroupLike;
}

export function createLineResource(device: GpuDeviceLike, pipeline: GpuRenderPipelineLike): LineResource {
  const { buffer: bufferUsage } = gpuUsageFlags();
  const uniformBuffer = device.createBuffer({ size: LINE_UNIFORM_SIZE_BYTES, usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST });
  const bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: uniformBuffer } }] });
  return { uniformBuffer, bindGroup };
}

const ANTIALIAS_PADDING_PX = 2;
const lineScratch = new Float32Array(LINE_UNIFORM_FLOAT_COUNT);

export function writeLineUniforms(device: GpuDeviceLike, resource: LineResource, viewportWidth: number, viewportHeight: number, instance: LineInstance): void {
  const halfThickness = instance.thickness / 2 + ANTIALIAS_PADDING_PX;
  const minX = Math.min(instance.from[0], instance.to[0]) - halfThickness;
  const maxX = Math.max(instance.from[0], instance.to[0]) + halfThickness;
  const minY = Math.min(instance.from[1], instance.to[1]) - halfThickness;
  const maxY = Math.max(instance.from[1], instance.to[1]) + halfThickness;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  lineScratch.set([viewportWidth, viewportHeight, centerX, centerY], 0);
  lineScratch.set([(maxX - minX) / 2, (maxY - minY) / 2, instance.thickness, 0], 4);
  lineScratch.set([instance.from[0], instance.from[1], instance.to[0], instance.to[1]], 8);
  lineScratch.set(instance.color, 12);
  device.queue.writeBuffer(resource.uniformBuffer, 0, lineScratch);
}

export function drawLine(pass: GpuRenderPassEncoderLike, pipeline: GpuRenderPipelineLike, quadMesh: PanelQuadMesh, resource: LineResource): void {
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, resource.bindGroup);
  pass.setVertexBuffer(0, quadMesh.vertexBuffer);
  pass.setIndexBuffer(quadMesh.indexBuffer, "uint16");
  pass.drawIndexed(6);
}

export function destroyLineResource(resource: LineResource): void {
  resource.uniformBuffer.destroy();
}
