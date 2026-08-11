import type { Identifier, Text } from "../../value_objects";

/** Provenance for a Dictionary, Word, or LexicalRelationship. Matches
 * the Vocabulary Layer developer specification, 7.2. Ported from
 * vocabulary/data/source_reference.py. */
export interface SourceReference {
  sourceName: Text;
  sourceVersion?: Text;
  externalIdentifier?: Identifier;
  referenceUri?: Identifier;
  licenceIdentifier?: Identifier;
}
