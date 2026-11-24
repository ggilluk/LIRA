/**
 * ┌──────────────────────────────────────────────────────────────────────────────────────┐
 * │                                                                                      │
 * │         ██╗     ██╗██████╗  █████╗                                                   │
 * │         ██║     ██║██╔══██╗██╔══██╗                                                  │
 * │         ██║     ██║██████╔╝███████║                                                  │
 * │         ██║     ██║██╔══██╗██╔══██║                                                  │
 * │         ███████╗██║██║  ██║██║  ██║                                                  │
 * │         ╚══════╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝                                                  │
 * │                                                                                      │
 * ├─────────────────┬────────────────────────────────────────────────────────────────────
 * │ Copyright       │ (c) Gurpinder Gill
 * │ License         │ MIT
 * │ Package Name    │ lira-prototype
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/font_atlas.test
 * │ Filename        │ font_atlas.test.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Vitest suite for font_atlas.ts's own glyph-packing math, against a
 * │                 │ fake 2D canvas context -- jsdom has no real one to bake against.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/font_atlas.test
 * @file font_atlas.test.ts
 * @author Gurpinder Gill
 * @license MIT
 */
import { describe, expect, it, vi } from "vitest";
import { ATLAS_CHARACTERS, bakeFontAtlas, DEFAULT_FONT_FAMILY, type Canvas2DContextLike, type CanvasLike } from "./font_atlas";

/** A deterministic stand-in for a real 2D context -- `measureText()`
 * returns a canned, per-character width instead of asking a real font
 * rasteriser, so every size this module computes from it is an exact,
 * assertable number, not "whatever this machine's installed fonts
 * happen to measure". */
function fakeContext(widths: Record<string, number>): Canvas2DContextLike & { readonly fillTextCalls: readonly [string, number, number][] } {
  const fillTextCalls: [string, number, number][] = [];
  return {
    font: "",
    fillStyle: "",
    textBaseline: "",
    textAlign: "",
    measureText: (text: string) => ({ width: widths[text] ?? 0 }),
    fillText: vi.fn((text: string, x: number, y: number) => fillTextCalls.push([text, x, y])) as unknown as Canvas2DContextLike["fillText"],
    getImageData: vi.fn((_x: number, _y: number, width: number, height: number) => ({ data: new Uint8ClampedArray(width * height * 4) })),
    fillTextCalls,
  };
}

function fakeCanvas(context: Canvas2DContextLike | null): CanvasLike {
  return { width: 0, height: 0, getContext: () => context };
}

describe("bakeFontAtlas", () => {
  it("throws an honest error when the canvas has no 2D context at all", () => {
    expect(() => bakeFontAtlas(() => fakeCanvas(null))).toThrow(/no 2D context/);
  });

  it("sizes the grid off the widest measured glyph, packs a small character set into the documented cell layout, and resizes the canvas to the computed atlas size", () => {
    const context = fakeContext({ A: 10, B: 20 });
    const atlas = bakeFontAtlas(() => fakeCanvas(context), 48, DEFAULT_FONT_FAMILY, "AB");

    // cellWidth = ceil(maxWidth=20) + 2*padding(2) = 24; cellHeight = ceil(48*1.3) + 4 = 67; columns = ceil(sqrt(2)) = 2, rows = 1.
    expect(atlas.width).toBe(48);
    expect(atlas.height).toBe(67);
    expect(atlas.fontPixelSize).toBe(48);

    const glyphA = atlas.glyphs.get("A")!;
    const glyphB = atlas.glyphs.get("B")!;
    expect(glyphA.width).toBe(10);
    expect(glyphB.width).toBe(20);
    // A is cell (0,0) -> drawn at (padding, padding) = (2,2); B is cell (1,0) -> (24+2, 2) = (26,2).
    expect(context.fillTextCalls).toEqual([
      ["A", 2, 2],
      ["B", 26, 2],
    ]);
    expect(glyphA.u0).toBeCloseTo(2 / 48, 10);
    expect(glyphA.u1).toBeCloseTo(12 / 48, 10);
    expect(glyphB.u0).toBeCloseTo(26 / 48, 10);
    expect(glyphB.u1).toBeCloseTo(46 / 48, 10);
  });

  it("every character of the real default ATLAS_CHARACTERS set gets its own glyph entry, none missing or duplicated", () => {
    const widths: Record<string, number> = {};
    for (const character of ATLAS_CHARACTERS) widths[character] = 10 + (character.charCodeAt(0) % 7);
    const context = fakeContext(widths);
    const atlas = bakeFontAtlas(() => fakeCanvas(context));
    expect(atlas.glyphs.size).toBe(new Set(ATLAS_CHARACTERS.split("")).size);
    for (const character of ATLAS_CHARACTERS) expect(atlas.glyphs.has(character)).toBe(true);
  });

  it("every glyph's own UV rect stays within [0,1] on both axes", () => {
    const widths: Record<string, number> = {};
    for (const character of ATLAS_CHARACTERS) widths[character] = 8 + (character.charCodeAt(0) % 11);
    const atlas = bakeFontAtlas(() => fakeCanvas(fakeContext(widths)));
    for (const glyph of atlas.glyphs.values()) {
      expect(glyph.u0).toBeGreaterThanOrEqual(0);
      expect(glyph.u1).toBeLessThanOrEqual(1);
      expect(glyph.v0).toBeGreaterThanOrEqual(0);
      expect(glyph.v1).toBeLessThanOrEqual(1);
      expect(glyph.u1).toBeGreaterThan(glyph.u0);
      expect(glyph.v1).toBeGreaterThan(glyph.v0);
    }
  });
});
