/** Text. Type, per the UN/CEFACT Core Components Technical Specification
 * (CCTS) Core Component Type catalogue (Layer Summary: Value Objects
 * Layer). Ported from value_objects/data/text.py. */
export interface Text {
  value: string;
  languageId?: string;
}

export function text(value: string, languageId?: string): Text {
  return languageId === undefined ? { value } : { value, languageId };
}
