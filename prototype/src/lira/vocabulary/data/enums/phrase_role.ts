/** The role a word plays within a Phrase's own internal structure --
 * distinct from that word's own stored Part of Speech, and stored
 * independently of it (data/phrase_type_patterns_and_word_roles.md's
 * own Common Rules table, "Role" and "POS" rows). A word keeps its own
 * Part of Speech no matter which Phrase it appears in ("fast" stays an
 * Adjective whether it's a phrase's Head or absent from one entirely);
 * PhraseRole instead names what that word is *doing* inside one
 * specific Phrase's own Head Identification Rule
 * (phrase_type_patterns_and_word_roles.md's own per-PhraseType table).
 *
 * Not every word in a Phrase gets a PhraseRole at all -- the same
 * document's "No Role" Common Rule: assign a role only where a word
 * genuinely qualifies another element (Modifier), is the one word whose
 * own lexical class determines the Phrase's own `phraseType` (Head), is
 * a multiword verb's own non-head component (Particle), or is a
 * determiner carried over from the seeded vocabulary (Determiner) --
 * every other constituent word simply retains its own Part of Speech,
 * unassigned, rather than being forced into one of these four values.
 *
 * Values are numeric codes for use in a tensor, not string labels --
 * same convention as PartOfSpeech/PhraseType/RegisterCode/EditorialLabel.
 *
 * Not yet an implemented data model -- no Phrase or its member words
 * carry a PhraseRole field anywhere in this codebase yet
 * (phrase_type_patterns_and_word_roles.md's own opening note). This
 * enum exists to name the four values that document's own tables
 * already specify, ahead of the field(s) that will eventually carry
 * them. */
export enum PhraseRole {
  HEAD = 0,
  MODIFIER = 1,
  PARTICLE = 2,
  DETERMINER = 3,
}
