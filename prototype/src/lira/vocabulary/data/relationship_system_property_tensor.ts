/** The shared shape SystemPropertiesRef needs from a system-properties
 * tensor -- LexicalRelationshipSystemPropertyTensor and
 * SemanticRelationshipSystemPropertyTensor (data/lexical_relationship_tensor.ts,
 * data/semantic_relationship_tensor.ts) both satisfy this structurally,
 * so one SystemPropertiesRef class serves either row kind without
 * needing to know which. Column layout (confidence/provenance/temporal/
 * activation, in that order) is a convention both tensors share, not
 * enforced by this interface itself. */
export interface RelationshipSystemPropertyTensor {
  uuidOf(row: number): string;
  versionOf(row: number): string;
  getCell(row: number, col: number): number;
  setCell(row: number, col: number, value: number): void;
}
