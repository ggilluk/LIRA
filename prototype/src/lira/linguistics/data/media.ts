import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <audio>. */
export interface Audio {
  source: string;
}

/** HTML5 <video>. */
export interface Video {
  source: string;
  poster?: string;
}

/** HTML5 <track>. Caption/subtitle Text can be ingested as LinguisticUnits. */
export interface TimedTextTrack {
  source: string;
  kind: string;
  language?: string;
  linguisticUnits: readonly LinguisticUnit[];
}

/** HTML5 <picture>: alternate representations of one picture. */
export interface PictureSet {
  sources: readonly string[];
}
