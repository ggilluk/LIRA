import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <summary>: the visible label of a disclosure. */
export interface Summary {
  linguisticUnits: readonly LinguisticUnit[];
}

/** HTML5 <details>: disclosure structure whose Text-bearing descendants are
 * represented independently as LinguisticUnits. */
export interface Details {
  summary?: Summary;
  linguisticUnits: readonly LinguisticUnit[];
}

/** HTML5 <address>: contact-information linguistic content. */
export interface Address {
  linguisticUnits: readonly LinguisticUnit[];
}
