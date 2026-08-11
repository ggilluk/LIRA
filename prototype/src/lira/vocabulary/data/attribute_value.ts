import type { Text } from "../../value_objects";

/** A typed qualifier attached to a LexicalRelationship. Matches the
 * Vocabulary Layer developer specification, 7.3. Ported from
 * vocabulary/data/attribute_value.py. */
export interface AttributeValue {
  name: Text;
  value: Text;
}
