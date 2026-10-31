import { deviceOrientationToRotation, lookAt, multiply, multiplyAll, perspective, rotation, scaleUniform, translation, type Mat4, type Vec3 } from "./mat4";
import { buildCubeMesh, buildSphereMesh, buildTexturedCubeMesh, type Mesh } from "./geometry";
import { createRandomEntity, createRandomEntities, stepEntity, type SceneBounds, type SceneEntity } from "./scene";
import { CAMERA_SHADER_WGSL, CAMERA_UNIFORM_FLOAT_COUNT, CAMERA_UNIFORM_SIZE_BYTES, ENTITY_UNIFORM_FLOAT_COUNT, ENTITY_UNIFORM_SIZE_BYTES, SCENE_SHADER_WGSL } from "./shader";
import { gpuUsageFlags, type GpuBindGroupLike, type GpuBufferLike, type GpuCanvasContextLike, type GpuDeviceLike, type GpuRenderPipelineLike, type GpuTextureLike } from "./webgpu_types";

const CAMERA_EYE: Vec3 = [0, 2, 10];
const CAMERA_TARGET: Vec3 = [0, 0, 0];
const CAMERA_UP: Vec3 = [0, 1, 0];
const FOV_Y_RADIANS = (55 * Math.PI) / 180;
const NEAR = 0.1;
const FAR = 100;

// How far an entity can wander toward/away from the camera -- a first
// version used +/-4 here and a *fixed*, aspect-blind x/y box, which is
// exactly what made every entity visibly cluster in a small central
// patch of the canvas no matter how wide or tall the real viewport
// was (confirmed on a real phone): most of the actual frustum sat
// unused outside that fixed box. +/-2.5 here, not +/-4, is deliberate
// too -- computeBounds() below has to stay safe at the *closest* z an
// entity can reach (the frustum is narrowest there), so a smaller
// Z_RANGE keeps that worst case close enough to the z=0 plane the
// camera is actually centred on for the computed x/y box to be worth
// having, rather than being squeezed back down toward the old fixed
// size to stay safe.
const Z_RANGE = 2.5;
// Fraction of the *true* frustum edge computeBounds() actually uses --
// safely under 1 so a cube's own far corner (half-extent past its
// own centre, stepEntity()'s own `bounds.max[axis] - entity.scale`
// clamp) never visibly clips the real edge of the canvas mid-bounce.
const BOUNDS_MARGIN = 0.85;

/** The box every entity bounces inside of (`scene.ts`'s own
 * `stepEntity()` docstring on why bouncing, not wrapping) -- derived
 * fresh from the camera's own real frustum at the given aspect ratio,
 * not a fixed guess. Sized against the *closest* z plane an entity can
 * reach (`CAMERA_EYE[2] - Z_RANGE`, the smallest camera distance, and
 * so the narrowest slice of the frustum): at any shallower z the real
 * visible area only gets more generous, so this is the one value safe
 * at every depth an entity actually visits, not just the z=0 plane the
 * camera happens to be centred on. Recomputed every `renderFrame()`
 * call (`aspect` is already recomputed there every frame regardless),
 * not cached -- cheap (a handful of trig calls), and the one thing
 * that actually makes the scene use "all of the canvas" on a resize,
 * not just at whatever aspect ratio happened to be current at
 * startup. */
export function computeBounds(aspect: number): SceneBounds {
  const nearDistance = CAMERA_EYE[2] - Z_RANGE;
  const halfHeight = nearDistance * Math.tan(FOV_Y_RADIANS / 2) * BOUNDS_MARGIN;
  const halfWidth = halfHeight * aspect;
  return { min: [-halfWidth, -halfHeight, -Z_RANGE], max: [halfWidth, halfHeight, Z_RANGE] };
}

const CUBE_COUNT = 8;
const SPHERE_COUNT = 8;
const CUBE_SIZE = 1.1;
const SPHERE_RADIUS = 0.6;
const SPHERE_LAT_SEGMENTS = 16;
const SPHERE_LON_SEGMENTS = 24;
const CAMERA_CUBE_SIZE = 3.2; // twice a regular CUBE_SIZE cube -- the live feed reads much better bigger, confirmed too small on a real phone

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

/** The narrow view `attachCamera()` needs of a real `CameraCapture`
 * (`common/data/camera_capture.ts`) -- `element`/`isReady`/`width`/
 * `height` only, the same "structural interface over the real class"
 * call `console_commands/types.ts`'s own `MetricsProvider` already
 * made, so this module (and its own tests) never needs to construct a
 * real `CameraCapture`, let alone a real camera, to exercise the
 * logic below. */
export interface CameraSource {
  readonly element: unknown;
  readonly isReady: boolean;
  readonly width: number;
  readonly height: number;
}

/** The narrow view `attachOrientation()` needs of a real
 * `DeviceOrientationSensor` (`common/data/device_orientation.ts`) --
 * its own raw `alpha`/`beta`/`gamma` reading only, the same
 * "structural interface over the real class" call `CameraSource`
 * above already makes. The conversion into an actual rotation matrix
 * (`mat4.ts`'s own `deviceOrientationToRotation()`) happens here, in
 * `renderFrame()`, not inside the sensor class itself --
 * `device_orientation.ts`'s own docstring on why a plain
 * `common/data/` class has no business reaching into this module's
 * own WebGPU/model-matrix concerns. */
export interface OrientationSource {
  readonly orientation: { alpha: number; beta: number; gamma: number } | undefined;
}

interface CameraResource {
  camera: CameraSource;
  entity: SceneEntity;
  pipeline: GpuRenderPipelineLike;
  meshBuffers: MeshBuffers;
  uniformBuffer: GpuBufferLike;
  bindGroup: GpuBindGroupLike;
  texture: GpuTextureLike;
  textureWidth: number;
  textureHeight: number;
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
 * own one-device-per-session lifecycle later.
 *
 * `attachCamera()` is a one-shot, optional add-on -- `gpu_canvas_view.ts`'s
 * own call site only ever calls it once a real `CameraCapture` has
 * already resolved its own `start()`, never before, and never if
 * camera access fails or is denied (the cube/sphere scene keeps
 * running either way). Calling it more than once for the same
 * renderer is a no-op -- there's never more than one camera cube.
 *
 * `attachOrientation()` is a second, independent optional add-on, not
 * bundled into `attachCamera()`'s own call -- camera access and device
 * orientation are two unrelated browser permissions that can each
 * succeed or fail on their own schedule (`gpu_canvas_view.ts`'s own
 * call sites start both at once but never wait on one for the other),
 * and the camera cube has to read sensibly either way: the camera
 * texture can be showing before orientation ever resolves (using its
 * own auto-rotation fallback until then), or orientation can arrive
 * before the camera does (simply held, unused, until a camera cube
 * actually exists to apply it to). Unlike `attachCamera()`, calling
 * this again is never a no-op -- a plain reference swap, not a GPU
 * resource allocation, so there's nothing wrong with overwriting it. */
export interface SceneRenderer {
  renderFrame(nowMs: number): void;
  attachCamera(camera: CameraSource): void;
  attachOrientation(orientation: OrientationSource): void;
  destroy(): void;
}

export function createSceneRenderer(device: GpuDeviceLike, context: GpuCanvasContextLike, format: string, canvas: HTMLCanvasElement): SceneRenderer {
  const pipeline = createScenePipeline(device, format);
  const cubeBuffers = uploadMesh(device, buildCubeMesh(CUBE_SIZE));
  const sphereBuffers = uploadMesh(device, buildSphereMesh(SPHERE_RADIUS, SPHERE_LAT_SEGMENTS, SPHERE_LON_SEGMENTS));
  // The canvas is already sized correctly here (GpuCanvasView's own
  // resize() runs before createSceneRenderer() is ever called), so
  // this is a real initial aspect ratio, not a square placeholder --
  // entities start out already spread across the real canvas instead
  // of snapping outward on the very first renderFrame() call.
  const initialAspect = Math.max(1, canvas.width) / Math.max(1, canvas.height);
  const entityResources = createRandomEntities(CUBE_COUNT, SPHERE_COUNT, computeBounds(initialAspect)).map((entity) => createEntityResource(device, pipeline, entity));

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
  let cameraResource: CameraResource | undefined;
  let orientationSource: OrientationSource | undefined;
  const cameraUniformScratch = new Float32Array(CAMERA_UNIFORM_FLOAT_COUNT);

  function attachOrientation(orientation: OrientationSource): void {
    orientationSource = orientation;
  }

  function attachCamera(camera: CameraSource): void {
    if (cameraResource) return; // already attached -- this class's own docstring on why that's a no-op, not an error
    const pipeline = createCameraPipeline(device, format);
    const meshBuffers = uploadMesh(device, buildTexturedCubeMesh(CAMERA_CUBE_SIZE));
    const { buffer: bufferUsage, texture: textureUsage } = gpuUsageFlags();
    const uniformBuffer = device.createBuffer({ size: alignTo4(CAMERA_UNIFORM_SIZE_BYTES), usage: bufferUsage.UNIFORM | bufferUsage.COPY_DST });
    const sampler = device.createSampler({ magFilter: "linear", minFilter: "linear" });
    // `attachCamera()`'s own docstring: only ever called once `camera`
    // has already resolved its own `start()`, so `width`/`height` are
    // real, non-zero dimensions here, not placeholders that would need
    // recreating later the way the depth texture's own size does.
    const texture = device.createTexture({
      size: [camera.width, camera.height],
      format: "rgba8unorm",
      // RENDER_ATTACHMENT is required here even though nothing in this
      // file ever renders to this texture directly -- a real, spec-
      // mandated requirement of copyExternalImageToTexture() itself
      // (most implementations perform that copy as an internal blit
      // through a render pass, not a plain memory copy, so the
      // destination texture's own usage must include it). Omitting it
      // was this feature's own first real bug, caught only by testing
      // on a real phone with a real camera: WebGPU validation errors
      // from a call like this are reported asynchronously (the
      // "uncapturederror" event / error scopes), never as a thrown
      // JS exception the catch block around start() could see, so the
      // texture just silently stayed at its zero-initialized default
      // -- a black cube, with nothing in the console to explain why.
      usage: textureUsage.TEXTURE_BINDING | textureUsage.COPY_DST | textureUsage.RENDER_ATTACHMENT,
    });
    const bindGroup = device.createBindGroup({
      layout: pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: uniformBuffer } },
        { binding: 1, resource: sampler },
        { binding: 2, resource: texture.createView() },
      ],
    });
    // computeBounds()'s own real argument matters far less here than
    // it does for the other sixteen entities -- position/velocity are
    // overwritten to [0,0,0] immediately below and never touched again
    // (this entity never passes through stepEntity() at all), so this
    // call only exists to satisfy createRandomEntity()'s own required
    // parameter; any bounds value would do.
    const entity = createRandomEntity("camera", computeBounds(Math.max(1, canvas.width) / Math.max(1, canvas.height)), Math.random);
    // Unlike the sixteen solid cubes/spheres, this one isn't meant to
    // be visually interchangeable with its own siblings -- there's
    // only ever one, so a fixed, predictable scale (not
    // createRandomEntity()'s own random 0.45-0.8 draw) is what
    // actually makes CAMERA_CUBE_SIZE's own value the real, reliable
    // control over how big the live feed reads on screen, rather than
    // a value a random multiplier could silently shrink back down by
    // more than half.
    entity.scale = 1;
    // Pinned at the centre, permanently -- the whole point of a camera
    // cube is to be the one fixed, easy-to-find thing in a scene full
    // of bouncing shapes, not another bouncing shape itself. Set once
    // here, never touched again (renderFrame()'s own camera branch no
    // longer calls stepEntity() for this entity at all), rather than
    // reset every frame for no reason.
    entity.position = [0, 0, 0];
    entity.velocity = [0, 0, 0];
    cameraResource = { camera, entity, pipeline, meshBuffers, uniformBuffer, bindGroup, texture, textureWidth: camera.width, textureHeight: camera.height };
  }

  function renderFrame(nowMs: number): void {
    if (lastFrameMs === undefined) lastFrameMs = nowMs;
    // Clamped, not raw -- a backgrounded tab resuming hours later would
    // otherwise hand every entity a single multi-hour step, launching
    // it clean out of bounds before stepEntity()'s own clamp-and-reflect
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

    const aspect = width / height;
    const projection = perspective(FOV_Y_RADIANS, aspect, NEAR, FAR);
    const view = lookAt(CAMERA_EYE, CAMERA_TARGET, CAMERA_UP);
    const viewProjection = multiply(projection, view);
    // Recomputed from the real, current aspect every frame
    // (computeBounds()'s own docstring on why) -- a resize changes
    // this the same instant it changes `aspect` above, not a stale
    // value left over from whatever size the canvas happened to be at
    // setup.
    const bounds = computeBounds(aspect);

    for (const resource of entityResources) {
      stepEntity(resource.entity, deltaSeconds, bounds);
      const model = multiplyAll(translation(resource.entity.position), rotation(resource.entity.rotationAxis, resource.entity.rotationAngle), scaleUniform(resource.entity.scale));
      const modelViewProjection = multiply(viewProjection, model);
      uniformScratch.set(modelViewProjection, 0);
      uniformScratch.set(model, 16);
      uniformScratch.set(resource.entity.color, 32);
      device.queue.writeBuffer(resource.uniformBuffer, 0, uniformScratch);
    }

    if (cameraResource) {
      // Never stepEntity()'d -- this entity's own position is pinned
      // at the origin for good (attachCamera()'s own docstring on
      // why), so there's no bounce physics to advance here, only
      // rotation. A real device-orientation reading, once one exists,
      // replaces the auto-spin entirely rather than blending with it
      // -- the cube should visibly track the phone's own real tilt,
      // not tilt-while-also-still-spinning-on-its-own, which would
      // read as broken, not responsive. Before a real reading ever
      // arrives (orientation unsupported, denied, or just not landed
      // yet), the existing auto-rotation keeps the cube from sitting
      // dead still, the same fallback behaviour this cube already had
      // before device orientation existed at all.
      const reading = orientationSource?.orientation;
      let rotationMatrix: Mat4;
      if (reading) {
        rotationMatrix = deviceOrientationToRotation(reading.alpha, reading.beta, reading.gamma);
      } else {
        cameraResource.entity.rotationAngle += cameraResource.entity.rotationSpeed * deltaSeconds;
        rotationMatrix = rotation(cameraResource.entity.rotationAxis, cameraResource.entity.rotationAngle);
      }
      const model = multiplyAll(translation(cameraResource.entity.position), rotationMatrix, scaleUniform(cameraResource.entity.scale));
      cameraUniformScratch.set(multiply(viewProjection, model), 0);
      device.queue.writeBuffer(cameraResource.uniformBuffer, 0, cameraUniformScratch);
      // A fresh video frame every render -- the live feed is only ever
      // as current as this frame's own copy, there's no caching of a
      // previous frame to skip it. Gated on isReady rather than
      // assumed: attachCamera() is only ever called once the camera
      // already resolved (so this is true from the very first frame in
      // practice), but checking costs nothing and avoids reading a
      // momentarily-stale video element if that assumption ever stops
      // holding (e.g. the underlying hardware is unplugged mid-session).
      if (cameraResource.camera.isReady) {
        device.queue.copyExternalImageToTexture({ source: cameraResource.camera.element }, { texture: cameraResource.texture }, [cameraResource.textureWidth, cameraResource.textureHeight]);
      }
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
    if (cameraResource) {
      pass.setPipeline(cameraResource.pipeline);
      pass.setBindGroup(0, cameraResource.bindGroup);
      pass.setVertexBuffer(0, cameraResource.meshBuffers.vertexBuffer);
      pass.setIndexBuffer(cameraResource.meshBuffers.indexBuffer, "uint16");
      pass.drawIndexed(cameraResource.meshBuffers.indexCount);
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
    if (cameraResource) {
      cameraResource.texture.destroy();
      cameraResource.meshBuffers.vertexBuffer.destroy();
      cameraResource.meshBuffers.indexBuffer.destroy();
      cameraResource.uniformBuffer.destroy();
      // No camera.stop() call here -- GpuCanvasView itself owns the
      // CameraCapture's own lifecycle (it constructed it, it attached
      // it here), so stopping the actual hardware stream is its own
      // job, in its own destroy(); this method only ever tears down
      // the GPU-side resources this renderer itself created.
      cameraResource = undefined;
    }
  }

  return { renderFrame, attachCamera, attachOrientation, destroy };
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

/** `createScenePipeline()`'s own twin for the camera cube -- same
 * `"triangle-list"`/`cullMode: "back"`/depth-tested shape (a solid
 * cube, same as the others, so standard back-face culling is already
 * correct -- no need for the double-sided rendering a thin flat quad
 * would have needed instead), but its own vertex layout
 * (`buildTexturedCubeMesh()`'s own position+uv, not position+normal)
 * and its own shader (`CAMERA_SHADER_WGSL`, unlit). */
function createCameraPipeline(device: GpuDeviceLike, format: string): GpuRenderPipelineLike {
  const shaderModule = device.createShaderModule({ code: CAMERA_SHADER_WGSL });
  return device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module: shaderModule,
      entryPoint: "vs_camera",
      buffers: [
        {
          arrayStride: 20, // 5 floats (position + uv), geometry.ts's own buildTexturedCubeMesh() layout
          attributes: [
            { shaderLocation: 0, offset: 0, format: "float32x3" },
            { shaderLocation: 1, offset: 12, format: "float32x2" },
          ],
        },
      ],
    },
    fragment: { module: shaderModule, entryPoint: "fs_camera", targets: [{ format }] },
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
