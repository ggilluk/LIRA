import type { Uri } from "./uri";

/** Code. Type, per the UN/CEFACT Core Components Technical Specification
 * (CCTS) Core Component Type catalogue (Layer Summary: Value Objects
 * Layer). Ported from value_objects/data/code.py, except `listUri`/
 * `listSchemeUri`: `string` there (every other supplementary attribute's
 * own type), `Uri` here -- both are genuine dereferenceable locators (a
 * page for a specific code's own definition, a page for the code list
 * itself), uri.ts's own reason for existing at all, and every one of
 * this interface's real implementors (data/code/*.ts) already supplies
 * a real address for at least one of the two. */
export interface Code {
  value: string;
  name?: string;
  languageId?: string;
  listId?: string;
  listAgencyId?: string;
  listAgencyName?: string;
  listName?: string;
  listVersionId?: string;
  listUri?: Uri;
  listSchemeUri?: Uri;
}

export function code(value: string, extra: Omit<Code, "value"> = {}): Code {
  return { value, ...extra };
}
