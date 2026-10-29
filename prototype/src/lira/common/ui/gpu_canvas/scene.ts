import { normalize, type Vec3 } from "./mat4";

/** `"camera"` is `scene_renderer.ts`'s own camera-textured cube
 * (`attachCamera()`) -- it moves and spins through exactly the same
 * `stepEntity()` physics as every cube/sphere (`kind` plays no part in
 * the simulation itself, only in which mesh/pipeline/uniform data
 * `scene_renderer.ts` draws it with), but `createRandomEntities()`
 * below never creates one on its own: there's always at most one, and
 * only once a real camera actually becomes available, so
 * `scene_renderer.ts` builds its own via the exported
 * `createRandomEntity()` instead. */
export type EntityKind = "cube" | "sphere" | "camera";

/** One moving, spinning shape -- `position`/`velocity`/`rotationAngle`
 * mutate every frame (`stepEntity()` below); `rotationAxis`/
 * `rotationSpeed`/`scale`/`color`/`kind` are fixed at creation. Plain
 * mutable arrays, not `Mat4`-style `Float32Array`s -- there's exactly
 * one of each per entity, mutated in place every frame, so the
 * allocation/typed-array overhead `Float32Array` buys mat4 math
 * nothing here. */
export interface SceneEntity {
  kind: EntityKind;
  position: [number, number, number];
  velocity: [number, number, number];
  rotationAxis: Vec3;
  rotationSpeed: number;
  rotationAngle: number;
  scale: number;
  color: readonly [number, number, number, number];
}

/** An axis-aligned box entities bounce inside of -- `stepEntity()`'s
 * own docstring on why "bounce," not "wrap" or "ignore." */
export interface SceneBounds {
  readonly min: Vec3;
  readonly max: Vec3;
}

/** `createRandomEntities()`'s own source of randomness, injectable so
 * tests can pass a deterministic sequence instead of mocking the
 * global `Math.random` -- the same reason `uri.ts`/`identifier.ts`
 * elsewhere in this layer take real dependencies as parameters rather
 * than reaching for a global. */
export type RandomSource = () => number;

export function createRandomEntities(cubeCount: number, sphereCount: number, bounds: SceneBounds, random: RandomSource = Math.random): SceneEntity[] {
  const entities: SceneEntity[] = [];
  for (let i = 0; i < cubeCount; i++) entities.push(createRandomEntity("cube", bounds, random));
  for (let i = 0; i < sphereCount; i++) entities.push(createRandomEntity("sphere", bounds, random));
  return entities;
}

export function createRandomEntity(kind: EntityKind, bounds: SceneBounds, random: RandomSource): SceneEntity {
  const speed = 0.6 + random() * 1.2;
  const axis = normalize([random() * 2 - 1, random() * 2 - 1, random() * 2 - 1]);
  return {
    kind,
    position: [randomInRange(bounds.min[0], bounds.max[0], random), randomInRange(bounds.min[1], bounds.max[1], random), randomInRange(bounds.min[2], bounds.max[2], random)],
    velocity: [randomSigned(speed, random), randomSigned(speed, random), randomSigned(speed, random)],
    rotationAxis: axis[0] === 0 && axis[1] === 0 && axis[2] === 0 ? [0, 1, 0] : axis,
    rotationSpeed: 0.4 + random() * 1.6,
    rotationAngle: random() * Math.PI * 2,
    scale: 0.45 + random() * 0.35,
    color: [...hslToRgb(random(), 0.65, 0.55), 1],
  };
}

function randomInRange(min: number, max: number, random: RandomSource): number {
  return min + (max - min) * random();
}

function randomSigned(magnitude: number, random: RandomSource): number {
  return (random() < 0.5 ? -1 : 1) * magnitude;
}

/** Advances one entity by `deltaSeconds` of real wall-clock time --
 * position by `velocity`, rotation by `rotationSpeed`, then reflects
 * any velocity component whose motion would carry the entity's own
 * `scale`-radius past `bounds` on that axis (an ordinary elastic
 * bounce, clamped back inside first so a large `deltaSeconds` spike --
 * e.g. the tab was backgrounded -- can't tunnel an entity through the
 * wall before the reflection is even noticed). Wrapping or simply
 * ignoring the bounds were both considered and dropped: a bounce keeps
 * every entity visible inside the camera's own frustum indefinitely,
 * which neither alternative guarantees on its own. */
export function stepEntity(entity: SceneEntity, deltaSeconds: number, bounds: SceneBounds): void {
  entity.rotationAngle += entity.rotationSpeed * deltaSeconds;

  for (let axis = 0; axis < 3; axis++) {
    entity.position[axis] += entity.velocity[axis] * deltaSeconds;
    const min = bounds.min[axis] + entity.scale;
    const max = bounds.max[axis] - entity.scale;
    if (entity.position[axis] < min) {
      entity.position[axis] = min;
      entity.velocity[axis] = Math.abs(entity.velocity[axis]);
    } else if (entity.position[axis] > max) {
      entity.position[axis] = max;
      entity.velocity[axis] = -Math.abs(entity.velocity[axis]);
    }
  }
}

/** `createRandomEntity()`'s own colour source -- HSL rather than flat
 * random RGB specifically for even brightness/saturation: three
 * independent random RGB channels skew muddy/brownish far more often
 * than they land on something visually distinct, which matters more
 * here than it would for, say, a data-visualisation palette, since
 * telling the sixteen-odd moving shapes apart *is* the point of
 * randomising colour at all. `h` in `[0,1)` (fraction of the colour
 * wheel), `s`/`l` fixed by the caller for a consistent "vivid, mid-
 * brightness" look across every entity. */
export function hslToRgb(h: number, s: number, l: number): readonly [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hueToRgbChannel(p, q, h + 1 / 3), hueToRgbChannel(p, q, h), hueToRgbChannel(p, q, h - 1 / 3)];
}

function hueToRgbChannel(p: number, q: number, t: number): number {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}
