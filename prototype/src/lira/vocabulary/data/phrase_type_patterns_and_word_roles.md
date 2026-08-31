# Phrase Type Patterns and Word Roles

How to identify the Head of a Phrase, why that Head's own lexical class
is what actually determines `Phrase.phraseType` (`data/entities/phrase.ts`,
`enums/phrase_type.ts`), and how every other word inside the phrase gets
assigned a Phrase Role distinct from its own stored Part of Speech.

Fully implemented, not just specified: `classifyPhraseType()`
(role/word_seeder.ts) assigns a Phrase's own `phraseType` from real
WordNet data (that function's own docstring, and each `*_phrase.ts`
subtype class's own docstring, one per row below), and
`classifyModifierRoles()` (role/word_seeder.ts, called from
`linkPhraseWords()` right after `phrase.words` itself is resolved)
assigns every constituent word its own `ModifierRole`
(`enums/modifier_role.ts`), stored index-aligned with `words` on
`phrase.wordRoles` (`data/entities/phrase.ts`). `Phrase.headWord`/
`Phrase.headWordForm` (`data/entities/phrase.ts`) then single that Head position
out explicitly -- `headWord` the resolved Word it points to (when it
resolved against the Dictionary at all), `headWordForm` its own
phrase-local spelling regardless -- derived directly from `wordRoles`
in that same `linkPhraseWords()` pass rather than left for every caller
to re-scan for the one `ModifierRole.HEAD` position themselves. Only for a
Phrase seeded by `WordSeeder.seedWordNet`, the same scope
`phraseType`/`words` themselves are already limited to -- a Common
Vocabulary Cache closed-class Phrase has no constituency-parsing pass of
its own and so has empty `wordRoles`, `words`'s own exact counterpart
there. `classifyModifierRoles()`'s own docstring documents the one
genuine ambiguity this table's rules alone can't resolve (two adjacent
Adverb-capable tokens with no Preposition, AdverbPhrase's own Word
Patterns rows 1 and 2) and how it's broken.

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

## Phrase Role Allowed Types

Defines which LIRA linguistic-unit types may fill each `ModifierRole` for
each Phrase Type Class above -- a constituent-level compatibility
matrix, not a token-order matrix, and a distinct concept from the
Phrase Type Classes table's own "Other Word Types" column: that column
names which word-level Part of Speech values may occur as individual
tokens inside a Phrase; "Allowed Types" below names which LIRA type --
a Word subtype, a Phrase subtype, or Clause -- may actually fill one of
that Phrase's own `ModifierRole` slots (Common Rules' own "Word Type vs
Constituent Type" row, below).

| Phrase Type | Phrase Role | Allowed Types |
|---|---|---|
| NounPhrase | HEAD | Noun, Pronoun |
| NounPhrase | DETERMINER | Determiner |
| NounPhrase | MODIFIER | Adjective, AdjectivePhrase, Noun, NounPhrase, AdverbPhrase, PrepositionalPhrase, Clause |
| NounPhrase | COMPLEMENT | PrepositionalPhrase, Clause |
| VerbPhrase | HEAD | Verb |
| VerbPhrase | MODIFIER | Adverb, AdverbPhrase |
| VerbPhrase | PARTICLE | Adverb |
| AdjectivePhrase | HEAD | Adjective |
| AdjectivePhrase | MODIFIER | Adverb, AdverbPhrase |
| AdjectivePhrase | COMPLEMENT | PrepositionalPhrase, Clause |
| AdverbPhrase | HEAD | Adverb |
| AdverbPhrase | MODIFIER | Adverb, AdverbPhrase |
| PrepositionalPhrase | HEAD | Preposition |
| PrepositionalPhrase | MODIFIER | Adverb, AdverbPhrase |
| PrepositionalPhrase | COMPLEMENT | NounPhrase, Pronoun, Adverb, AdverbPhrase, PrepositionalPhrase, Clause |

`VerbPhrase`'s own PARTICLE row allows Adverb, not a dedicated
"AdverbParticle" class -- LIRA already separates the lexical type
(Adverb, `PartOfSpeech.ADVERB`) from the phrase function
(`ModifierRole.PARTICLE`) the same way every other role/type pair here
does; a phrasal-verb particle is an Adverb filling the PARTICLE role,
not a fourth word class of its own. `VerbPhrase` gets no COMPLEMENT row
in this table yet, matching `modifier_role.ts`'s own note that no
seeder or classifier assigns `ModifierRole.COMPLEMENT` anywhere yet.

`AdjectivePhrase`/`PrepositionalPhrase`'s own COMPLEMENT rows use
Clause for every complement shape Cambridge/Oxford grammar sources
distinguish further (a to-infinitive clause, an -ing clause, a content
clause) but LIRA has no dedicated class for yet -- `InfinitiveClause`/
`IngClause`/`ContentClause` are deliberately not introduced here; map
each to the nearest existing LIRA type, `Clause`
(`linguistics/data/clause.ts`), until a real need for the finer
distinction exists.

`PrepositionalPhrase`'s own COMPLEMENT row names whole constituent
types, never the individual words a multi-word constituent happens to
be built from. For "in the large house", the Preposition's own
complement is "the large house" as one `NounPhrase`, not three
separate complements ("the" -> Determiner, "large" -> Adjective,
"house" -> Noun) -- the Word Patterns table below may still show those
same three tokens individually, since that table operates at word
level; this table operates one level up, at the constituent that
actually fills the PrepositionalPhrase's own COMPLEMENT slot.

Coordination types (`NounCoordination`, `VerbCoordination`,
`AdjectiveCoordination`, `AdverbCoordination`, `PhraseCoordination`,
`ClauseCoordination`, `data/entities/coordination.ts` and its
specialisations) are deliberately absent from this table -- the
coordination model was only just introduced, with no consumers wired
up and no ModifierRole-compatibility integration designed yet. A real
coordinate ("the car and the van") can plausibly fill several of the
roles above, but that mapping is its own future change, not assumed
here.

`InfinitivePhrase` has no row here either, the same reason it's absent
from Phrase Type Classes above -- see the `InfinitivePhrase` note
following the Word Patterns table below.

## Word Patterns

Each Phrase Type Class above names one representative Example Pattern;
this table expands that into the fuller set of concrete word-order
patterns real phrases of that class take, still following the same
Pattern Notation Common Rule (PartOfSpeech[Role], Head in parentheses).
Not exhaustive -- English allows more orderings than any finite table
can enumerate -- but each row names a genuinely distinct constituent
shape, not a restatement of another row with different words substituted
in.

| Phrase Type | Word Pattern |
|---|---|
| Noun Phrase | Noun[Modifier] + (Noun[Head]) |
| Noun Phrase | Adjective[Modifier] + (Noun[Head]) |
| Noun Phrase | Noun[Modifier] + Noun[Modifier] + (Noun[Head]) |
| Noun Phrase | Adjective[Modifier] + Adjective[Modifier] + (Noun[Head]) |
| Noun Phrase | Adverb[Modifier] + Adjective[Modifier] + (Noun[Head]) |
| Noun Phrase | (Noun[Head]) + Preposition + Noun |
| Noun Phrase | (Noun[Head]) + Preposition + Determiner + Noun |
| Verb Phrase | (Verb[Head]) + Noun |
| Verb Phrase | (Verb[Head]) + Adverb[Modifier] |
| Verb Phrase | (Verb[Head]) + Preposition |
| Verb Phrase | (Verb[Head]) + Adverb[Particle] + Preposition |
| Verb Phrase | (Verb[Head]) + Adjective |
| Verb Phrase | (Verb[Head]) + Determiner + Noun |
| Verb Phrase | (Verb[Head]) + Preposition + Noun |
| Adjective Phrase | Adverb[Modifier] + (Adjective[Head]) |
| Adjective Phrase | Adjective[Modifier] + (Adjective[Head]) |
| Adjective Phrase | (Adjective[Head]) + Preposition |
| Adjective Phrase | (Adjective[Head]) + Preposition + Noun |
| Adjective Phrase | Adverb[Modifier] + (Adjective[Head]) + Preposition |
| Adjective Phrase | Adverb[Modifier] + (Adjective[Head]) + Preposition + Noun |
| Adverb Phrase | Adverb[Modifier] + (Adverb[Head]) |
| Adverb Phrase | (Adverb[Head]) + Adverb[Modifier] |
| Adverb Phrase | (Adverb[Head]) + Preposition + Noun |
| Prepositional Phrase | (Preposition[Head]) + Noun |
| Prepositional Phrase | (Preposition[Head]) + Pronoun |
| Prepositional Phrase | (Preposition[Head]) + Determiner + Noun |
| Prepositional Phrase | (Preposition[Head]) + Adjective[Modifier] + Noun |
| Prepositional Phrase | (Preposition[Head]) + Determiner + Adjective[Modifier] + Noun |
| Prepositional Phrase | Adverb[Modifier] + (Preposition[Head]) + Noun |
| Prepositional Phrase | (Preposition[Head]) + Noun + Preposition + Noun |

Two rows are worth flagging on their own: Verb Phrase's own "(Verb[Head])
+ Adverb[Particle] + Preposition" row is the one Word Pattern in this
table that assigns Particle rather than Modifier to the adverb slot --
the Common Rules table's own Particle row ("the appropriate non-head
component of a multiword verb") is exactly this case, a phrasal-verb
particle ("give up", "look after") rather than a genuine degree/manner
Modifier. Prepositional Phrase's own last row, "(Preposition[Head]) +
Noun + Preposition + Noun", is the one pattern here with two
Prepositions -- only the first carries `[Head]`; the second heads its
own embedded/nested Prepositional Phrase (structurally identical to
this table's very first Prepositional Phrase row) rather than sharing
the outer phrase's Head.

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
| Allowed Types | ModifierRole compatibility is defined against the linguistic unit filling that role, not merely the Part of Speech of the individual words contained inside that unit. |
| Word Type vs Constituent Type | "Other Word Types" describes token-level POS membership inside a Phrase; "Allowed Types" describes the Word, Phrase, Coordination, or Clause type permitted to fill a ModifierRole. |

The last rule (Definition) matches how `classifyPhraseType()` already
works today: it classifies from the *lemma's own tokens* and WordNet's
own `partOfSpeech` tag on that lemma, never from `synset.definition`'s
prose -- this table's own Head Identification Rules extend that same
constraint down to the per-word Role level, not just the phrase-level
type.
