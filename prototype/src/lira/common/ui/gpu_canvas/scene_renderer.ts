import { lookAt, multiply, multiplyAll, perspective, rotation, scaleUniform, translation, type Vec3 } from "./mat4";
import { buildCubeMesh, buildSphereMesh, type Mesh } from "./geometry";
import { createRandomEntities, stepEntity, type SceneBounds, type SceneEntity } from "./scene";
import { ENTITY_UNIFORM_FLOAT_COUNT, ENTITY_UNIFORM_SIZE_BYTES, SCENE_SHADER_WGSL } from "./shader";
import { gpuUsageFlags, type GpuBindGroupLike, type GpuBufferLike, type GpuCanvasContextLike, type GpuDeviceLike, type GpuRenderPipelineLike, type GpuTextureLike } from "./webgpu_types";

const CAMERA_EYE: Vec3 = [0, 2, 10];
const CAMERA_TARGET: Vec3 = [0, 0, 0];
const CAMERA_UP: Vec3 = [0, 1, 0];
const FOV_Y_RADIANS = (55 * Math.PI) / 180;
const NEAR = 0.1;
const FAR = 100;

// The box every entity bounces inside of (scene.ts's own stepEntity()
// docstring on why bouncing, not wrapping) -- sized to stay well
// within CAMERA_EYE's own frustum at every point along each axis, not
// derived from the frustum itself: a fixed box is simpler to reason
// about than one that would need recomputing on every resize (aspect
// ratio changes the horizontal half of the frustum, not the vertical).
const BOUNDS: SceneBounds = { min: [-4, -2.5, -4], max: [4, 2.5, 4] };

const CUBE_COUNT = 8;
const SPHERE_COUNT = 8;
const CUBE_SIZE = 1.1;
const SPHERE_RADIUS = 0.6;
const SPHERE_LAT_SEGMENTS = 16;
const SPHERE_LON_SEGMENTS = 24;

const CLEAR_COLOR = { r: 0.04, g: 0.05, b: 0.08, a: 1 };
const DEPTH_FORMAT = "depth24plus";

interface MeshBuffers {
  vertexBuffer: GpuBufferLike;
  indexBuffer: GpuBufferLike;
  indexCount: number;
}

interface EntityResource {
  entity: SceneEntity;
  uniformBuffer: GpuBufferLike;
  bindGroup: GpuBindGroupLike;
}

/** The whole live scene -- `GpuCanvasView`'s own per-frame loop calls
 * `renderFrame()` once per `requestAnimationFrame` tick; `destroy()`
 * tears down every GPU resource this created. `GpuCanvasView.destroy()`
 * already calls `device.destroy()`, which would eventually reclaim all
 * of these anyway, but explicit per-resource `destroy()` calls here
 * are the same "don't rely on cascading teardown" discipline this
 * session's own device-leak bug (`gpu_canvas_view.ts`'s own design-log
 * entry) was about -- cheap to do, and keeps this renderer safe to
 * tear down on its own if it's ever reused outside `GpuCanvasView`'s
 * own one-device-per-session lifecycle later. */
export interface SceneRenderer {
  renderFrame(nowMs: number): void;
  destroy(): void;
}

export function createSceneRenderer(device: GpuDeviceLike, context: GpuCanvasContextLike, format: string, canvas: HTMLCanvasElement): SceneRenderer {
  const pipeline = createScenePipeline(device, format);
  const cubeBuffers = uploadMesh(device, buildCubeMesh(CUBE_SIZE));
  const sphereBuffers = uploadMesh(device, buildSphereMesh(SPHERE_RADIUS, SPHERE_LAT_SEGMENTS, SPHERE_LON_SEGMENTS));
  const entityResources = createRandomEntities(CUBE_COUNT, SPHERE_COUNT, BOUNDS).map((entity) => createEntityResource(device, pipeline, entity));

  // Reused every entity, every frame -- one allocation for the whole
  // session instead of one new Float32Array per entity per frame (at
  // 60fps with sixteen entities that's ~1000 short-lived allocations a
  // second otherwise, pure churn for the GC to chase).
  const uniformScratch = new Float32Array(ENTITY_UNIFORM_FLOAT_COUNT);

  let depthTexture: GpuTextureLike | undefined;
  let depthView: unknown;
  let depthWidth = 0;
  let depthHeight = 0;
  let lastFrameMs: number | undefined;

  function renderFrame(nowMs: number): void {
    if (lastFrameMs === undefined) lastFrameMs = nowMs;
    // Clamped, not raw -- a backgrounded tab resuming hours later would
    // otherwise hand every entity a single multi-hour step, launching
    // it clean out of BOUNDS before stepEntity()'s own clamp-and-reflect
    // logic even has a chance to run on a *subsequent* frame.
    const deltaSeconds = Math.min((nowMs - lastFrameMs) / 1000, 0.1);
    lastFrameMs = nowMs;

    const width = Math.max(1, canvas.width);
    const height = Math.max(1, canvas.height);
    if (!depthTexture || depthWidth !== width || depthHeight !== height) {
      depthTexture?.destroy();
      depthTexture = createDepthTexture(device, width, height);
      depthView = depthTexture.createView();
      depthWidth = width;
      depthHeight = height;
    }

    const projection = perspective(FOV_Y_RADIANS, width / height, NEAR, FAR);
    const view = lookAt(CAMERA_EYE, CAMERA_TARGET, CAMERA_UP);
    const viewProjection = multiply(projection, view);

    for (const resource of entityResources) {
      stepEntity(resource.entity, deltaSeconds, BOUNDS);
      const model = multiplyAll(translation(resource.entity.position), rotation(resource.entity.rotationAxis, resource.entity.rotationAngle), scaleUniform(resource.entity.scale));
      const modelViewProjection = multiply(viewProjection, model);
      uniformScratch.set(modelViewProjection, 0);
      uniformScratch.set(model, 16);
      uniformScratch.set(resource.entity.color, 32);
      device.queue.writeBuffer(resource.uniformBuffer, 0, uniformScratch);
    }

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginRenderPass({
      colorAttachments: [{ view: context.getCurrentTexture().createView(), clearValue: CLEAR_COLOR, loadOp: "clear", storeOp: "store" }],
      depthStencilAttachment: { view: depthView, depthClearValue: 1, depthLoadOp: "clear", depthStoreOp: "store" },
    });
    pass.setPipeline(pipeline);
    for (const resource of entityResources) {
      const buffers = resource.entity.kind === "cube" ? cubeBuffers : sphereBuffers;
      pass.setBindGroup(0, resource.bindGroup);
      pass.setVertexBuffer(0, buffers.vertexBuffer);
      pass.setIndexBuffer(buffers.indexBuffer, "uint16");
      pass.drawIndexed(buffers.indexCount);
    }
    pass.end();
    device.queue.submit([encoder.finish()]);
  }

  function destroy(): void {
    depthTexture?.destroy();
    cubeBuffers.vertexBuffer.destroy();
    cubeBuffers.indexBuffer.destroy();
    sphereBuffers.vertexBuffer.destroy();
    sphereBuffers.indexBuffer.destroy();
    for (const resource of entityResources) resource.uniformBuffer.destroy();
  }

  return { renderFrame, destroy };
}

function createScenePipeline(device: GpuDeviceLike, format: string): GpuRenderPipelineLike {
  const shaderModule = device.createShaderModule({ code: SCENE_SHADER_WGSL });
  return device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_main",
      buffers: [
        {
          arrayStride: 24, // 6 floats (position + normal), geometry.ts's own interleaved layout
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" },
            { shaderLocation: 1, offset: 12, format: "float32x3" },
          ],
        },
      ],
    },
    fragment: { module: shaderModule, entryPoint: "fs_main", targets: [{ format }] },
    primitive: { topology: "triangle-list", cullMode: "back" },
    depthStencil: { format: DEPTH_FORMAT, depthWriteEnabled: true, depthCompare: "less" },
  });
}

function createDepthTexture(device: GpuDeviceLike, width: number, height: number): GpuTextureLike {
  const { texture: textureUsage } = gpuUsageFlags();
  return device.createTexture({ size: [width, height], format: DEPTH_FORMAT, usage: textureUsage.RENDER_ATTACHMENT });
}

function createEntityResource(device: GpuDeviceLike, pipeline: GpuRenderPipelineLike, entity: SceneEntity): EntityResource {
  const { buffer: bufferUsage } = gpuUsageFlags();
  const uniformBuffer = device.createBuffer({ size: alignTo4(ENTITY_UNIFORM_SIZE_BYTES), usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST });
  const bindGroup = device.createBindGroup({ layout: pipeline.getBindGroupLayout(0), entries: [{ binding: 0, resource: { buffer: uniformBuffer } }] });
  return { entity, uniformBuffer, bindGroup };
}

function uploadMesh(device: GpuDeviceLike, mesh: Mesh): MeshBuffers {
  const { buffer: bufferUsage } = gpuUsageFlags();
  const vertexBuffer = device.createBuffer({ size: alignTo4(mesh.vertices.byteLength), usage: bufferUsage.VERTEX | bufferUsage.COPY_DST });
  device.queue.writeBuffer(vertexBuffer, 0, mesh.vertices);
  const indexBuffer = device.createBuffer({ size: alignTo4(mesh.indices.byteLength), usage: bufferUsage.INDEX | bufferUsage.COPY_DST });
  device.queue.writeBuffer(indexBuffer, 0, mesh.indices);
  return { vertexBuffer, indexBuffer, indexCount: mesh.indices.length };
}

/** `GPUQueue.writeBuffer()`'s own real constraint: the copy size must
 * be a multiple of 4 bytes. Every real buffer this module creates
 * already satisfies that on its own (`Float32Array`s always do;
 * `geometry.ts`'s own index counts are always a multiple of 6, so
 * always even, so a `Uint16Array`'s own byte length is always a
 * multiple of 4 too) -- this is defensive, not covering a case that
 * actually occurs today, the same spirit as `GpuCanvasView`'s own
 * `Math.max(1, ...)` resize guard. */
function alignTo4(byteLength: number): number {
  return Math.ceil(byteLength / 4) * 4;
}
