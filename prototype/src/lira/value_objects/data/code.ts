/** Code. Type, per the UN/CEFACT Core Components Technical Specification
 * (CCTS) Core Component Type catalogue (Layer Summary: Value Objects
 * Layer). Ported from value_objects/data/code.py. */
export interface Code {
  value: string;
  name?: string;
  languageId?: string;
  listId?: string;
  listAgencyId?: string;
  listAgencyName?: string;
  listName?: string;
  listVersionId?: string;
  listUri?: string;
  listSchemeUri?: string;
}

export function code(value: string, extra: Omit<Code, "value"> = {}): Code {
  return { value, ...extra };
}
