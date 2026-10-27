/** `scene_renderer.ts`'s own vertex/fragment shader -- one pipeline
 * serves both the cube and sphere draws (`geometry.ts`'s own shared
 * interleaved `[position, normal]` vertex layout), each entity telling
 * them apart only by which vertex/index buffers are bound and which
 * per-entity uniform values it submits. `modelViewProj` is precomputed
 * on the CPU (one matrix multiply per entity per frame, `mat4.ts`'s
 * own `multiply()`) rather than passing `view`/`proj`/`model`
 * separately and multiplying per-vertex on the GPU -- with this
 * vertex count that's a wash for raw throughput, but it keeps the
 * uniform struct, and this shader, simpler. `model` alone is also
 * uploaded, purely to carry vertex normals into world space (every
 * entity here is uniformly scaled, so the model matrix itself is a
 * valid normal transform -- no separate inverse-transpose normal
 * matrix needed, which would only matter under non-uniform scale). */
export const SCENE_SHADER_WGSL = `
struct Uniforms {
  modelViewProj: mat4x4<f32>,
  model: mat4x4<f32>,
  color: vec4<f32>,
};
@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOut {
  @builtin(position) clipPosition: vec4<f32>,
  @location(0) worldNormal: vec3<f32>,
};

@vertex
fn vs_main(@location(0) position: vec3<f32>, @location(1) normal: vec3<f32>) -> VertexOut {
  var out: VertexOut;
  out.clipPosition = uniforms.modelViewProj * vec4<f32>(position, 1.0);
  out.worldNormal = (uniforms.model * vec4<f32>(normal, 0.0)).xyz;
  return out;
}

@fragment
fn fs_main(in: VertexOut) -> @location(0) vec4<f32> {
  let lightDir = normalize(vec3<f32>(0.4, 0.8, 0.6));
  let n = normalize(in.worldNormal);
  let diffuse = max(dot(n, lightDir), 0.0);
  let ambient = 0.25;
  let intensity = ambient + diffuse * 0.75;
  return vec4<f32>(uniforms.color.rgb * intensity, uniforms.color.a);
}
`;

/** Bytes per entity's own uniform buffer -- `mat4x4<f32>` (64) twice
 * plus `vec4<f32>` (16) once, laid out in exactly `Uniforms`' own
 * field order above. Each entity gets its own whole buffer (not one
 * shared buffer with per-entity offsets), so this is the buffer's
 * total size, not an array stride -- no `minUniformBufferOffsetAlignment`
 * concerns (`scene_renderer.ts`'s own docstring on why). */
export const ENTITY_UNIFORM_SIZE_BYTES = 64 + 64 + 16;

/** `ENTITY_UNIFORM_SIZE_BYTES`'s own float count -- the length
 * `scene_renderer.ts`'s own per-frame `Float32Array` scratch buffer
 * allocates once and reuses for every entity's `writeBuffer()` call. */
export const ENTITY_UNIFORM_FLOAT_COUNT = ENTITY_UNIFORM_SIZE_BYTES / 4;
