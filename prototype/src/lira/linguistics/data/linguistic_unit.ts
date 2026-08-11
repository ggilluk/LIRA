/** Base type for every artefact in the Word/Clause/Sentence/Paragraph/
 * Subject/UserPrompt tree (Layer Summary: Linguistics Layer). Ported
 * from linguistics/data/linguistic_unit.py, scoped to the one field
 * Vocabulary's Word actually extends (`text`) -- the rest of the
 * Linguistics Layer (the tree itself, LinguisticSystemProperty, the
 * tensor-backed system_property this class also carries in Python) is
 * not ported yet. `systemProperty` is kept as an untyped placeholder
 * so a future Linguistics port can slot its real type in without
 * touching Word's own port. */
export interface LinguisticUnit {
  text: string;
  systemProperty?: unknown;
}
