/** The grammatical category a Phrase belongs to -- which single word
 * class (noun, verb, adjective, adverb, preposition, or an infinitive
 * verb form) the phrase as a whole functions as within a larger
 * construction. Distinct from Phrase.partOfSpeech, which still names the
 * lexical category of the phrase's own headword the same way it would
 * for an ordinary single-word Word; PhraseType instead classifies the
 * phrase's own internal shape -- how its (optional) modifiers,
 * complements, and auxiliaries arrange themselves around that head.
 * Undefined on a Phrase whose grammatical structure hasn't been
 * classified (Phrase.phraseType's own docstring).
 *
 * Values are numeric codes for use in a tensor, not string labels --
 * same convention as PartOfSpeech/RegisterCode/EditorialLabel. Matches
 * Linguistics' own PhraseType (linguistics/data/phrase_type.ts) value
 * for value -- Linguistics classifies a phrase read live out of a
 * sentence; this classifies a Phrase as a standing Vocabulary entry --
 * but the two enumerations name literally the same six grammatical
 * categories, so they're kept numerically identical on purpose. */
export enum PhraseType {
  // (Determiner) + (Modifiers) + Noun/Pronoun + (Complements)
  // A phrase centred on a noun or pronoun that functions as an entity,
  // subject, object, or complement. Example: "the intelligent system".
  NOUN_PHRASE = 0,

  // (Auxiliary verbs) + Main verb + (Particles) + (Complements) + (Modifiers)
  // A phrase centred on a main verb that expresses an action, process,
  // event, or state. Example: "has learned the pattern".
  VERB_PHRASE = 1,

  // (Degree modifiers) + Adjective + (Complements)
  // A phrase centred on an adjective that describes or qualifies a
  // noun, pronoun, or subject complement. Example: "highly reliable".
  ADJECTIVE_PHRASE = 2,

  // (Degree modifiers) + Adverb + (Complements)
  // A phrase centred on an adverb that modifies a verb, adjective,
  // another adverb, or clause. Example: "very quickly".
  ADVERB_PHRASE = 3,

  // Preposition + Noun phrase/complement + (Modifiers)
  // A phrase beginning with a preposition and containing its
  // complement. Example: "within the framework".
  PREPOSITIONAL_PHRASE = 4,

  // to + Base-form verb + (Complements) + (Modifiers)
  // A phrase centred on an infinitive verb and functioning nominally,
  // adjectivally, or adverbially. Example: "to identify the cause".
  INFINITIVE_PHRASE = 5,
}

/** PhraseType's own definition/structure/example table, exactly as
 * specified -- kept alongside the enum (rather than only as the comments
 * above) so a caller can look this up programmatically, e.g. to render
 * it in DictionaryView without hand-duplicating the same three strings
 * there. Keyed by the enum's own numeric value, not its name, so a
 * `PHRASE_TYPE_DETAILS[phrase.phraseType]` lookup works directly. */
export const PHRASE_TYPE_DETAILS: Record<PhraseType, { definition: string; structure: string; example: string }> = {
  [PhraseType.NOUN_PHRASE]: {
    definition: "A phrase centred on a noun or pronoun that functions as an entity, subject, object, or complement.",
    structure: "(Determiner) + (Modifiers) + Noun/Pronoun + (Complements)",
    example: "the intelligent system",
  },
  [PhraseType.VERB_PHRASE]: {
    definition: "A phrase centred on a main verb that expresses an action, process, event, or state.",
    structure: "(Auxiliary verbs) + Main verb + (Particles) + (Complements) + (Modifiers)",
    example: "has learned the pattern",
  },
  [PhraseType.ADJECTIVE_PHRASE]: {
    definition: "A phrase centred on an adjective that describes or qualifies a noun, pronoun, or subject complement.",
    structure: "(Degree modifiers) + Adjective + (Complements)",
    example: "highly reliable",
  },
  [PhraseType.ADVERB_PHRASE]: {
    definition: "A phrase centred on an adverb that modifies a verb, adjective, another adverb, or clause.",
    structure: "(Degree modifiers) + Adverb + (Complements)",
    example: "very quickly",
  },
  [PhraseType.PREPOSITIONAL_PHRASE]: {
    definition: "A phrase beginning with a preposition and containing its complement.",
    structure: "Preposition + Noun phrase/complement + (Modifiers)",
    example: "within the framework",
  },
  [PhraseType.INFINITIVE_PHRASE]: {
    definition: "A phrase centred on an infinitive verb and functioning nominally, adjectivally, or adverbially.",
    structure: "to + Base-form verb + (Complements) + (Modifiers)",
    example: "to identify the cause",
  },
};
