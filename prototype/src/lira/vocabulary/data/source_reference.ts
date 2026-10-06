import type { Identifier, Text } from "../../value_objects";

/** Provenance for a Dictionary, Word, or LexicalRelationship. Matches
 * the Vocabulary Layer developer specification, 7.2. Ported from
 * vocabulary/data/source_reference.py -- `referenceUri` stays
 * `Identifier`-typed, not `Uri` (value_objects/data/uri.ts), despite the
 * name and despite Code.listUri/Identifier.schemeUri both having
 * switched to it: here the URI itself *is* the identifying reference
 * for this source (word_seeder.ts's own WORDNET_SOURCE_REFERENCE,
 * `referenceUri: { value: "https://wordnet.princeton.edu/" }`, naming
 * which specific source this fact came from), not a locator pointing at
 * more information about some other, separately-identified thing the
 * way a Code's own `listUri` or an Identifier's own `schemeUri` is --
 * `Identifier`'s own scheme/agency supplementary components remain the
 * right shape for that, the same as Python's own `reference_uri:
 * Optional[Identifier]` already has it. */
export interface SourceReference {
  sourceName: Text;
  sourceVersion?: Text;
  externalIdentifier?: Identifier;
  referenceUri?: Identifier;
  licenceIdentifier?: Identifier;
}
