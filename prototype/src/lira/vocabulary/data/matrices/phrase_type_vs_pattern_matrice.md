# Phrase Type vs. Pattern Matrice

The recursive phrase-structure grammar for each `PhraseType`
(`enums/phrase_type.ts`) -- which Word/Phrase constituents a phrase of
that type may contain, in what order, and which single constituent is
its Head. Two axes: `PhraseType` against its own ordered constituent
pattern (itself naming other `PhraseType`s where a phrase nests inside
a phrase), the same "genuine multi-axis cross-tabulation" shape that
makes `data/matrices/` this table's home rather than `data/` directly
(`pos_vs_wordform_matrice.ts`'s own module docstring on that
distinction).

Conceptual, not yet implemented: unlike
`data/phrase_type_patterns_and_word_roles.md` (whose own Word Pattern
table is real, flat POS[Role] sequences that `classifyPhraseType()`/
`classifyPhraseRoles()`, `role/word_seeder.ts`, actually produce
today), nothing in this codebase currently builds the recursive,
phrase-nested-inside-phrase structure this table describes --
`Phrase.words` (`data/phrase.ts`) is a flat array of Word references
only, never a Phrase reference. `data/phrase.md`'s own
Premodifiers/Complements/Postmodifiers property table is this same
conceptual model at the single-Phrase level; this table is its
per-`PhraseType` production-rule expansion.

| Phrase Type | Ordered Word / Phrase Pattern | Head |
|---|---|---|
| NOUN_PHRASE | (Determiner)? + (Pronoun)? + (Numeral)* + (Adjective)* + (Noun)* + (Head) + (PREPOSITIONAL_PHRASE)* | (Noun) |
| NOUN_PHRASE | (Head) | (Pronoun) |
| VERB_PHRASE | (Verb)* + (Adverb)* + (Head) + (NOUN_PHRASE)* + (ADJECTIVE_PHRASE)* + (ADVERB_PHRASE)* + (PREPOSITIONAL_PHRASE)* + (INFINITIVE_PHRASE)* | (Verb) |
| ADJECTIVE_PHRASE | (Adverb)* + (Head) + (PREPOSITIONAL_PHRASE)* + (INFINITIVE_PHRASE)* | (Adjective) |
| ADVERB_PHRASE | (Adverb)* + (Head) + (PREPOSITIONAL_PHRASE)* | (Adverb) |
| PREPOSITIONAL_PHRASE | (Adverb)* + (Head) + (NOUN_PHRASE) | (Preposition) |
| PREPOSITIONAL_PHRASE | (Adverb)* + (Head) + (INFINITIVE_PHRASE) | (Preposition) |
| INFINITIVE_PHRASE | (Preposition) + (Adverb)* + (Head) + (NOUN_PHRASE)* + (ADJECTIVE_PHRASE)* + (ADVERB_PHRASE)* + (PREPOSITIONAL_PHRASE)* | (Verb) |

Where:

- `?` = 0..1
- `*` = 0..*
- `+` = ordered sequence
- `(Head)` = required head position
- `(POS)` = Word having that LIRA Part of Speech
- `(PHRASE_TYPE)` = nested LIRA Phrase
