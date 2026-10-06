import type { Identifier, Text, Uri } from "../../value_objects";

/** Provenance for a Dictionary, Word, or LexicalRelationship. Matches
 * the Vocabulary Layer developer specification, 7.2. Ported from
 * vocabulary/data/source_reference.py, except `referenceUri`:
 * `Identifier` there (Python's own `reference_uri: Optional[Identifier]`),
 * `Uri` here (value_objects/data/uri.ts) -- a real, format-checked
 * address, `Code.listUri`/`Identifier.schemeUri`'s own reasoning for
 * switching, applied to this field too. */
export interface SourceReference {
  sourceName: Text;
  sourceVersion?: Text;
  externalIdentifier?: Identifier;
  referenceUri?: Uri;
  licenceIdentifier?: Identifier;
}
