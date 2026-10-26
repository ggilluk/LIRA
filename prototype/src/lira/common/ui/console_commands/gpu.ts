import type { ConsoleCommand } from "./types";

/** TypeScript's own bundled `lib.dom.d.ts` (tsconfig.json's own `"lib"`
 * list) doesn't declare WebGPU at all -- no `@webgpu/types` dependency
 * exists in this project, the same call this codebase already made for
 * `performance.memory` (vocabulary_worker.ts's own `handleMetrics()`):
 * a narrow local type for exactly the handful of real fields this
 * command reads, cast onto the real global, rather than pulling in a
 * whole external type package for one command file. These interfaces
 * describe the real WebGPU spec shapes (GPUAdapter/GPUAdapterInfo/
 * GPUSupportedLimits), not anything invented. */
interface GpuAdapterInfoLike {
  vendor: string;
  architecture: string;
  device: string;
  description: string;
}

/** Every limit name WebGPU's own spec defines on `GPUSupportedLimits`
 * -- hardcoded here for the same reason `df.ts`'s own column headers
 * are hardcoded: these are real spec-defined field names, not data,
 * and `GPUSupportedLimits`'s real values are defined as getters on its
 * own prototype rather than enumerable own properties, so there is no
 * way to discover this list by enumerating a real adapter's `limits`
 * object at runtime -- it has to be named. */
interface GpuAdapterLimitsLike {
  maxTextureDimension1D: number;
  maxTextureDimension2D: number;
  maxTextureDimension3D: number;
  maxTextureArrayLayers: number;
  maxBindGroups: number;
  maxBindGroupsPlusVertexBuffers: number;
  maxBindingsPerBindGroup: number;
  maxDynamicUniformBuffersPerPipelineLayout: number;
  maxDynamicStorageBuffersPerPipelineLayout: number;
  maxSampledTexturesPerShaderStage: number;
  maxSamplersPerShaderStage: number;
  maxStorageBuffersPerShaderStage: number;
  maxStorageTexturesPerShaderStage: number;
  maxUniformBuffersPerShaderStage: number;
  maxUniformBufferBindingSize: number;
  maxStorageBufferBindingSize: number;
  minUniformBufferOffsetAlignment: number;
  minStorageBufferOffsetAlignment: number;
  maxVertexBuffers: number;
  maxBufferSize: number;
  maxVertexAttributes: number;
  maxVertexBufferArrayStride: number;
  maxInterStageShaderVariables: number;
  maxColorAttachments: number;
  maxColorAttachmentBytesPerSample: number;
  maxComputeWorkgroupStorageSize: number;
  maxComputeInvocationsPerWorkgroup: number;
  maxComputeWorkgroupSizeX: number;
  maxComputeWorkgroupSizeY: number;
  maxComputeWorkgroupSizeZ: number;
  maxComputeWorkgroupsPerDimension: number;
}

const LIMIT_NAMES: readonly (keyof GpuAdapterLimitsLike)[] = [
  "maxTextureDimension1D",
  "maxTextureDimension2D",
  "maxTextureDimension3D",
  "maxTextureArrayLayers",
  "maxBindGroups",
  "maxBindGroupsPlusVertexBuffers",
  "maxBindingsPerBindGroup",
  "maxDynamicUniformBuffersPerPipelineLayout",
  "maxDynamicStorageBuffersPerPipelineLayout",
  "maxSampledTexturesPerShaderStage",
  "maxSamplersPerShaderStage",
  "maxStorageBuffersPerShaderStage",
  "maxStorageTexturesPerShaderStage",
  "maxUniformBuffersPerShaderStage",
  "maxUniformBufferBindingSize",
  "maxStorageBufferBindingSize",
  "minUniformBufferOffsetAlignment",
  "minStorageBufferOffsetAlignment",
  "maxVertexBuffers",
  "maxBufferSize",
  "maxVertexAttributes",
  "maxVertexBufferArrayStride",
  "maxInterStageShaderVariables",
  "maxColorAttachments",
  "maxColorAttachmentBytesPerSample",
  "maxComputeWorkgroupStorageSize",
  "maxComputeInvocationsPerWorkgroup",
  "maxComputeWorkgroupSizeX",
  "maxComputeWorkgroupSizeY",
  "maxComputeWorkgroupSizeZ",
  "maxComputeWorkgroupsPerDimension",
];

interface GpuAdapterLike {
  readonly isFallbackAdapter: boolean;
  readonly limits: GpuAdapterLimitsLike;
  readonly features: Iterable<string>;
  readonly info?: GpuAdapterInfoLike;
  requestAdapterInfo?: () => Promise<GpuAdapterInfoLike>;
}

interface NavigatorGpuLike {
  requestAdapter(): Promise<GpuAdapterLike | null>;
  getPreferredCanvasFormat(): string;
}

function gpuOf(nav: Navigator): NavigatorGpuLike | undefined {
  return (nav as Navigator & { gpu?: NavigatorGpuLike }).gpu;
}

/** `GPUAdapter.info`'s own real history -- a synchronous property in
 * current browsers, reached via the now-deprecated async
 * `requestAdapterInfo()` method in older ones that shipped WebGPU
 * before the spec settled. Tries the current shape first, falls back
 * to the deprecated one only if that's all a given browser actually
 * offers, and returns `undefined` -- not a guess -- if neither exists
 * at all. */
async function resolveAdapterInfo(adapter: GpuAdapterLike): Promise<GpuAdapterInfoLike | undefined> {
  if (adapter.info) return adapter.info;
  if (typeof adapter.requestAdapterInfo === "function") return adapter.requestAdapterInfo();
  return undefined;
}

/** A blank string is `GPUAdapterInfo`'s own real, honest answer for a
 * field a browser deliberately withholds for fingerprinting resistance
 * -- not a missing value this command failed to read. Shown as `-`
 * for the same "nothing honest to print" reason every other blank
 * field in this Console (`ps`'s own HEAP columns) gets one, rather
 * than printing a confusing empty cell. */
function displayField(value: string | undefined): string {
  return value && value.length > 0 ? value : "-";
}

/** `nvidia-smi`/`vulkaninfo`'s own territory, as far as a browser
 * sandbox actually exposes it -- one real `GPUAdapter`, queried with
 * no options (`requestAdapter()`'s own `powerPreference` hint isn't
 * guaranteed to surface a second, different adapter even on a
 * dual-GPU machine, so querying it twice would add a real negotiation
 * delay for no guaranteed new information) and never promoted to a
 * `GPUDevice` -- a device is a real, destroy()-needing resource
 * allocation this command has no reason to make just to read
 * adapter-level limits/features, which are already visible without
 * one. Unsupported browsers and adapter-less sandboxes are real,
 * common outcomes (not bugs), reported the same way `cd`'s own
 * "no such directory" is: a thrown bash-style message, not fabricated
 * rows. */
export const gpuCommand: ConsoleCommand = {
  name: "gpu",
  description: "report real GPU adapter information via WebGPU",
  run: async () => {
    const gpu = gpuOf(navigator);
    if (!gpu) throw new Error("gpu: WebGPU is not supported in this browser (navigator.gpu is undefined)");

    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error("gpu: WebGPU is supported, but no GPU adapter is available (requestAdapter() returned null)");

    const info = await resolveAdapterInfo(adapter);
    const features = Array.from(adapter.features).sort();

    const lines: string[] = [
      "Adapter",
      `  vendor               ${displayField(info?.vendor)}`,
      `  architecture         ${displayField(info?.architecture)}`,
      `  device               ${displayField(info?.device)}`,
      `  description          ${displayField(info?.description)}`,
      `  fallback adapter     ${adapter.isFallbackAdapter}`,
      `  preferred canvas fmt ${gpu.getPreferredCanvasFormat()}`,
      "",
      `Features (${features.length})`,
      ...(features.length > 0 ? features.map((name) => `  ${name}`) : ["  (none)"]),
      "",
      "Limits",
      ...LIMIT_NAMES.map((name) => `  ${name.padEnd(42)}${adapter.limits[name].toLocaleString()}`),
    ];
    return lines;
  },
};
