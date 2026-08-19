# Phrase Type Patterns and Word Roles

How to identify the Head of a Phrase, why that Head's own lexical class
is what actually determines `Phrase.phraseType` (`data/phrase.ts`,
`enums/phrase_type.ts`), and how every other word inside the phrase gets
assigned a Phrase Role distinct from its own stored Part of Speech.

This is a design specification, not yet a fully implemented data model
-- `classifyPhraseType()` (role/word_seeder.ts) already assigns a
Phrase's own `phraseType` from real WordNet data (that function's own
docstring, and `data/noun_phrase.ts` through `data/infinitive_phrase.ts`,
one subtype class per row below), and the four roles named below
(`enums/phrase_role.ts`) exist as an enum, but nothing in this codebase
yet stores a per-word `PhraseRole` on a phrase's own constituent words,
nor a Head pointer from a Phrase to the one member Word that produced
its classification. This document exists to specify that gap precisely
enough to build against later, the same role
`word_form_part_of_speech_matrix.md` (this same directory) serves for
its own not-yet-implemented Exception Lookup tables.

Every Phrase Type Class below names one `data/*_phrase.ts` subtype
(`NounPhrase`, `VerbPhrase`, `AdjectivePhrase`, `AdverbPhrase`,
`PrepositionalPhrase` -- `InfinitivePhrase` is deliberately absent from
this table, see below) and mirrors that file's own `PhraseType` literal
one-for-one.

## Phrase Type Classes

| Phrase Type Class | Head Identification Rule | Required Head | Other Word Types | Word Role Assignment | Example Pattern |
|---|---|---|---|---|---|
| NounPhrase | Identify the noun that determines the complete phrase's noun classification. | Noun[Head] | Noun, Adjective, Adverb, Determiner, Preposition, Pronoun | Pre-head nouns and adjectives -> Modifier; qualifying adverbs -> Modifier; determiners retain Determiner; other words retain their POS. | Noun[Modifier] + (Noun[Head]) |
| VerbPhrase | Identify the verb that determines the complete phrase's verb classification. | Verb[Head] | Verb, Noun, Adverb, Adjective, Preposition, Determiner | Qualifying adverbs -> Modifier; verb-associated particles -> Particle; other words retain their POS. | (Verb[Head]) + Adverb[Modifier] |
| AdjectivePhrase | Identify the adjective that determines the complete phrase's adjective classification. | Adjective[Head] | Adjective, Adverb, Preposition, Noun | Qualifying adverbs and adjectives -> Modifier; other words retain their POS. | Adverb[Modifier] + (Adjective[Head]) |
| AdverbPhrase | Identify the adverb that determines the complete phrase's adverb classification. | Adverb[Head] | Adverb, Preposition, Noun | Qualifying adverbs -> Modifier; other words retain their POS. An expression used adverbially is not automatically an AdverbPhrase. | Adverb[Modifier] + (Adverb[Head]) |
| PrepositionalPhrase | Identify the preposition that determines the complete phrase's prepositional classification. | Preposition[Head] | Preposition, Noun, Pronoun, Determiner, Adjective, Adverb | Qualifying words -> Modifier; determiners retain Determiner; remaining words retain their POS. | (Preposition[Head]) + Determiner + Adjective[Modifier] + Noun |

`InfinitivePhrase` has no row here for the same reason its own file's
docstring gives for carrying no single Word POS mirror: WordNet has no
"infinitive" `ss_type` of its own, so every real `InfinitivePhrase` this
codebase seeds is WordNet-tagged ADVERB instead
(`data/infinitive_phrase.ts`) -- its Head is the base-form verb
immediately following "to", not a word carrying its own distinct Part of
Speech classification the way the five rows above each have. A future
pass extending this table to `InfinitivePhrase` should treat "to" itself
as a fixed particle, not a Head candidate.

## Common Rules

| Common Rule | Instruction |
|---|---|
| POS | Preserve each individual word's stored Part of Speech. |
| Role | Store Phrase Role independently from Part of Speech. |
| Head | Every Phrase Type must identify exactly one primary Head. |
| Head -> Phrase Type | The Head's lexical class determines the Phrase Type. |
| Modifier | Assign Modifier only where a word qualifies another lexical element. |
| Particle | Assign Particle to the appropriate non-head component of a multiword verb. |
| Determiner | Preserve Determiner from the seeded vocabulary. |
| No Role | Do not invent a Phrase Role where one is unnecessary. |
| Definition | Do not derive Phrase Type from words contained in the entry's definition. |
| Pattern Notation | Represent a constituent as PartOfSpeech[Role] and enclose the Head in parentheses: (Noun[Head]). |

The last rule (Definition) matches how `classifyPhraseType()` already
works today: it classifies from the *lemma's own tokens* and WordNet's
own `partOfSpeech` tag on that lemma, never from `synset.definition`'s
prose -- this table's own Head Identification Rules extend that same
constraint down to the per-word Role level, not just the phrase-level
type.
