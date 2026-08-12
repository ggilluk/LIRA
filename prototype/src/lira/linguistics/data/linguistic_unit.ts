import type { LinguisticSystemProperty } from "./system_property";

/** Base type for every artefact in the Word/Clause/Sentence/Paragraph/
 * Heading/Document/UserPrompt tree (Layer Summary: Linguistics Layer). Ported
 * from linguistics/data/linguistic_unit.py. `systemProperty` is now
 * fully typed against the real `LinguisticSystemProperty` (the
 * Linguistics Service is ported -- see linguistics/role/) -- Vocabulary's
 * `Word` still only ever reads/writes it as an opaque field, same as
 * before. */
export interface LinguisticUnit {
  text: string;
  systemProperty?: LinguisticSystemProperty;
}
