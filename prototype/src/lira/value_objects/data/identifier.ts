/** Identifier. Type, per the UN/CEFACT Core Components Technical
 * Specification (CCTS) Core Component Type catalogue (Layer Summary:
 * Value Objects Layer). Ported from value_objects/data/identifier.py. */
export interface Identifier {
  value: string;
  schemeId?: string;
  schemeName?: string;
  schemeAgencyId?: string;
  schemeAgencyName?: string;
  schemeVersionId?: string;
  schemeDataUri?: string;
  schemeUri?: string;
}

export function identifier(value: string, extra: Omit<Identifier, "value"> = {}): Identifier {
  return { value, ...extra };
}
