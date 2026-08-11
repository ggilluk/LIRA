import type { Code, Text } from "../../value_objects";

/** A pronunciation variant of a Word. Matches the Vocabulary Layer
 * developer specification, 7.1. Ported from
 * vocabulary/data/pronunciation.py. */
export interface Pronunciation {
  notation: Text;
  value: Text;
  dialectCode?: Code;
}
