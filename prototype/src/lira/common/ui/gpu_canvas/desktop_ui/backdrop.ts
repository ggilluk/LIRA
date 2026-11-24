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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/backdrop
 * │ Filename        │ backdrop.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ The real mechanism behind this UI's own `backdrop-filter: blur()`
 * │                 │ look: a procedural animated wallpaper rendered into an offscreen
 * │                 │ texture, then a genuine two-pass separable Gaussian blur over it,
 * │                 │ all through WebGPU render passes -- panel_pipeline.ts's own
 * │                 │ PANEL_MODE_GLASS only ever *samples* the result this file produces.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/backdrop
 * @file backdrop.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { gpuUsageFlags, type GpuBindGroupLike, type GpuBufferLike, type GpuCommandEncoderLike, type GpuDeviceLike, type GpuRenderPipelineLike, type GpuSamplerLike, type GpuTextureLike, type GpuTextureViewLike } from "../webgpu_types";

/** Both passes below draw one full-screen triangle each -- the
 * standard buffer-free technique (three positions synthesised in the
 * vertex shader from `@builtin(vertex_index)` alone, covering the
 * whole clip-space square with no vertex or index buffer at all), used
 * here instead of `panel_pipeline.ts`'s own unit-quad mesh because a
 * background fill and a blur pass are the one case in this whole
 * folder that genuinely has no per-instance geometry or uniform data
 * varying from one draw to the next within a single pass -- just "run
 * this fragment shader over every pixel of the target". */
const FULLSCREEN_VERTEX_WGSL = `
struct FullscreenOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) uv: vec2<f32>,
};

@vertex
fn vs_fullscreen(@builtin(vertex_index) vertexIndex: u32) -> FullscreenOut {
  var positions = array<vec2<f32>, 3>(vec2<f32>(-1.0, -1.0), vec2<f32>(3.0, -1.0), vec2<f32>(-1.0, 3.0));
  let pos = positions[vertexIndex];
  var out: FullscreenOut;
  out.clipPosition = vec4<f32>(pos, 0.0, 1.0);
  out.uv = vec2<f32>((pos.x + 1.0) * 0.5, 1.0 - (pos.y + 1.0) * 0.5);
  return out;
}
`;

/** A deterministic, parametrised gradient plus two slow-drifting soft
 * highlights -- real analytic colour, computed fresh every frame from
 * `time` alone, not a loaded or embedded image (this feature's own
 * "no external asset" constraint). Gives the frosted-glass panels
 * something organic to show through; a flat, static colour would blur
 * into the exact same flat colour and make the glass effect invisible. */
const WALLPAPER_SHADER_WGSL =
  FULLSCREEN_VERTEX_WGSL +
  `
struct WallpaperUniforms {
  data0: vec4<f32>, // time, aspect (width/height), unused, unused
};
@group(0) @binding(0) var<uniform> uniforms: WallpaperUniforms;

@fragment
fn fs_wallpaper(in: FullscreenOut) -> @location(0) vec4<f32> {
  let time = uniforms.data0.x;
  let aspect = uniforms.data0.y;
  let topColor = vec3<f32>(0.11, 0.13, 0.24);
  let bottomColor = vec3<f32>(0.03, 0.05, 0.11);
  var color = mix(bottomColor, topColor, in.uv.y);

  let p = vec2<f32>((in.uv.x - 0.5) * aspect, in.uv.y - 0.5);
  let blob1Center = vec2<f32>(0.26 * sin(time * 0.17), 0.20 * cos(time * 0.13));
  let blob1 = exp(-18.0 * dot(p - blob1Center, p - blob1Center));
  let blob2Center = vec2<f32>(-0.30 * cos(time * 0.11), -0.22 * sin(time * 0.19));
  let blob2 = exp(-22.0 * dot(p - blob2Center, p - blob2Center));
  color = color + vec3<f32>(0.26, 0.13, 0.36) * blob1 + vec3<f32>(0.08, 0.22, 0.30) * blob2;
  return vec4<f32>(color, 1.0);
}
`;

/** A real, standard 9-tap separable Gaussian blur (weights from the
 * well-known "efficient Gaussian blur" linear-sampling approximation --
 * five taps per direction incl. centre, mirrored), run twice per frame
 * through the *same* pipeline: once with `dir = (1,0)` sampling the
 * fresh wallpaper texture into an intermediate texture (the horizontal
 * pass), once with `dir = (0,1)` sampling that intermediate texture
 * into the final texture (the vertical pass) -- the standard separable
 * trick that turns an O(n^2) 2D blur into two O(n) 1D ones.
 * `panel_pipeline.ts`'s own `PANEL_MODE_GLASS` samples only the final
 * texture this produces; it never sees the wallpaper or the
 * intermediate pass directly. */
const BLUR_SHADER_WGSL =
  FULLSCREEN_VERTEX_WGSL +
  `
struct BlurUniforms {
  data0: vec4<f32>, // texelSizeX, texelSizeY, directionX, directionY
};
@group(0) @binding(0) var<uniform> uniforms: BlurUniforms;
@group(0) @binding(1) var sourceSampler: sampler;
@group(0) @binding(2) var sourceTexture: texture_2d<f32>;

@fragment
fn fs_blur(in: FullscreenOut) -> @location(0) vec4<f32> {
  let texel = uniforms.data0.xy;
  let dir = uniforms.data0.zw;
  let weights = array<f32, 5>(0.227027, 0.1945946, 0.1216216, 0.054054, 0.016216);
  var result = textureSample(sourceTexture, sourceSampler, in.uv).rgb * weights[0];
  for (var i = 1; i < 5; i = i + 1) {
    let offset = dir * texel * f32(i);
    result = result + textureSample(sourceTexture, sourceSampler, in.uv + offset).rgb * weights[i];
    result = result + textureSample(sourceTexture, sourceSampler, in.uv - offset).rgb * weights[i];
  }
  return vec4<f32>(result, 1.0);
}
`;

export const WALLPAPER_UNIFORM_SIZE_BYTES = 16;
export const WALLPAPER_UNIFORM_FLOAT_COUNT = WALLPAPER_UNIFORM_SIZE_BYTES / 4;
export const BLUR_UNIFORM_SIZE_BYTES = 16;
export const BLUR_UNIFORM_FLOAT_COUNT = BLUR_UNIFORM_SIZE_BYTES / 4;

/** The blurred backdrop is rendered at a reduced resolution, not the
 * canvas's own real size -- two real, compounding reasons, not just
 * "it's cheaper" (though it is): a lower source resolution *is* a
 * wider effective blur radius for the same fixed 5-tap kernel above
 * (each texel step already covers more real screen area), and the
 * glass panels sample it back with the sampler's own linear filtering,
 * which smooths the upscale into a softer result than sampling a full-
 * resolution blur ever would -- both push toward the same "proper
 * frosted glass" look this effect is going for, not away from it. */
const BACKDROP_RESOLUTION_SCALE = 0.5;

export function backdropResolution(canvasWidth: number, canvasHeight: number): { width: number; height: number } {
  return { width: Math.max(1, Math.round(canvasWidth * BACKDROP_RESOLUTION_SCALE)), height: Math.max(1, Math.round(canvasHeight * BACKDROP_RESOLUTION_SCALE)) };
}

export interface BackdropPipelines {
  readonly wallpaperPipeline: GpuRenderPipelineLike;
  readonly blurPipeline: GpuRenderPipelineLike;
}

export function createBackdropPipelines(device: GpuDeviceLike, format: string): BackdropPipelines {
  const wallpaperModule = device.createShaderModule({ code: WALLPAPER_SHADER_WGSL });
  const wallpaperPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: wallpaperModule, entryPoint: "vs_fullscreen" },
    fragment: { module: wallpaperModule, entryPoint: "fs_wallpaper", targets: [{ format }] },
    primitive: { topology: "triangle-list", cullMode: "none" },
  });
  const blurModule = device.createShaderModule({ code: BLUR_SHADER_WGSL });
  const blurPipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module: blurModule, entryPoint: "vs_fullscreen" },
    fragment: { module: blurModule, entryPoint: "fs_blur", targets: [{ format }] },
    primitive: { topology: "triangle-list", cullMode: "none" },
  });
  return { wallpaperPipeline, blurPipeline };
}

export interface BackdropTextures {
  readonly width: number;
  readonly height: number;
  readonly wallpaperTexture: GpuTextureLike;
  readonly wallpaperView: GpuTextureViewLike;
  readonly intermediateTexture: GpuTextureLike;
  readonly intermediateView: GpuTextureViewLike;
  readonly finalTexture: GpuTextureLike;
  readonly finalView: GpuTextureViewLike;
}

/** Three same-size offscreen textures -- `wallpaperTexture` (the
 * unblurred background, also what the horizontal blur pass reads),
 * `intermediateTexture` (the horizontal pass's own output, and the
 * vertical pass's own input), and `finalTexture` (the vertical pass's
 * own output -- the one real texture `panel_pipeline.ts`'s own
 * `PANEL_MODE_GLASS` ever samples). All three need both
 * `RENDER_ATTACHMENT` (each is a real pass's own colour attachment) and
 * `TEXTURE_BINDING` (each is also sampled by a later pass, or by the
 * glass panels themselves). */
export function createBackdropTextures(device: GpuDeviceLike, format: string, canvasWidth: number, canvasHeight: number): BackdropTextures {
  const { texture: textureUsage } = gpuUsageFlags();
  const { width, height } = backdropResolution(canvasWidth, canvasHeight);
  const usage = textureUsage.RENDER_ATTACHMENT | textureUsage.TEXTURE_BINDING;
  const wallpaperTexture = device.createTexture({ size: [width, height], format, usage });
  const intermediateTexture = device.createTexture({ size: [width, height], format, usage });
  const finalTexture = device.createTexture({ size: [width, height], format, usage });
  return {
    width,
    height,
    wallpaperTexture,
    wallpaperView: wallpaperTexture.createView(),
    intermediateTexture,
    intermediateView: intermediateTexture.createView(),
    finalTexture,
    finalView: finalTexture.createView(),
  };
}

export function destroyBackdropTextures(textures: BackdropTextures): void {
  textures.wallpaperTexture.destroy();
  textures.intermediateTexture.destroy();
  textures.finalTexture.destroy();
}

export interface BackdropResources {
  readonly wallpaperUniformBuffer: GpuBufferLike;
  wallpaperBindGroup: GpuBindGroupLike;
  readonly blurHorizontalUniformBuffer: GpuBufferLike;
  blurHorizontalBindGroup: GpuBindGroupLike;
  readonly blurVerticalUniformBuffer: GpuBufferLike;
  blurVerticalBindGroup: GpuBindGroupLike;
}

/** One bind group per pass, each against this frame's own real
 * `textures` -- the horizontal blur pass's own bind group samples
 * `textures.wallpaperView`, the vertical pass's own samples
 * `textures.intermediateView`, so recreating `textures` (a resize,
 * `desktop_window_scene.ts`'s own resize handling) always has to be
 * followed by `rebindBackdropResources()` below, the same "dangling
 * view" concern `panel_pipeline.ts`'s own `rebindPanelResource()`
 * documents. */
export function createBackdropResources(device: GpuDeviceLike, pipelines: BackdropPipelines, textures: BackdropTextures, sampler: GpuSamplerLike): BackdropResources {
  const { buffer: bufferUsage } = gpuUsageFlags();
  const wallpaperUniformBuffer = device.createBuffer({ size: WALLPAPER_UNIFORM_SIZE_BYTES, usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST });
  const wallpaperBindGroup = device.createBindGroup({ layout: pipelines.wallpaperPipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: wallpaperUniformBuffer } }] });

  const blurHorizontalUniformBuffer = device.createBuffer({ size: BLUR_UNIFORM_SIZE_BYTES, usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST });
  const blurHorizontalBindGroup = device.createBindGroup({
    layout: pipelines.blurPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: blurHorizontalUniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: textures.wallpaperView },
    ],
  });

  const blurVerticalUniformBuffer = device.createBuffer({ size: BLUR_UNIFORM_SIZE_BYTES, usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST });
  const blurVerticalBindGroup = device.createBindGroup({
    layout: pipelines.blurPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: blurVerticalUniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: textures.intermediateView },
    ],
  });

  return { wallpaperUniformBuffer, wallpaperBindGroup, blurHorizontalUniformBuffer, blurHorizontalBindGroup, blurVerticalUniformBuffer, blurVerticalBindGroup };
}

export function rebindBackdropResources(device: GpuDeviceLike, pipelines: BackdropPipelines, resources: BackdropResources, textures: BackdropTextures, sampler: GpuSamplerLike): void {
  resources.blurHorizontalBindGroup = device.createBindGroup({
    layout: pipelines.blurPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: resources.blurHorizontalUniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: textures.wallpaperView },
    ],
  });
  resources.blurVerticalBindGroup = device.createBindGroup({
    layout: pipelines.blurPipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: resources.blurVerticalUniformBuffer } },
      { binding: 1, resource: sampler },
      { binding: 2, resource: textures.intermediateView },
    ],
  });
}

const wallpaperScratch = new Float32Array(WALLPAPER_UNIFORM_FLOAT_COUNT);
// Two separate scratch buffers, not one shared between both writes --
// a real `GPUQueue.writeBuffer()` copies its data argument immediately
// (`scene_renderer.ts`'s own `uniformScratch` already relies on this
// for one scratch array reused across sixteen entities), so one shared
// array would still be perfectly correct against a real device; it
// only breaks a *test* trying to inspect what either call was written
// with after the fact, once both writes have landed in the same
// backing array. Splitting them is one tiny extra allocation, once,
// that sidesteps the whole class of problem.
const blurHorizontalScratch = new Float32Array(BLUR_UNIFORM_FLOAT_COUNT);
const blurVerticalScratch = new Float32Array(BLUR_UNIFORM_FLOAT_COUNT);

export function writeBackdropUniforms(device: GpuDeviceLike, resources: BackdropResources, textures: BackdropTextures, nowSeconds: number): void {
  wallpaperScratch.set([nowSeconds, textures.width / textures.height, 0, 0], 0);
  device.queue.writeBuffer(resources.wallpaperUniformBuffer, 0, wallpaperScratch);

  const texelX = 1 / textures.width;
  const texelY = 1 / textures.height;
  blurHorizontalScratch.set([texelX, texelY, 1, 0], 0);
  device.queue.writeBuffer(resources.blurHorizontalUniformBuffer, 0, blurHorizontalScratch);
  blurVerticalScratch.set([texelX, texelY, 0, 1], 0);
  device.queue.writeBuffer(resources.blurVerticalUniformBuffer, 0, blurVerticalScratch);
}

/** The three real render passes, in the only order that's actually
 * correct: wallpaper (into `wallpaperTexture`) must finish before the
 * horizontal blur reads it, which must finish before the vertical blur
 * reads *its* own output -- one `GPUCommandEncoder`, three sequential
 * `beginRenderPass()`/`end()` pairs (a `GPUCommandEncoder` can only
 * ever have one render pass open at a time, so these cannot be
 * collapsed into one pass the way `panel_pipeline.ts`'s own panel
 * draws share a single pass with the text/icon draws). Leaves the
 * caller's own encoder open afterward -- `desktop_window_scene.ts`'s
 * own `renderFrame()` continues with the real, on-screen window-frame
 * pass against the very same encoder. */
export function drawBackdrop(encoder: GpuCommandEncoderLike, pipelines: BackdropPipelines, textures: BackdropTextures, resources: BackdropResources): void {
  const wallpaperPass = encoder.beginRenderPass({
    colorAttachments: [{ view: textures.wallpaperView, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store" }],
  });
  wallpaperPass.setPipeline(pipelines.wallpaperPipeline);
  wallpaperPass.setBindGroup(0, resources.wallpaperBindGroup);
  wallpaperPass.draw(3);
  wallpaperPass.end();

  const horizontalPass = encoder.beginRenderPass({
    colorAttachments: [{ view: textures.intermediateView, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store" }],
  });
  horizontalPass.setPipeline(pipelines.blurPipeline);
  horizontalPass.setBindGroup(0, resources.blurHorizontalBindGroup);
  horizontalPass.draw(3);
  horizontalPass.end();

  const verticalPass = encoder.beginRenderPass({
    colorAttachments: [{ view: textures.finalView, clearValue: { r: 0, g: 0, b: 0, a: 1 }, loadOp: "clear", storeOp: "store" }],
  });
  verticalPass.setPipeline(pipelines.blurPipeline);
  verticalPass.setBindGroup(0, resources.blurVerticalBindGroup);
  verticalPass.draw(3);
  verticalPass.end();
}

export function destroyBackdropResources(resources: BackdropResources): void {
  resources.wallpaperUniformBuffer.destroy();
  resources.blurHorizontalUniformBuffer.destroy();
  resources.blurVerticalUniformBuffer.destroy();
}
