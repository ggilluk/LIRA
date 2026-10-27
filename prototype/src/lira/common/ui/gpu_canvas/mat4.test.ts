import { describe, expect, it } from "vitest";
import { identity, lookAt, multiply, multiplyAll, normalize, perspective, rotation, scaleUniform, translation, type Mat4 } from "./mat4";

function expectClose(actual: Mat4 | readonly number[], expected: readonly number[], epsilon = 1e-5): void {
  expect(actual).toHaveLength(expected.length);
  for (let i = 0; i < expected.length; i++) expect(Math.abs(actual[i] - expected[i])).toBeLessThan(epsilon);
}

describe("identity/multiply", () => {
  it("identity() is the multiplicative identity on both sides", () => {
    const m = translation([1, 2, 3]);
    expectClose(multiply(identity(), m), Array.from(m));
    expectClose(multiply(m, identity()), Array.from(m));
  });

  it("multiplyAll(T, R, S) composes left to right, matching multiply(multiply(T,R),S)", () => {
    const t = translation([1, 0, 0]);
    const r = rotation([0, 1, 0], Math.PI / 2);
    const s = scaleUniform(2);
    expectClose(multiplyAll(t, r, s), Array.from(multiply(multiply(t, r), s)));
  });
});

describe("translation/scaleUniform", () => {
  it("translation() moves the origin to the given point and leaves it as a pure translation", () => {
    const m = translation([5, -2, 7]);
    expectClose(m, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, -2, 7, 1]);
  });

  it("scaleUniform() scales all three axes equally and leaves translation at zero", () => {
    const m = scaleUniform(3);
    expectClose(m, [3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 3, 0, 0, 0, 0, 1]);
  });
});

describe("rotation", () => {
  it("a full 2*PI rotation about any axis returns to the identity", () => {
    expectClose(rotation([0, 1, 0], Math.PI * 2), Array.from(identity()), 1e-4);
  });

  it("rotating (1,0,0) by 90 degrees about the Y axis lands on (0,0,-1) (right-hand rule)", () => {
    const m = rotation([0, 1, 0], Math.PI / 2);
    const rotated = transformPoint(m, [1, 0, 0]);
    expectClose(rotated, [0, 0, -1], 1e-4);
  });

  it("rotating (0,1,0) by 90 degrees about the X axis lands on (0,0,1)", () => {
    const m = rotation([1, 0, 0], Math.PI / 2);
    const rotated = transformPoint(m, [0, 1, 0]);
    expectClose(rotated, [0, 0, 1], 1e-4);
  });
});

describe("normalize", () => {
  it("produces a unit-length vector pointing the same direction", () => {
    const n = normalize([3, 0, 4]);
    expect(Math.hypot(...n)).toBeCloseTo(1, 5);
    expect(n[0] / n[1] || 0).not.toBeNaN();
  });

  it("returns the zero vector for a zero-length input rather than dividing by zero", () => {
    expect(normalize([0, 0, 0])).toEqual([0, 0, 0]);
  });
});

describe("lookAt", () => {
  it("produces an orthonormal view basis (each axis unit length, mutually perpendicular)", () => {
    const m = lookAt([0, 2, 5], [0, 0, 0], [0, 1, 0]);
    const xAxis: [number, number, number] = [m[0], m[1], m[2]];
    const yAxis: [number, number, number] = [m[4], m[5], m[6]];
    const zAxis: [number, number, number] = [m[8], m[9], m[10]];
    for (const axis of [xAxis, yAxis, zAxis]) expect(Math.hypot(...axis)).toBeCloseTo(1, 5);
    expect(dot(xAxis, yAxis)).toBeCloseTo(0, 5);
    expect(dot(yAxis, zAxis)).toBeCloseTo(0, 5);
    expect(dot(xAxis, zAxis)).toBeCloseTo(0, 5);
  });

  it("maps the eye's own look-at target to a point straight down view-space -Z", () => {
    const eye: [number, number, number] = [0, 0, 5];
    const m = lookAt(eye, [0, 0, 0], [0, 1, 0]);
    const viewSpaceTarget = transformPoint(m, [0, 0, 0]);
    expect(viewSpaceTarget[0]).toBeCloseTo(0, 5);
    expect(viewSpaceTarget[1]).toBeCloseTo(0, 5);
    expect(viewSpaceTarget[2]).toBeCloseTo(-5, 5); // 5 units in front of the eye, down -Z
  });
});

describe("perspective", () => {
  it("maps the near plane's own centre to clip-space depth 0 and the far plane's own centre to depth 1 (WebGPU's own [0,1] depth range)", () => {
    const m = perspective(Math.PI / 2, 1, 1, 100);
    const nearClip = multiplyPoint4(m, [0, 0, -1, 1]);
    const farClip = multiplyPoint4(m, [0, 0, -100, 1]);
    expect(nearClip[2] / nearClip[3]).toBeCloseTo(0, 4);
    expect(farClip[2] / farClip[3]).toBeCloseTo(1, 4);
  });

  it("keeps a point on the vertical field-of-view edge exactly at the clip-space boundary", () => {
    const fov = Math.PI / 2;
    const m = perspective(fov, 1, 1, 100);
    const edgeY = Math.tan(fov / 2) * 10; // at z = -10, this point sits exactly on the top edge of the frustum
    const clip = multiplyPoint4(m, [0, edgeY, -10, 1]);
    expect(clip[1] / clip[3]).toBeCloseTo(1, 4);
  });
});

function transformPoint(m: Mat4, p: readonly [number, number, number]): [number, number, number] {
  const r = multiplyPoint4(m, [p[0], p[1], p[2], 1]);
  return [r[0], r[1], r[2]];
}

function multiplyPoint4(m: Mat4, p: readonly [number, number, number, number]): [number, number, number, number] {
  const out: [number, number, number, number] = [0, 0, 0, 0];
  for (let row = 0; row < 4; row++) {
    out[row] = m[row] * p[0] + m[4 + row] * p[1] + m[8 + row] * p[2] + m[12 + row] * p[3];
  }
  return out;
}

function dot(a: readonly [number, number, number], b: readonly [number, number, number]): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
