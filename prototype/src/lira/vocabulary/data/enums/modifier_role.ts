/** The role a word plays within a Phrase's own internal structure --
 * distinct from that word's own stored Part of Speech, and stored
 * independently of it (data/phrase_type_patterns_and_word_roles.md's
 * own Common Rules table, "Role" and "POS" rows). A word keeps its own
 * Part of Speech no matter which Phrase it appears in ("fast" stays an
 * Adjective whether it's a phrase's Head or absent from one entirely);
 * ModifierRole instead names what that word is *doing* inside one
 * specific Phrase's own Head Identification Rule
 * (phrase_type_patterns_and_word_roles.md's own per-PhraseType table).
 *
 * Not every word in a Phrase gets a ModifierRole at all -- the same
 * document's "No Role" Common Rule: assign a role only where a word
 * genuinely qualifies another element (Modifier), is the one word whose
 * own lexical class determines the Phrase's own `phraseType` (Head), is
 * a multiword verb's own non-head component (Particle), is a
 * determiner carried over from the seeded vocabulary (Determiner), or
 * is a grammatical complement of the Phrase Head (Complement) --
 * every other constituent word simply retains its own Part of Speech,
 * unassigned, rather than being forced into one of these five values.
 *
 * COMPLEMENT: a grammatical complement of the Phrase Head. Added ahead
 * of any identification/assignment logic of its own -- no seeder or
 * classifier in this codebase assigns ModifierRole.COMPLEMENT yet. Which
 * ModifierRole values a given PhraseType actually allows is documented
 * per subtype, not here -- see e.g. data/entities/noun_phrase.ts's own
 * docstring for NOUN_PHRASE's own allowed set (Head/Modifier/
 * Determiner/Complement) and its one explicit exclusion (Particle).
 *
 * Values are numeric codes for use in a tensor, not string labels --
 * same convention as PartOfSpeech/PhraseType/EditorialLabel.
 *
 * Not yet an implemented data model -- no Phrase or its member words
 * carry a ModifierRole field anywhere in this codebase yet
 * (phrase_type_patterns_and_word_roles.md's own opening note). This
 * enum exists to name the values that document's own tables already
 * specify (Head/Modifier/Particle/Determiner), plus Complement, ahead
 * of the field(s) that will eventually carry them. */
export enum ModifierRole {
  HEAD = 0,
  MODIFIER = 1,
  PARTICLE = 2,
  DETERMINER = 3,
  COMPLEMENT = 4,
}
