import type { LinguisticUnit } from "./linguistic_unit";

export interface Label {
  forIdentifier?: string;
  linguisticUnits: readonly LinguisticUnit[];
}

export interface Input {
  type: string;
  name?: string;
  value?: string;
}

export interface TextArea {
  name?: string;
  linguisticUnits: readonly LinguisticUnit[];
}

export interface Option {
  value?: string;
  selected: boolean;
  linguisticUnits: readonly LinguisticUnit[];
}

export interface Selection {
  options: readonly Option[];
}

export interface Legend {
  linguisticUnits: readonly LinguisticUnit[];
}

export interface FieldSet {
  legend?: Legend;
  controls: readonly (Input | TextArea | Selection)[];
}

/** HTML5 <form>. Text-bearing labels, legends, options and text areas each
 * trigger LinguisticUnit ingestion while control values remain typed data. */
export interface Form {
  fieldSets: readonly FieldSet[];
  controls: readonly (Input | TextArea | Selection)[];
  labels: readonly Label[];
}

export interface Button {
  linguisticUnits: readonly LinguisticUnit[];
}
