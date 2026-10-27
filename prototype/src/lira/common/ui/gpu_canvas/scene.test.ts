import { describe, expect, it } from "vitest";
import { createRandomEntities, hslToRgb, stepEntity, type SceneBounds, type SceneEntity } from "./scene";

const BOUNDS: SceneBounds = { min: [-4, -3, -4], max: [4, 3, 4] };

/** A fixed, cycling sequence rather than `Math.random` -- deterministic
 * tests, and `createRandomEntities()`'s own `random` parameter
 * (scene.ts's own docstring on why it's injectable at all) is exactly
 * what makes this possible without monkey-patching the global. */
function sequence(values: readonly number[]): () => number {
  let i = 0;
  return () => values[i++ % values.length];
}

describe("createRandomEntities", () => {
  it("creates exactly cubeCount cubes followed by sphereCount spheres", () => {
    const entities = createRandomEntities(3, 2, BOUNDS, sequence([0.1, 0.5, 0.9]));
    expect(entities.filter((e) => e.kind === "cube")).toHaveLength(3);
    expect(entities.filter((e) => e.kind === "sphere")).toHaveLength(2);
  });

  it("places every entity's own position inside the given bounds", () => {
    const entities = createRandomEntities(5, 5, BOUNDS, sequence([0.05, 0.2, 0.5, 0.8, 0.95, 0.33, 0.67]));
    for (const entity of entities) {
      for (let axis = 0; axis < 3; axis++) {
        expect(entity.position[axis]).toBeGreaterThanOrEqual(BOUNDS.min[axis]);
        expect(entity.position[axis]).toBeLessThanOrEqual(BOUNDS.max[axis]);
      }
    }
  });

  it("gives every entity a unit-length rotation axis, even on the degenerate all-zero draw", () => {
    const entities = createRandomEntities(1, 0, BOUNDS, sequence([0.5])); // random()*2-1 === 0 on every axis
    const [axis] = entities[0].rotationAxis;
    expect(Math.hypot(...entities[0].rotationAxis)).toBeCloseTo(1, 5);
    expect(Number.isFinite(axis)).toBe(true);
  });
});

describe("stepEntity", () => {
  function entity(overrides: Partial<SceneEntity> = {}): SceneEntity {
    return {
      kind: "cube",
      position: [0, 0, 0],
      velocity: [1, 0, 0],
      rotationAxis: [0, 1, 0],
      rotationSpeed: 2,
      rotationAngle: 0,
      scale: 0.5,
      color: [1, 1, 1, 1],
      ...overrides,
    };
  }

  it("advances position by velocity * deltaSeconds when well inside the bounds", () => {
    const e = entity();
    stepEntity(e, 0.5, BOUNDS);
    expect(e.position).toEqual([0.5, 0, 0]);
  });

  it("advances rotationAngle by rotationSpeed * deltaSeconds unconditionally", () => {
    const e = entity();
    stepEntity(e, 0.25, BOUNDS);
    expect(e.rotationAngle).toBeCloseTo(0.5, 10);
  });

  it("clamps to the bound minus its own scale and reflects velocity when it would cross the max edge", () => {
    const e = entity({ position: [3.9, 0, 0], velocity: [5, 0, 0], scale: 0.5 });
    stepEntity(e, 1, BOUNDS); // would reach 8.9, far past the 3.5 (4 - scale) edge
    expect(e.position[0]).toBeCloseTo(3.5, 10);
    expect(e.velocity[0]).toBe(-5);
  });

  it("clamps to the bound plus its own scale and reflects velocity when it would cross the min edge", () => {
    const e = entity({ position: [-3.9, 0, 0], velocity: [-5, 0, 0], scale: 0.5 });
    stepEntity(e, 1, BOUNDS);
    expect(e.position[0]).toBeCloseTo(-3.5, 10);
    expect(e.velocity[0]).toBe(5);
  });

  it("stays inside the bounds indefinitely across many steps, never escaping (the actual point of bouncing at all)", () => {
    const e = entity({ position: [0, 0, 0], velocity: [3.3, -2.1, 1.7] });
    for (let i = 0; i < 500; i++) stepEntity(e, 0.1, BOUNDS);
    for (let axis = 0; axis < 3; axis++) {
      expect(e.position[axis]).toBeGreaterThanOrEqual(BOUNDS.min[axis] + e.scale - 1e-9);
      expect(e.position[axis]).toBeLessThanOrEqual(BOUNDS.max[axis] - e.scale + 1e-9);
    }
  });
});

describe("hslToRgb", () => {
  it("matches the well-known primaries at full saturation/half lightness", () => {
    expect(hslToRgb(0, 1, 0.5).map((v) => Math.round(v))).toEqual([1, 0, 0]);
    expect(hslToRgb(1 / 3, 1, 0.5).map((v) => Math.round(v))).toEqual([0, 1, 0]);
    expect(hslToRgb(2 / 3, 1, 0.5).map((v) => Math.round(v))).toEqual([0, 0, 1]);
  });

  it("returns a flat grey, unaffected by hue, when saturation is zero", () => {
    expect(hslToRgb(0.7, 0, 0.4)).toEqual([0.4, 0.4, 0.4]);
  });

  it("every channel stays within [0, 1] across the full hue range", () => {
    for (let h = 0; h < 1; h += 0.05) {
      for (const channel of hslToRgb(h, 0.65, 0.55)) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(1);
      }
    }
  });
});
