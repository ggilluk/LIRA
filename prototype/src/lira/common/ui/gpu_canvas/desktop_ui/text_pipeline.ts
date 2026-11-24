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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/text_pipeline
 * │ Filename        │ text_pipeline.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ WebGPU pipeline drawing text as textured quads sampling
 * │                 │ font_atlas.ts's own baked glyph bitmap -- the real draw call
 * │                 │ behind every word this UI ever shows.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/text_pipeline
 * @file text_pipeline.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { gpuUsageFlags, type GpuBindGroupLike, type GpuBufferLike, type GpuDeviceLike, type GpuRenderPassEncoderLike, type GpuRenderPipelineLike, type GpuSamplerLike, type GpuTextureLike, type GpuTextureViewLike } from "../webgpu_types";
import type { FontAtlas } from "./font_atlas";
import type { Rgba } from "./panel_pipeline";

const TEXT_SHADER_WGSL = `
struct TextUniforms {
  data0: vec4<f32>, // viewportWidth, viewportHeight, unused, unused
  color: vec4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: TextUniforms;
@group(0) @binding(1) var atlasSampler: sampler;
@group(0) @binding(2) var atlasTexture: texture_2d<f32>;

struct TextVertexOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_text(@location(0) pixelPos: vec2<f32>, @location(1) uv: vec2<f32>) -> TextVertexOut {
  let viewport = uniforms.data0.xy;
  var out: TextVertexOut;
  out.clipPosition = vec4<f32>((pixelPos.x / viewport.x) * 2.0 - 1.0, 1.0 - (pixelPos.y / viewport.y) * 2.0, 0.0, 1.0);
  out.uv = uv;
  return out;
}

@fragment
fn fs_text(in: TextVertexOut) -> @location(0) vec4<f32> {
  // The atlas was baked with an opaque white fill (font_atlas.ts's own
  // fillStyle), so every glyph's own antialiased edge lives entirely
  // in the alpha channel -- sampling only .a and recolouring with this
  // draw's own uniform colour is what lets the *same* baked atlas draw
  // white title text, dimmer status-bar text, or any other colour,
  // without re-baking a separate atlas per colour.
  let coverage = textureSample(atlasTexture, atlasSampler, in.uv).a;
  return vec4<f32>(uniforms.color.rgb, uniforms.color.a * coverage);
}
`;

export const TEXT_UNIFORM_SIZE_BYTES = 32; // data0 + color, one vec4<f32> each
export const TEXT_UNIFORM_FLOAT_COUNT = TEXT_UNIFORM_SIZE_BYTES / 4;

/** Four floats per vertex (pixel-space `x,y` then atlas `u,v`), six
 * vertices per glyph quad -- a plain, non-indexed triangle list (two
 * triangles per glyph), not `panel_pipeline.ts`'s own shared unit quad
 * plus per-instance uniform transform: unlike a panel or a line, the
 * number of glyphs drawn varies string to string, so the *vertex data
 * itself* varies per draw here, not just a uniform. */
export const TEXT_VERTEX_FLOAT_COUNT = 4;
const VERTICES_PER_GLYPH = 6;

/** How many glyphs any one `TextResource` below can ever hold -- fixed,
 * not configurable per call, so every resource's own vertex buffer
 * (and the one shared scratch array every `writeTextQuads()` call
 * reuses) can be sized once, at setup, the same "allocate once, reuse
 * every frame" discipline `scene_renderer.ts`'s own `uniformScratch`
 * already established. Comfortably larger than any single label this
 * UI ever actually draws (a window title, a status line). */
export const TEXT_MAX_CHARACTERS = 64;

export interface TextPipelineBundle {
  readonly pipeline: GpuRenderPipelineLike;
  readonly sampler: GpuSamplerLike;
  readonly atlasTexture: GpuTextureLike;
  readonly atlasView: GpuTextureViewLike;
}

/** Builds the one shared pipeline, uploads `atlas`'s own baked bitmap
 * as a real GPU texture (`device.queue.writeTexture()` -- a plain
 * memory upload of `atlas.pixels`, not `copyExternalImageToTexture()`,
 * since this is CPU-side pixel data, not a live external image source
 * the way the camera cube's own frame is), and creates the one shared
 * sampler every `TextResource` below is bound against -- called once
 * per `GpuCanvasView` session, not per label drawn. */
export function createTextPipelineBundle(device: GpuDeviceLike, format: string, atlas: FontAtlas): TextPipelineBundle {
  const shaderModule = device.createShaderModule({ code: TEXT_SHADER_WGSL });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_text",
      buffers: [
        {
          arrayStride: 16, // 4 floats: pixelPos.xy, uv.xy
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x2" },
            { shaderLocation: 1, offset: 8, format: "float32x2" },
          ],
        },
      ],
    },
    fragment: {
      module: shaderModule,
      entryPoint: "fs_text",
      targets: [{ format, blend: { color: { srcFactor: "src-alpha", dstFactor: "one-minus-src-alpha", operation: "add" }, alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha", operation: "add" } } }],
    },
    primitive: { topology: "triangle-list", cullMode: "none" },
  });

  const { texture: textureUsage } = gpuUsageFlags();
  const atlasTexture = device.createTexture({ size: [atlas.width, atlas.height], format: "rgba8unorm", usage: textureUsage.TEXTURE_BINDING | textureUsage.COPY_DST });
  device.queue.writeTexture({ texture: atlasTexture }, atlas.pixels, { bytesPerRow: atlas.width * 4, rowsPerImage: atlas.height }, [atlas.width, atlas.height]);
  const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });

  return { pipeline, sampler, atlasTexture, atlasView: atlasTexture.createView() };
}

export function destroyTextPipelineBundle(bundle: TextPipelineBundle): void {
  bundle.atlasTexture.destroy();
}

export interface TextResource {
  readonly uniformBuffer: GpuBufferLike;
  readonly vertexBuffer: GpuBufferLike;
  readonly bindGroup: GpuBindGroupLike;
  vertexCount: number;
}

export function createTextResource(device: GpuDeviceLike, bundle: TextPipelineBundle): TextResource {
  const { buffer: bufferUsage } = gpuUsageFlags();
  const uniformBuffer = device.createBuffer({ size: TEXT_UNIFORM_SIZE_BYTES, usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST });
  const vertexBuffer = device.createBuffer({ size: TEXT_MAX_CHARACTERS * VERTICES_PER_GLYPH * TEXT_VERTEX_FLOAT_COUNT * 4, usage: bufferUsage.VERTEX | bufferUsage.COPY_DST });
  const bindGroup = device.createBindGroup({
    layout: bundle.pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniformBuffer } },
      { binding: 1, resource: bundle.sampler },
      { binding: 2, resource: bundle.atlasView },
    ],
  });
  return { uniformBuffer, vertexBuffer, bindGroup, vertexCount: 0 };
}

const vertexScratch = new Float32Array(TEXT_MAX_CHARACTERS * VERTICES_PER_GLYPH * TEXT_VERTEX_FLOAT_COUNT);
const uniformScratch = new Float32Array(TEXT_UNIFORM_FLOAT_COUNT);

/** Lays `text` out left to right starting at `(x, y)` -- the same
 * top-left-of-glyph origin `font_atlas.ts`'s own `textBaseline = "top"`
 * baked every glyph against, so no separate ascent/baseline math is
 * needed here, just `y` itself. `pixelHeight` is the desired on-screen
 * line height; `scale = pixelHeight / atlas.fontPixelSize` maps the
 * baked (deliberately larger, `font_atlas.ts`'s own docstring on why)
 * glyphs down to it. A character missing from the atlas (outside
 * `ATLAS_CHARACTERS`) is skipped -- not substituted with a fabricated
 * glyph box -- though the cursor still advances by that same
 * character's own would-be width if a space's metrics are available,
 * keeping later characters from bunching up against a gap. Truncates
 * at `TEXT_MAX_CHARACTERS`, the real capacity `createTextResource()`
 * allocated, rather than overrunning `resource.vertexBuffer`. */
export function writeTextQuads(device: GpuDeviceLike, resource: TextResource, atlas: FontAtlas, text: string, x: number, y: number, pixelHeight: number, color: Rgba, viewportWidth: number, viewportHeight: number): void {
  const scale = pixelHeight / atlas.fontPixelSize;
  const spaceAdvance = (atlas.glyphs.get(" ")?.advance ?? 0) * scale;
  let cursorX = x;
  let glyphsWritten = 0;

  for (const character of text) {
    if (glyphsWritten >= TEXT_MAX_CHARACTERS) break;
    const glyph = atlas.glyphs.get(character);
    if (!glyph) {
      cursorX += spaceAdvance;
      continue;
    }
    const width = glyph.width * scale;
    const height = glyph.height * scale;
    const left = cursorX;
    const top = y;
    const right = cursorX + width;
    const bottom = y + height;
    const base = glyphsWritten * VERTICES_PER_GLYPH * TEXT_VERTEX_FLOAT_COUNT;
    const vertices: readonly number[] = [
      left, top, glyph.u0, glyph.v0,
      right, top, glyph.u1, glyph.v0,
      right, bottom, glyph.u1, glyph.v1,
      left, top, glyph.u0, glyph.v0,
      right, bottom, glyph.u1, glyph.v1,
      left, bottom, glyph.u0, glyph.v1,
    ];
    vertexScratch.set(vertices, base);
    cursorX += glyph.advance * scale;
    glyphsWritten++;
  }

  resource.vertexCount = glyphsWritten * VERTICES_PER_GLYPH;
  if (glyphsWritten > 0) device.queue.writeBuffer(resource.vertexBuffer, 0, vertexScratch.subarray(0, glyphsWritten * VERTICES_PER_GLYPH * TEXT_VERTEX_FLOAT_COUNT));

  uniformScratch.set([viewportWidth, viewportHeight, 0, 0], 0);
  uniformScratch.set(color, 4);
  device.queue.writeBuffer(resource.uniformBuffer, 0, uniformScratch);
}

export function drawText(pass: GpuRenderPassEncoderLike, pipeline: GpuRenderPipelineLike, resource: TextResource): void {
  if (resource.vertexCount === 0) return;
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, resource.bindGroup);
  pass.setVertexBuffer(0, resource.vertexBuffer);
  pass.draw(resource.vertexCount);
}

export function destroyTextResource(resource: TextResource): void {
  resource.uniformBuffer.destroy();
  resource.vertexBuffer.destroy();
}
