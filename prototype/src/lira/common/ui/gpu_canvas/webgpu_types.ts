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

export interface GpuRenderPipelineLike {
  getBindGroupLayout(index: number): unknown;
}

export interface GpuRenderPassEncoderLike {
  setPipeline(pipeline: GpuRenderPipelineLike): void;
  setBindGroup(index: number, bindGroup: GpuBindGroupLike): void;
  setVertexBuffer(slot: number, buffer: GpuBufferLike): void;
  setIndexBuffer(buffer: GpuBufferLike, format: "uint16" | "uint32"): void;
  drawIndexed(indexCount: number): void;
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
}

export interface GpuDeviceLike {
  readonly queue: GpuQueueLike;
  createBuffer(descriptor: { size: number; usage: number }): GpuBufferLike;
  createTexture(descriptor: unknown): GpuTextureLike;
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
  texture: { RENDER_ATTACHMENT: number };
} {
  const g = globalThis as unknown as {
    GPUBufferUsage: { VERTEX: number; INDEX: number; UNIFORM: number; COPY_DST: number };
    GPUTextureUsage: { RENDER_ATTACHMENT: number };
  };
  return { buffer: g.GPUBufferUsage, texture: g.GPUTextureUsage };
}
