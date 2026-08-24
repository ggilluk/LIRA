import type { LinguisticUnit } from "./linguistic_unit";

/** HTML5 <abbr>: visible abbreviation plus optional expansion. */
export interface Abbreviation {
  linguisticUnits: readonly LinguisticUnit[];
  expansion?: LinguisticUnit;
}

/** HTML5 <cite>: citation/title language with optional resource reference. */
export interface Citation {
  linguisticUnits: readonly LinguisticUnit[];
  url?: string;
  identifier?: string;
}

/** HTML5 <time>: visible language plus machine-readable temporal value. */
export interface Time {
  linguisticUnits: readonly LinguisticUnit[];
  dateTime?: string;
}

/** HTML5 <data>: visible language plus machine-readable value. */
export interface DataValue {
  linguisticUnits: readonly LinguisticUnit[];
  value: string;
}

/** HTML5 <blockquote>: quoted linguistic content. */
export interface BlockQuote {
  linguisticUnits: readonly LinguisticUnit[];
  citeUrl?: string;
}
