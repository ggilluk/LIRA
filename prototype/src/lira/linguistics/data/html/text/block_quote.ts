import type { LinguisticUnit } from "../../linguistic_unit";

/** HTML5 <blockquote>. */
export interface BlockQuote {
  linguisticUnits: readonly LinguisticUnit[];
  citeUrl?: string;
}
