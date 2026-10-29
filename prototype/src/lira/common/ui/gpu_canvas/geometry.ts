import type { Vec3 } from "./mat4";

/** Interleaved `[px,py,pz, nx,ny,nz, ...]` per vertex (stride 6 floats,
 * 24 bytes) -- `scene_renderer.ts`'s own single vertex-buffer layout,
 * shared by both meshes below, so one render pipeline serves both cube
 * and sphere draws. */
export interface Mesh {
  vertices: Float32Array;
  indices: Uint16Array;
}

const VERTEX_FLOATS = 6;

/** Each face as an orthonormal `{normal, right, up}` frame with
 * `right x up == normal` -- not an arbitrary choice: that cross-product
 * identity is exactly what makes the four corners built from it wind
 * counter-clockwise as seen from outside the cube (this module's own
 * `geometry.test.ts` recomputes each triangle's real face normal from
 * its own vertex positions and asserts it agrees with the vertex
 * normal, rather than trusting this by hand). Exported so
 * `buildTexturedCubeMesh()` below can walk the exact same six frames,
 * in the same order -- its own winding is then provably identical to
 * `buildCubeMesh()`'s own already-verified winding, by construction,
 * not re-derived by hand a second time. */
export const CUBE_FACES: readonly { normal: Vec3; right: Vec3; up: Vec3 }[] = [
  { normal: [1, 0, 0], right: [0, 0, -1], up: [0, 1, 0] },
  { normal: [-1, 0, 0], right: [0, 0, 1], up: [0, 1, 0] },
  { normal: [0, 1, 0], right: [1, 0, 0], up: [0, 0, -1] },
  { normal: [0, -1, 0], right: [1, 0, 0], up: [0, 0, 1] },
  { normal: [0, 0, 1], right: [1, 0, 0], up: [0, 1, 0] },
  { normal: [0, 0, -1], right: [-1, 0, 0], up: [0, 1, 0] },
];

/** A cube centred on the origin, `size` long on each edge -- 24
 * vertices (4 per face, not 8, so every face gets its own flat normal
 * instead of an averaged corner normal) and 36 indices (2 triangles x
 * 6 faces). */
export function buildCubeMesh(size: number): Mesh {
  const half = size / 2;
  const vertices = new Float32Array(CUBE_FACES.length * 4 * VERTEX_FLOATS);
  const indices = new Uint16Array(CUBE_FACES.length * 6);

  CUBE_FACES.forEach((face, faceIndex) => {
    const [nx, ny, nz] = face.normal;
    const corners: Vec3[] = [
      addScaled(addScaled(face.normal, face.right, -1), face.up, -1),
      addScaled(addScaled(face.normal, face.right, 1), face.up, -1),
      addScaled(addScaled(face.normal, face.right, 1), face.up, 1),
      addScaled(addScaled(face.normal, face.right, -1), face.up, 1),
    ];
    corners.forEach((corner, cornerIndex) => {
      const base = (faceIndex * 4 + cornerIndex) * VERTEX_FLOATS;
      vertices[base] = corner[0] * half;
      vertices[base + 1] = corner[1] * half;
      vertices[base + 2] = corner[2] * half;
      vertices[base + 3] = nx;
      vertices[base + 4] = ny;
      vertices[base + 5] = nz;
    });
    const quadBase = faceIndex * 4;
    const indexBase = faceIndex * 6;
    indices[indexBase] = quadBase;
    indices[indexBase + 1] = quadBase + 1;
    indices[indexBase + 2] = quadBase + 2;
    indices[indexBase + 3] = quadBase;
    indices[indexBase + 4] = quadBase + 2;
    indices[indexBase + 5] = quadBase + 3;
  });

  return { vertices, indices };
}

function addScaled(base: Vec3, offset: Vec3, scale: number): Vec3 {
  return [base[0] + offset[0] * scale, base[1] + offset[1] * scale, base[2] + offset[2] * scale];
}

const TEXTURED_VERTEX_FLOATS = 5; // position(3) + uv(2) -- no normal: the camera cube is unlit (shader.ts's own CAMERA_SHADER_WGSL), so there's nothing a normal would be used for

/** A second interleaved layout, `[px,py,pz, u,v, ...]` -- `scene_renderer.ts`'s
 * own camera-textured cube (`attachCamera()`) needs UV coordinates to
 * sample a video frame, not a lit surface normal, so this is a
 * separate mesh/vertex-buffer layout and pipeline from `buildCubeMesh()`'s
 * own, not a third optional field grafted onto it. */
export interface TexturedMesh {
  vertices: Float32Array;
  indices: Uint16Array;
}

const UV_CORNERS: readonly [number, number][] = [
  [0, 1],
  [1, 1],
  [1, 0],
  [0, 0],
];

/** A cube centred on the origin, `size` long on each edge, each face
 * mapped to the whole `[0,1]x[0,1]` texture (the same live camera
 * frame repeated on all six faces, not a cube-map -- `scene_renderer.ts`'s
 * own docstring on why that's the simpler, sufficient choice here).
 * Walks the exact same `CUBE_FACES` frames and corner order
 * `buildCubeMesh()` does, so `geometry.test.ts` can assert this
 * produces the *identical* index array -- proof its winding is
 * correct by construction, not a second hand-derivation to get wrong. */
export function buildTexturedCubeMesh(size: number): TexturedMesh {
  const half = size / 2;
  const vertices = new Float32Array(CUBE_FACES.length * 4 * TEXTURED_VERTEX_FLOATS);
  const indices = new Uint16Array(CUBE_FACES.length * 6);

  CUBE_FACES.forEach((face, faceIndex) => {
    const corners: Vec3[] = [
      addScaled(addScaled(face.normal, face.right, -1), face.up, -1),
      addScaled(addScaled(face.normal, face.right, 1), face.up, -1),
      addScaled(addScaled(face.normal, face.right, 1), face.up, 1),
      addScaled(addScaled(face.normal, face.right, -1), face.up, 1),
    ];
    corners.forEach((corner, cornerIndex) => {
      const base = (faceIndex * 4 + cornerIndex) * TEXTURED_VERTEX_FLOATS;
      vertices[base] = corner[0] * half;
      vertices[base + 1] = corner[1] * half;
      vertices[base + 2] = corner[2] * half;
      vertices[base + 3] = UV_CORNERS[cornerIndex][0];
      vertices[base + 4] = UV_CORNERS[cornerIndex][1];
    });
    const quadBase = faceIndex * 4;
    const indexBase = faceIndex * 6;
    indices[indexBase] = quadBase;
    indices[indexBase + 1] = quadBase + 1;
    indices[indexBase + 2] = quadBase + 2;
    indices[indexBase + 3] = quadBase;
    indices[indexBase + 4] = quadBase + 2;
    indices[indexBase + 5] = quadBase + 3;
  });

  return { vertices, indices };
}

/** A UV sphere, `radius`, `latSegments` rings from pole to pole,
 * `lonSegments` meridians -- the ordinary "duplicate the seam and pole
 * rows" construction (simplest correct one, not the fewest-vertices
 * one): `(latSegments+1) * (lonSegments+1)` vertices, `normal` equal to
 * the (unit-length) position direction since every point already sits
 * on a sphere centred at the origin. */
export function buildSphereMesh(radius: number, latSegments: number, lonSegments: number): Mesh {
  const rings = latSegments + 1;
  const meridians = lonSegments + 1;
  const vertices = new Float32Array(rings * meridians * VERTEX_FLOATS);

  for (let lat = 0; lat < rings; lat++) {
    const theta = (lat / latSegments) * Math.PI;
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    for (let lon = 0; lon < meridians; lon++) {
      const phi = (lon / lonSegments) * Math.PI * 2;
      const nx = sinTheta * Math.cos(phi);
      const ny = cosTheta;
      const nz = sinTheta * Math.sin(phi);
      const base = (lat * meridians + lon) * VERTEX_FLOATS;
      vertices[base] = nx * radius;
      vertices[base + 1] = ny * radius;
      vertices[base + 2] = nz * radius;
      vertices[base + 3] = nx;
      vertices[base + 4] = ny;
      vertices[base + 5] = nz;
    }
  }

  const indices: number[] = [];
  for (let lat = 0; lat < latSegments; lat++) {
    for (let lon = 0; lon < lonSegments; lon++) {
      const a = lat * meridians + lon;
      const b = (lat + 1) * meridians + lon;
      const c = (lat + 1) * meridians + lon + 1;
      const d = lat * meridians + lon + 1;
      // Winding verified by geometry.test.ts (each triangle's own
      // cross-product face normal checked against its vertex normals),
      // not just asserted here -- a UV sphere's correct winding flips
      // depending on which pole the `lat` loop starts from, easy to
      // get backwards by hand.
      //
      // At the very first ring (`lat === 0`, theta = 0) every `lon`
      // shares the exact same north-pole position -- `a` and `d` are
      // literally the same point there, so triangle (a,b,d) would be
      // zero-area; the mirror case sits at the very last ring
      // (`lat === latSegments - 1`), where `b` and `c` coincide at the
      // south pole and triangle (b,c,d) would be zero-area. Skipping
      // exactly those (geometry.test.ts's own "never a degenerate
      // triangle" check is what caught this) rather than emitting and
      // hoping the rasterizer discards them.
      if (lat !== 0) indices.push(a, d, b);
      if (lat !== latSegments - 1) indices.push(b, d, c);
    }
  }

  return { vertices, indices: new Uint16Array(indices) };
}
