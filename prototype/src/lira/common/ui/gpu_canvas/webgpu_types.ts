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
 * │ Module Name     │ lira/common/ui/gpu_canvas/webgpu_types
 * │ Filename        │ webgpu_types.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-10-27
 * │ Modified Date   │ 2026-10-29
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Minimal structural WebGPU type declarations, since the bundled
 * │                 │ DOM types declare none and the project has no @webgpu/types.
 * │                 │
 * │                 │
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/webgpu_types
 * @file webgpu_types.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** TypeScript's own bundled `lib.dom.d.ts` declares no WebGPU types at
 * all (confirmed directly -- `console_commands/gpu.ts`'s own
 * docstring), and no `@webgpu/types` dependency exists in this
 * project. This is `scene_renderer.ts`'s own narrow local shim --
 * deliberately separate from `gpu_canvas_view.ts`'s own (which only
 * ever needs `requestDevice()`/`destroy()`, nothing about pipelines or
 * buffers): the two files' real overlap is one method, not enough to
 * be worth coupling them to one shared "the whole WebGPU API" module. */

export interface GpuBufferLike {
  destroy(): void;
}

export interface GpuTextureViewLike {}

export interface GpuTextureLike {
  createView(): GpuTextureViewLike;
  destroy(): void;
}

export interface GpuBindGroupLike {}

export interface GpuSamplerLike {}

export interface GpuRenderPipelineLike {
  getBindGroupLayout(index: number): unknown;
}

export interface GpuRenderPassEncoderLike {
  setPipeline(pipeline: GpuRenderPipelineLike): void;
  setBindGroup(index: number, bindGroup: GpuBindGroupLike): void;
  setVertexBuffer(slot: number, buffer: GpuBufferLike): void;
  setIndexBuffer(buffer: GpuBufferLike, format: "uint16" | "uint32"): void;
  drawIndexed(indexCount: number): void;
  // `desktop_ui/backdrop.ts`'s own wallpaper and blur passes draw a
  // full-screen triangle with no vertex/index buffer at all (3
  // positions synthesised in the vertex shader from `@builtin(vertex_index)`
  // -- the standard, buffer-free full-screen-pass trick), hence a
  // plain vertex-count `draw()` alongside `drawIndexed()` above, not a
  // replacement for it: every other pipeline in this folder still
  // draws real, buffer-backed geometry via `drawIndexed()`.
  draw(vertexCount: number): void;
  end(): void;
}

export interface GpuCommandEncoderLike {
  beginRenderPass(descriptor: unknown): GpuRenderPassEncoderLike;
  finish(): unknown;
}

export interface GpuQueueLike {
  submit(buffers: readonly unknown[]): void;
  // `Float32Array | Uint16Array`, not lib.dom's own `BufferSource` --
  // those are the only two typed-array kinds this module ever uploads
  // (`scene_renderer.ts`'s own mesh/uniform data), and TypeScript's
  // newer generic `ArrayBufferView<TArrayBuffer>` typing for
  // `BufferSource` rejects a plain `Float32Array` over a plain,
  // non-generic-pinned `ArrayBufferLike` outright -- naming the real
  // two types used sidesteps that mismatch instead of fighting it.
  writeBuffer(buffer: GpuBufferLike, offset: number, data: Float32Array | Uint16Array): void;
  // `source`/`destination`/`copySize` left as `unknown` like every
  // other descriptor object in this shim -- `scene_renderer.ts`'s own
  // `attachCamera()` is the one caller, passing a real
  // `GPUImageCopyExternalImage`/`GPUImageCopyTexture`/`GPUExtent3D`
  // literal each time, never read back here.
  copyExternalImageToTexture(source: unknown, destination: unknown, copySize: unknown): void;
  // `desktop_ui/font_atlas.ts`'s own baked glyph bitmap is the one
  // other real pixel payload this whole gpu_canvas folder ever uploads
  // (`desktop_ui/text_pipeline.ts`'s own call site) -- a plain CPU-side
  // `Uint8ClampedArray` (the exact type `CanvasRenderingContext2D.getImageData()`
  // itself returns), not a live external image source the way the
  // camera cube's own frame is, so `writeTexture()` (a direct memory
  // upload) is the correct call here, not `copyExternalImageToTexture()`.
  writeTexture(destination: unknown, data: Uint8ClampedArray, dataLayout: unknown, size: unknown): void;
}

export interface GpuDeviceLike {
  readonly queue: GpuQueueLike;
  createBuffer(descriptor: { size: number; usage: number }): GpuBufferLike;
  createTexture(descriptor: unknown): GpuTextureLike;
  createSampler(descriptor: unknown): GpuSamplerLike;
  createShaderModule(descriptor: { code: string }): unknown;
  createRenderPipeline(descriptor: unknown): GpuRenderPipelineLike;
  createBindGroup(descriptor: unknown): GpuBindGroupLike;
  createCommandEncoder(): GpuCommandEncoderLike;
  destroy(): void;
}

export interface GpuCanvasContextLike {
  configure(config: unknown): void;
  getCurrentTexture(): GpuTextureLike;
}

/** The real `GPUBufferUsage`/`GPUTextureUsage`/`GPUShaderStage` flag
 * namespaces are genuine runtime globals in a WebGPU-supporting
 * browser (independent of whatever TypeScript lib does or doesn't
 * declare -- the same gap `gpuOf()`-style casts work around elsewhere
 * in this module). Reading the *real* constants off `globalThis`
 * here, rather than hardcoding their numeric values by hand, is the
 * same "never fabricate" call this whole Console/Canvas feature set
 * has made everywhere else -- a hand-copied magic number could silently
 * drift from the real spec value; this can't. */
export function gpuUsageFlags(): {
  buffer: { VERTEX: number; INDEX: number; UNIFORM: number; COPY_DST: number };
  texture: { RENDER_ATTACHMENT: number; TEXTURE_BINDING: number; COPY_DST: number };
} {
  const g = globalThis as unknown as {
    GPUBufferUsage: { VERTEX: number; INDEX: number; UNIFORM: number; COPY_DST: number };
    GPUTextureUsage: { RENDER_ATTACHMENT: number; TEXTURE_BINDING: number; COPY_DST: number };
  };
  return { buffer: g.GPUBufferUsage, texture: g.GPUTextureUsage };
}
