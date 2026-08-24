import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <track>. */
export interface TimedTextTrack {
  source: string;
  kind: string;
  language?: string;
  linguisticUnits: readonly LinguisticUnit[];
}
