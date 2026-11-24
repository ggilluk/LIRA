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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/panel_pipeline
 * │ Filename        │ panel_pipeline.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ WebGPU pipeline drawing every rounded-rect/circle surface in the
 * │                 │ desktop window UI -- solid fills, frosted-glass panels sampling a
 * │                 │ blurred backdrop, and soft drop shadows -- as one shared shader.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/panel_pipeline
 * @file panel_pipeline.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { rectCenter, rectHalfExtent, type Rect } from "./layout";
import { gpuUsageFlags, type GpuBindGroupLike, type GpuBufferLike, type GpuDeviceLike, type GpuRenderPassEncoderLike, type GpuRenderPipelineLike, type GpuSamplerLike, type GpuTextureViewLike } from "../webgpu_types";

/** One shader, three draw modes, picked per instance via `data1.w`
 * below -- a `PANEL_MODE_GLASS` button and a `PANEL_MODE_SOLID` one
 * are the same geometry and the same rounded-rect clip, differing only
 * in whether the fragment shader samples the blurred backdrop texture
 * or uses `fillColor` directly; a `PANEL_MODE_SHADOW` instance skips
 * fill/border/glass entirely and only ever emits a soft, blurred-edge
 * black falloff. Three WGSL pipelines that each hard-coded one mode
 * would be more code for the same real behaviour, not less -- a
 * fragment shader branching on a per-instance uniform is the simpler
 * shape here, same as `CAMERA_SHADER_WGSL` staying a separate pipeline
 * from `SCENE_SHADER_WGSL` only because its *vertex layout* genuinely
 * differs (`shader.ts`'s own docstring), not because branching would
 * have been wrong there too. */
export const PANEL_MODE_SOLID = 0;
export const PANEL_MODE_GLASS = 1;
export const PANEL_MODE_SHADOW = 2;

export type Rgba = readonly [number, number, number, number];

/** A circle is a special case of this same rounded rect -- `radius ===
 * min(halfWidth, halfHeight)` with a square `rect` (`layout.ts`'s own
 * `roundedRectSdf()` docstring on the same degeneracy) -- so the
 * window's own traffic-light dots are `PanelInstance`s too, not a
 * second shape kind. */
export interface PanelInstance {
  readonly rect: Rect;
  readonly cornerRadius: number;
  readonly mode: typeof PANEL_MODE_SOLID | typeof PANEL_MODE_GLASS | typeof PANEL_MODE_SHADOW;
  readonly borderWidth: number;
  /** Only meaningful in `PANEL_MODE_SHADOW` -- how many pixels wide the
   * soft edge falloff is; larger reads as a softer, more diffuse
   * shadow, the SDF-based stand-in for a real multi-pass blur over the
   * shadow shape itself (`backdrop.ts`'s own real blur is reserved for
   * the frosted-glass backdrop, which has real image content behind it
   * worth blurring -- a shadow is a flat colour, so blurring its own
   * edge analytically through the SDF directly is the simpler, equally
   * correct-looking route, not a shortcut around the real technique). */
  readonly shadowSoftness: number;
  readonly fillColor: Rgba;
  readonly borderColor: Rgba;
  /** Only meaningful in `PANEL_MODE_GLASS` -- mixed over the sampled,
   * blurred backdrop by this colour's own alpha (0 = pure backdrop
   * showing through unmodified, 1 = fully opaque `glassTint.rgb`,
   * ignoring the backdrop entirely). */
  readonly glassTint: Rgba;
}

const PANEL_SHADER_WGSL = `
struct PanelUniforms {
  data0: vec4<f32>, // viewportWidth, viewportHeight, centerX, centerY
  data1: vec4<f32>, // halfWidth, halfHeight, cornerRadius, mode
  data2: vec4<f32>, // borderWidth, shadowSoftness, unused, unused
  fillColor: vec4<f32>,
  borderColor: vec4<f32>,
  glassTint: vec4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: PanelUniforms;
@group(0) @binding(1) var backdropSampler: sampler;
@group(0) @binding(2) var backdropTexture: texture_2d<f32>;

struct PanelVertexOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) localPx: vec2<f32>,
  @location(1) screenUV: vec2<f32>,
};

@vertex
fn vs_panel(@location(0) localPos: vec2<f32>) -> PanelVertexOut {
  let halfSize = uniforms.data1.xy;
  let center = uniforms.data0.zw;
  let viewport = uniforms.data0.xy;
  let pixelPos = center + localPos * halfSize;
  var out: PanelVertexOut;
  out.clipPosition = vec4<f32>((pixelPos.x / viewport.x) * 2.0 - 1.0, 1.0 - (pixelPos.y / viewport.y) * 2.0, 0.0, 1.0);
  out.localPx = localPos * halfSize;
  out.screenUV = pixelPos / viewport;
  return out;
}

// Inigo Quilez's own rounded-box signed distance field -- layout.ts's
// own roundedRectSdf() docstring has the full derivation/citation;
// this is the same formula, transcribed into WGSL by hand since WGSL
// has no mechanism to literally share the TypeScript implementation.
fn roundedRectSdf(p: vec2<f32>, halfSize: vec2<f32>, radius: f32) -> f32 {
  let q = abs(p) - halfSize + vec2<f32>(radius, radius);
  return length(max(q, vec2<f32>(0.0, 0.0))) + min(max(q.x, q.y), 0.0) - radius;
}

@fragment
fn fs_panel(in: PanelVertexOut) -> @location(0) vec4<f32> {
  let halfSize = uniforms.data1.xy;
  let cornerRadius = uniforms.data1.z;
  let mode = uniforms.data1.w;
  let borderWidth = uniforms.data2.x;
  let shadowSoftness = uniforms.data2.y;
  let dist = roundedRectSdf(in.localPx, halfSize, cornerRadius);
  let aa = 1.25;

  if (mode > 1.5) {
    // PANEL_MODE_SHADOW: a wide, analytic soft falloff straddling the
    // shape's own edge, tinted by fillColor -- no border/glass logic
    // applies to a shadow at all.
    let shadowAlpha = (1.0 - smoothstep(-shadowSoftness, shadowSoftness, dist)) * uniforms.fillColor.a;
    return vec4<f32>(uniforms.fillColor.rgb, shadowAlpha);
  }

  let shapeAlpha = 1.0 - smoothstep(0.0, aa, dist);

  var baseColor = uniforms.fillColor.rgb;
  var baseAlpha = uniforms.fillColor.a;
  if (mode > 0.5) {
    // PANEL_MODE_GLASS: the frosted-glass look is the sampled, already-
    // blurred backdrop (backdrop.ts's own two-pass Gaussian blur did
    // the actual blurring -- this shader only samples the result),
    // tinted toward glassTint by glassTint's own alpha.
    let backdropSample = textureSample(backdropTexture, backdropSampler, in.screenUV).rgb;
    baseColor = mix(backdropSample, uniforms.glassTint.rgb, uniforms.glassTint.a);
    baseAlpha = 1.0;
  }

  let borderBand = smoothstep(-borderWidth - aa, -borderWidth, dist);
  let finalColor = mix(baseColor, uniforms.borderColor.rgb, borderBand * uniforms.borderColor.a);
  return vec4<f32>(finalColor, baseAlpha * shapeAlpha);
}
`;

export const PANEL_UNIFORM_SIZE_BYTES = 16 * 6; // data0/data1/data2/fillColor/borderColor/glassTint, one vec4<f32> each
export const PANEL_UNIFORM_FLOAT_COUNT = PANEL_UNIFORM_SIZE_BYTES / 4;

export function createPanelPipeline(device: GpuDeviceLike, format: string): GpuRenderPipelineLike {
  const shaderModule = device.createShaderModule({ code: PANEL_SHADER_WGSL });
  return device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_panel",
      buffers: [{ arrayStride: 8, attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }] }],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_panel",
      targets: [
        {
          format,
          // Standard "over" alpha compositing -- every panel is drawn
          // back to front (desktop_window_scene.ts's own draw order),
          // translucent glass/shadow instances blending with whatever
          // already landed in the colour attachment beneath them.
          blend: {
            color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" },
          },
        },
      ],
    },
    // No depthStencil at all -- this is a flat 2D overlay (unlike
    // scene_renderer.ts's own depth-tested 3D scene), so draw order
    // alone determines what's on top; cullMode "none" sidesteps
    // winding-order concerns entirely, since the vertex shader flips Y
    // by hand to go from pixel space to clip space (`vs_panel`'s own
    // `1.0 - ...`), which also flips a quad's own apparent winding.
    primitive: { topology: "triangle-list", cullMode: "none" },
  });
}

/** The one shared unit quad every `PanelInstance` is drawn with --
 * built once, reused by every panel (`drawPanel()` below never rebinds
 * a different vertex/index buffer), the same "static geometry, varying
 * only by uniform" shape `scene_renderer.ts`'s own `cubeBuffers`/
 * `sphereBuffers` already use for the sixteen solid entities. */
export interface PanelQuadMesh {
  readonly vertexBuffer: GpuBufferLike;
  readonly indexBuffer: GpuBufferLike;
}

export function createPanelQuadMesh(device: GpuDeviceLike): PanelQuadMesh {
  const { buffer: bufferUsage } = gpuUsageFlags();
  const vertices = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]);
  const indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
  const vertexBuffer = device.createBuffer({ size: vertices.byteLength, usage: bufferUsage.VERTEX | bufferUsage.COPY_DST });
  device.queue.writeBuffer(vertexBuffer, 0, vertices);
  const indexBuffer = device.createBuffer({ size: indices.byteLength, usage: bufferUsage.INDEX | bufferUsage.COPY_DST });
  device.queue.writeBuffer(indexBuffer, 0, indices);
  return { vertexBuffer, indexBuffer };
}

export interface PanelResource {
  readonly uniformBuffer: GpuBufferLike;
  bindGroup: GpuBindGroupLike;
}

/** `backdropSampler`/`backdropView` are bound here even for a panel
 * that will only ever draw in `PANEL_MODE_SOLID` (a toolbar button's
 * hover background, say) -- the bind group layout is fixed by the one
 * shared shader above, which declares both bindings unconditionally,
 * so every `PanelResource` needs *something* bound there regardless of
 * which mode its own uniforms end up selecting; the fragment shader
 * simply never samples it outside `PANEL_MODE_GLASS`. */
export function createPanelResource(device: GpuDeviceLike, pipeline: GpuRenderPipelineLike, backdropSampler: GpuSamplerLike, backdropView: GpuTextureViewLike): PanelResource {
  const { buffer: bufferUsage } = gpuUsageFlags();
  const uniformBuffer = device.createBuffer({ size: PANEL_UNIFORM_SIZE_BYTES, usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: backdropSampler },
      { binding: 2, resource: backdropView },
    ],
  });
  return { uniformBuffer, bindGroup };
}

/** Called whenever the real blurred-backdrop texture is recreated
 * (`desktop_window_scene.ts`'s own resize handling, mirroring
 * `scene_renderer.ts`'s own depth-texture-on-resize recreation) --
 * every existing `PanelResource`'s own `bindGroup` was built against
 * the *old* backdrop texture's view, which is now a dangling
 * reference, so each one needs a fresh bind group pointing at the new
 * view. The uniform buffer itself is untouched -- only the bind group
 * (a cheap, GPU-side-only object) is rebuilt, not the whole resource. */
export function rebindPanelResource(device: GpuDeviceLike, pipeline: GpuRenderPipelineLike, resource: PanelResource, backdropSampler: GpuSamplerLike, backdropView: GpuTextureViewLike): void {
  resource.bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: resource.uniformBuffer } },
      { binding: 1, resource: backdropSampler },
      { binding: 2, resource: backdropView },
    ],
  });
}

const uniformScratch = new Float32Array(PANEL_UNIFORM_FLOAT_COUNT);

export function writePanelUniforms(device: GpuDeviceLike, resource: PanelResource, viewportWidth: number, viewportHeight: number, instance: PanelInstance): void {
  const [centerX, centerY] = rectCenter(instance.rect);
  const [halfWidth, halfHeight] = rectHalfExtent(instance.rect);
  uniformScratch.set([viewportWidth, viewportHeight, centerX, centerY], 0);
  uniformScratch.set([halfWidth, halfHeight, instance.cornerRadius, instance.mode], 4);
  uniformScratch.set([instance.borderWidth, instance.shadowSoftness, 0, 0], 8);
  uniformScratch.set(instance.fillColor, 12);
  uniformScratch.set(instance.borderColor, 16);
  uniformScratch.set(instance.glassTint, 20);
  device.queue.writeBuffer(resource.uniformBuffer, 0, uniformScratch);
}

export function drawPanel(pass: GpuRenderPassEncoderLike, pipeline: GpuRenderPipelineLike, quadMesh: PanelQuadMesh, resource: PanelResource): void {
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, resource.bindGroup);
  pass.setVertexBuffer(0, quadMesh.vertexBuffer);
  pass.setIndexBuffer(quadMesh.indexBuffer, "uint16");
  pass.drawIndexed(6);
}

export function destroyPanelResource(resource: PanelResource): void {
  resource.uniformBuffer.destroy();
}

export function destroyPanelQuadMesh(mesh: PanelQuadMesh): void {
  mesh.vertexBuffer.destroy();
  mesh.indexBuffer.destroy();
}
