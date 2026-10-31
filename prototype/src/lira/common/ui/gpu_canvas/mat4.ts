/** Minimal 4x4 matrix math for `scene_renderer.ts`'s own camera/model
 * transforms -- column-major `Float32Array(16)`, the same layout WGSL's
 * own `mat4x4<f32>` and every WebGPU sample expects, so a matrix built
 * here can be copied straight into a uniform buffer with no reordering.
 * No `gl-matrix` dependency: the handful of operations an orbiting-
 * camera-plus-TRS-model scene actually needs (`perspective`, `lookAt`,
 * `translation`, `rotation`, `scaleUniform`, `multiply`) is small enough
 * that a real dependency would outweigh what it saves, the same call
 * this session already made for `@webgpu/types`. */

export type Mat4 = Float32Array;
export type Vec3 = readonly [number, number, number];

export function identity(): Mat4 {
  // prettier-ignore
  return new Float32Array([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
  ]);
}

/** `a * b` -- composes two transforms so that applying the result to a
 * point is the same as applying `b` first, then `a` (`multiplyAll()`'s
 * own docstring below on why that's the order `scene_renderer.ts`
 * builds a TRS model matrix in). */
export function multiply(a: Mat4, b: Mat4): Mat4 {
  const out = new Float32Array(16);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[k * 4 + row] * b[col * 4 + k];
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

/** Left-to-right composition: `multiplyAll(T, R, S)` builds the usual
 * Translate-Rotate-Scale model matrix, i.e. `T * R * S`, so a point is
 * scaled first, then rotated, then translated -- the natural "object
 * space out to world space" order `scene_renderer.ts`'s own per-entity
 * model matrix is built in. */
export function multiplyAll(...matrices: readonly Mat4[]): Mat4 {
  return matrices.reduce((acc, m) => multiply(acc, m), identity());
}

export function translation([x, y, z]: Vec3): Mat4 {
  const m = identity();
  m[12] = x;
  m[13] = y;
  m[14] = z;
  return m;
}

export function scaleUniform(s: number): Mat4 {
  const m = identity();
  m[0] = s;
  m[5] = s;
  m[10] = s;
  return m;
}

/** Rodrigues' rotation formula around a unit `axis` -- `axis` is
 * assumed already normalized (`scene.ts`'s own entity creation
 * normalizes every random axis exactly once, at creation, rather than
 * every frame this would otherwise re-normalize for no reason). */
export function rotation([x, y, z]: Vec3, angleRadians: number): Mat4 {
  const c = Math.cos(angleRadians);
  const s = Math.sin(angleRadians);
  const t = 1 - c;
  // prettier-ignore
  return new Float32Array([
    t * x * x + c,     t * x * y + s * z, t * x * z - s * y, 0,
    t * x * y - s * z, t * y * y + c,     t * y * z + s * x, 0,
    t * x * z + s * y, t * y * z - s * x, t * z * z + c,     0,
    0,                 0,                 0,                 1,
  ]);
}

/** Right-handed perspective projection into WebGPU's own clip space
 * (depth range `[0, 1]`, not OpenGL's `[-1, 1]`) -- the same formula
 * WebGPU's own sample code (and `wgpu-matrix`'s `perspectiveZO`) uses;
 * get it wrong and every depth comparison in the pipeline's own
 * `depthCompare: "less"` state would be silently off. */
export function perspective(fovYRadians: number, aspect: number, near: number, far: number): Mat4 {
  const f = 1 / Math.tan(fovYRadians / 2);
  const rangeInv = 1 / (near - far);
  // prettier-ignore
  return new Float32Array([
    f / aspect, 0, 0,                      0,
    0,          f, 0,                      0,
    0,          0, far * rangeInv,        -1,
    0,          0, far * near * rangeInv,  0,
  ]);
}

/** Right-handed look-at view matrix (world space -> view space, camera
 * looking down its own local -Z). Standard glMatrix-equivalent
 * formula, column-major to match this module's own convention. */
export function lookAt(eye: Vec3, target: Vec3, up: Vec3): Mat4 {
  const zAxis = normalize(subtract(eye, target));
  const xAxis = normalize(cross(up, zAxis));
  const yAxis = cross(zAxis, xAxis);
  // prettier-ignore
  return new Float32Array([
    xAxis[0], yAxis[0], zAxis[0], 0,
    xAxis[1], yAxis[1], zAxis[1], 0,
    xAxis[2], yAxis[2], zAxis[2], 0,
    -dot(xAxis, eye), -dot(yAxis, eye), -dot(zAxis, eye), 1,
  ]);
}

function subtract(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

export function normalize(v: Vec3): Vec3 {
  const length = Math.hypot(v[0], v[1], v[2]);
  if (length === 0) return [0, 0, 0];
  return [v[0] / length, v[1] / length, v[2] / length];
}

/** `common/data/device_orientation.ts`'s own `DeviceOrientationSensor`
 * reads a raw `alpha`/`beta`/`gamma` triple straight off the real
 * `deviceorientation` event; this is the one place that turns it into
 * a `Mat4` `scene_renderer.ts` can drop straight into a model matrix
 * in place of `rotation(axis, angle)`.
 *
 * The W3C spec defines a device's own orientation as three *intrinsic*
 * rotations applied in order Z (`alpha`), then X (`beta`), then Y
 * (`gamma`) -- each about the device's own, already-rotated axes, not
 * the fixed world ones. The standard identity for converting that into
 * one fixed-axis (extrinsic) composition is to apply the same three
 * single-axis rotations in *reverse* order against the fixed world
 * axes: `Rz(alpha) * Rx(beta) * Ry(gamma)`, exactly
 * `multiplyAll(rotation(Z, alpha), rotation(X, beta), rotation(Y,
 * gamma))` below, since `multiplyAll(A, B, C)`'s own docstring already
 * means "apply C first, then B, then A" to a vector -- so this applies
 * gamma first, then beta, then alpha, the same intrinsic Z-X-Y order
 * the device itself rotated through. This is "visually convincing,
 * matches the published spec formula" territory, not independently
 * re-derived or validated against a real device's own sensor output by
 * this project's own tests (`mat4.test.ts`'s own docstring on exactly
 * what it does and doesn't check here) -- confirming it *feels* right
 * needs a real phone, the same limitation every other visual change
 * to this scene has had. */
export function deviceOrientationToRotation(alphaDegrees: number, betaDegrees: number, gammaDegrees: number): Mat4 {
  const alpha = (alphaDegrees * Math.PI) / 180;
  const beta = (betaDegrees * Math.PI) / 180;
  const gamma = (gammaDegrees * Math.PI) / 180;
  return multiplyAll(rotation([0, 0, 1], alpha), rotation([1, 0, 0], beta), rotation([0, 1, 0], gamma));
}
