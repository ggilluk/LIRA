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
 * │ Module Name     │ lira/common/ui/gpu_canvas/desktop_ui/font_atlas
 * │ Filename        │ font_atlas.ts
 * │ File Version    │ 0.1.0
 * │ Created Date    │ 2026-11-24
 * │ Modified Date   │ 2026-11-24
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Description     │ Bakes a small bitmap font atlas via the system UI font stack,
 * │                 │ once, using an ordinary 2D canvas as the rasteriser -- the one
 * │                 │ asset-preparation step in this whole folder that isn't itself a
 * │                 │ WebGPU draw call; every actual frame of text after this is drawn
 * │                 │ by text_pipeline.ts's own real WebGPU quads sampling the result.
 * │                 │
 * ├─────────────────┼────────────────────────────────────────────────────────────────────
 * │ Change Log      │ [CHANGELOG.md](./CHANGELOG.md)
 * │ Issues Log      │ [ISSUES.md](./ISSUES.md)
 * └─────────────────┴────────────────────────────────────────────────────────────────────┘
 *
 * @module lira/common/ui/gpu_canvas/desktop_ui/font_atlas
 * @file font_atlas.ts
 * @author Gurpinder Gill
 * @license MIT
 */
/** The narrow 2D-context shape `bakeFontAtlas()` below actually needs
 * -- `camera_capture.ts`'s own `VideoElementLike`/`MediaDevicesLike`
 * pattern, applied here: jsdom (this project's own test environment)
 * has no real `<canvas>` 2D rasteriser at all (no `canvas` npm
 * dependency installed), so a real `document.createElement("canvas")`'s
 * own `getContext("2d")` returns `null` there, the same real gap
 * `camera_capture.test.ts`'s own docstring already found for
 * `<video>`. A test exercising this file's own glyph-packing math
 * supplies a fake context (deterministic `measureText()` widths, a
 * recorded `fillText()` call log) instead of a real one. */
export interface Canvas2DContextLike {
  font: string;
  fillStyle: string;
  textBaseline: string;
  textAlign: string;
  measureText(text: string): { readonly width: number };
  fillText(text: string, x: number, y: number): void;
  getImageData(x: number, y: number, width: number, height: number): { readonly data: Uint8ClampedArray };
}

export interface CanvasLike {
  width: number;
  height: number;
  getContext(id: "2d"): Canvas2DContextLike | null;
}

/** The printable character set this UI ever actually needs -- a
 * window title, toolbar labels, and status-bar text, all plain English
 * copy -- not the full Unicode range a general-purpose text renderer
 * would have to cover. Keeping this small keeps the baked atlas small
 * too (`bakeFontAtlas()`'s own grid is sized directly off
 * `characters.length`). */
export const ATLAS_CHARACTERS = " !\"'(),-./0123456789:;?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/** Baked noticeably larger than this UI ever displays text on screen
 * (`text_pipeline.ts`'s own quads are typically sized to a 12-16px
 * on-screen line height) -- a bitmap font atlas only ever looks crisp
 * sampled *down*, never sampled up past its own baked resolution, so
 * baking high and minifying is the standard, deliberate choice here,
 * not an arbitrary one. */
export const DEFAULT_FONT_PIXEL_SIZE = 48;

/** The spec's own "System UI font stack" requirement -- the same
 * cross-platform fallback chain (San Francisco on macOS/iOS, Segoe UI
 * on Windows, Roboto on Android/Chrome OS, a generic sans-serif
 * everywhere else) web UIs conventionally reach for under that exact
 * name, not a single hand-picked webfont (which this feature's own "no
 * external asset" constraint would rule out loading anyway). */
export const DEFAULT_FONT_FAMILY = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

export interface GlyphMetrics {
  readonly u0: number;
  readonly v0: number;
  readonly u1: number;
  readonly v1: number;
  readonly width: number;
  readonly height: number;
  readonly advance: number;
}

export interface FontAtlas {
  readonly width: number;
  readonly height: number;
  readonly pixels: Uint8ClampedArray;
  readonly glyphs: ReadonlyMap<string, GlyphMetrics>;
  readonly fontPixelSize: number;
}

const CELL_PADDING_PX = 2;

/** One real 2D canvas does triple duty: first to *measure* every
 * character's own true rendered width (`measureText()`, which only
 * ever depends on the context's own `font`, not the canvas's pixel
 * size), then -- once the atlas's own real dimensions are known from
 * those measurements -- resized and reused to actually rasterise every
 * glyph into a left-to-right, top-to-bottom grid of fixed-height,
 * variable-width cells (`cellWidth` is sized to the single *widest*
 * measured glyph, so every cell is wide enough for any character, not
 * tightly bin-packed -- with a character set this small the wasted
 * atlas space is negligible, and a fixed grid keeps the packing logic
 * itself simple enough to unit-test exactly). Resizing a real
 * `<canvas>` element (`measureCanvas.width = ...` below) clears its
 * own backing store *and* resets every 2D context property back to
 * its own default -- `font`/`textBaseline`/`textAlign`/`fillStyle`
 * are set again after that resize, not just once before it, for
 * exactly that reason. */
export function bakeFontAtlas(
  createCanvas: () => CanvasLike = () => document.createElement("canvas") as unknown as CanvasLike,
  fontPixelSize: number = DEFAULT_FONT_PIXEL_SIZE,
  fontFamily: string = DEFAULT_FONT_FAMILY,
  characters: string = ATLAS_CHARACTERS,
): FontAtlas {
  const canvas = createCanvas();
  const context = canvas.getContext("2d");
  if (!context) throw new Error("This browser's canvas element has no 2D context.");

  context.font = `${fontPixelSize}px ${fontFamily}`;
  context.textBaseline = "top";
  context.textAlign = "left";

  const glyphOrder = characters.split("");
  const measuredWidths = new Map<string, number>();
  let maxMeasuredWidth = 0;
  for (const character of glyphOrder) {
    const width = context.measureText(character).width;
    measuredWidths.set(character, width);
    maxMeasuredWidth = Math.max(maxMeasuredWidth, width);
  }

  const cellWidth = Math.ceil(maxMeasuredWidth) + CELL_PADDING_PX * 2;
  const cellHeight = Math.ceil(fontPixelSize * 1.3) + CELL_PADDING_PX * 2;
  const columns = Math.max(1, Math.ceil(Math.sqrt(glyphOrder.length)));
  const rows = Math.ceil(glyphOrder.length / columns);
  const atlasWidth = columns * cellWidth;
  const atlasHeight = rows * cellHeight;

  canvas.width = atlasWidth;
  canvas.height = atlasHeight;
  context.font = `${fontPixelSize}px ${fontFamily}`;
  context.textBaseline = "top";
  context.textAlign = "left";
  context.fillStyle = "#ffffff";

  const glyphs = new Map<string, GlyphMetrics>();
  glyphOrder.forEach((character, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const cellX = column * cellWidth + CELL_PADDING_PX;
    const cellY = row * cellHeight + CELL_PADDING_PX;
    context.fillText(character, cellX, cellY);
    const width = measuredWidths.get(character) ?? 0;
    const height = cellHeight - CELL_PADDING_PX * 2;
    glyphs.set(character, {
      u0: cellX / atlasWidth,
      v0: cellY / atlasHeight,
      u1: (cellX + width) / atlasWidth,
      v1: (cellY + height) / atlasHeight,
      width,
      height,
      advance: width,
    });
  });

  const imageData = context.getImageData(0, 0, atlasWidth, atlasHeight);
  return { width: atlasWidth, height: atlasHeight, pixels: imageData.data, glyphs, fontPixelSize };
}
