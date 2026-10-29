import { describe, expect, it } from "vitest";
import { buildCubeMesh, buildSphereMesh, buildTexturedCubeMesh, type Mesh } from "./geometry";

type Vec3 = readonly [number, number, number];

function vertexAt(mesh: Mesh, index: number): { position: Vec3; normal: Vec3 } {
  const base = index * 6;
  return {
    position: [mesh.vertices[base], mesh.vertices[base + 1], mesh.vertices[base + 2]],
    normal: [mesh.vertices[base + 3], mesh.vertices[base + 4], mesh.vertices[base + 5]],
  };
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

function length(v: Vec3): number {
  return Math.hypot(v[0], v[1], v[2]);
}

/** The actual correctness check both mesh tests below lean on: for
 * every triangle, recompute its real geometric face normal straight
 * from its own three vertex positions (edge1 x edge2) and confirm that
 * points in the same direction as the triangle's own stored vertex
 * normals -- this is what "wound counter-clockwise as seen from
 * outside, consistent with its own normal" actually means for a
 * render pipeline using `cullMode: "back"`, and it would catch a
 * backwards winding this module's own by-hand face-frame derivation
 * (geometry.ts's own CUBE_FACES/buildSphereMesh comments) might have
 * gotten wrong, not just assert the author's intent after the fact. */
function expectConsistentOutwardWinding(mesh: Mesh): void {
  for (let i = 0; i + 2 < mesh.indices.length; i += 3) {
    const a = vertexAt(mesh, mesh.indices[i]);
    const b = vertexAt(mesh, mesh.indices[i + 1]);
    const c = vertexAt(mesh, mesh.indices[i + 2]);
    const faceNormal = cross(subtract(b.position, a.position), subtract(c.position, b.position));
    expect(length(faceNormal)).toBeGreaterThan(0); // never a degenerate (zero-area) triangle
    for (const vertex of [a, b, c]) expect(dot(faceNormal, vertex.normal)).toBeGreaterThan(0);
  }
}

describe("buildCubeMesh", () => {
  it("has 24 vertices (4 per face, flat per-face normals) and 36 indices (2 triangles x 6 faces)", () => {
    const mesh = buildCubeMesh(2);
    expect(mesh.vertices).toHaveLength(24 * 6);
    expect(mesh.indices).toHaveLength(36);
  });

  it("every vertex sits exactly size/2 from the origin along one axis (a real cube, not a distorted box)", () => {
    const mesh = buildCubeMesh(2);
    for (let i = 0; i < 24; i++) {
      const { position } = vertexAt(mesh, i);
      expect(position.map(Math.abs).every((v) => Math.abs(v - 1) < 1e-6 || Math.abs(v) < 1e-6)).toBe(true);
    }
  });

  it("winds every triangle counter-clockwise as seen from outside, matching its own flat face normal", () => {
    expectConsistentOutwardWinding(buildCubeMesh(1));
  });
});

describe("buildSphereMesh", () => {
  it("has (latSegments+1)*(lonSegments+1) vertices, and one fewer triangle per lonSegment at each pole (both pole rows' own degenerate triangle is skipped, not emitted -- geometry.ts's own comment on why)", () => {
    const mesh = buildSphereMesh(1, 8, 12);
    expect(mesh.vertices).toHaveLength(9 * 13 * 6);
    expect(mesh.indices).toHaveLength((8 - 1) * 12 * 6);
  });

  it("every vertex sits exactly `radius` from the origin, and its normal is that same direction, unit length", () => {
    const mesh = buildSphereMesh(3, 8, 12);
    for (let i = 0; i < mesh.vertices.length / 6; i++) {
      const { position, normal } = vertexAt(mesh, i);
      expect(length(position)).toBeCloseTo(3, 5);
      expect(length(normal)).toBeCloseTo(1, 5);
      expect(dot(position, normal) / (length(position) * length(normal))).toBeCloseTo(1, 5); // parallel, same direction
    }
  });

  it("winds every triangle counter-clockwise as seen from outside, matching its own outward (position-direction) normal", () => {
    expectConsistentOutwardWinding(buildSphereMesh(1, 8, 12));
  });
});

describe("buildTexturedCubeMesh", () => {
  it("has 24 vertices (position+uv, 5 floats each) and 36 indices, same counts as buildCubeMesh", () => {
    const mesh = buildTexturedCubeMesh(2);
    expect(mesh.vertices).toHaveLength(24 * 5);
    expect(mesh.indices).toHaveLength(36);
  });

  it("produces the exact same index array as buildCubeMesh -- proof its winding is identical (and so already correct) by construction, not re-derived", () => {
    expect(Array.from(buildTexturedCubeMesh(1).indices)).toEqual(Array.from(buildCubeMesh(1).indices));
  });

  it("every vertex sits at the same positions buildCubeMesh produces for the same size", () => {
    const textured = buildTexturedCubeMesh(2);
    const plain = buildCubeMesh(2);
    for (let i = 0; i < 24; i++) {
      expect([textured.vertices[i * 5], textured.vertices[i * 5 + 1], textured.vertices[i * 5 + 2]]).toEqual([plain.vertices[i * 6], plain.vertices[i * 6 + 1], plain.vertices[i * 6 + 2]]);
    }
  });

  it("maps every face's own 4 corners to the 4 distinct UV corners, each within [0,1]", () => {
    const mesh = buildTexturedCubeMesh(1);
    for (let face = 0; face < 6; face++) {
      const uvs = [0, 1, 2, 3].map((corner) => {
        const base = (face * 4 + corner) * 5;
        return [mesh.vertices[base + 3], mesh.vertices[base + 4]];
      });
      for (const [u, v] of uvs) {
        expect(u).toBeGreaterThanOrEqual(0);
        expect(u).toBeLessThanOrEqual(1);
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
      const distinct = new Set(uvs.map(([u, v]) => `${u},${v}`));
      expect(distinct.size).toBe(4);
    }
  });
});
