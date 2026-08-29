# Data Entity Design Decisions Log

Design history for the Vocabulary Layer's data entities (`data/entities/*.ts`
and the sibling top-level entities such as `data/phrase.ts`) -- the "why"
behind a shape, kept out of the entity files' own field comments so those
stay focused on what each field *is*. Each entity file's own top docstring
points back here.

## Phrase

### Phrase as its own lexical category, not a multi-word Word

A multi-word lexical item ("in spite of", "toy poodle") was originally
modelled as an ordinary `Word` whose `text` happened to contain whitespace
(Design Principle 1's own original rationale, `vocabulary/documentation/README.md`).
Phrase replaced that: a fixed multi-token span that functions as one
grammatical unit, the same role a Word plays for a single token, but kept in
its own store (`Phrases`, `data/phrases.ts`) rather than `Dictionary` -- so a
caller can tell "this Domain's single-word lexicon" and "this Domain's
multi-word lexicon" apart without inspecting `text` for a space.

This isn't only a Common Vocabulary Cache concept. `WordSeeder.seedWordNet`
routes any multi-word WordNet synset lemma into `Phrases` the same way
`seedClosedClassWords` already does for the cache (`word_seeder.ts`'s own
`isMultiWord()` check, shared by both paths), and wires it into the
SYNONYM/pointer-relationship graph exactly like a single-word synset member.
`domainTag`/`relatedDomainTags`/`synsetId` exist on Phrase for that path
specifically, mirroring the identically-named Word fields.

Phrase is still shaped like Linguistics's `LinguisticUnit`, the same
deliberate dual-use Word already has: a Phrase is both a Vocabulary *type* (a
lexical entry, owned by this layer) and, via `toSyntheticWord`, materialisable
as a Linguistics *token* (one occurrence of that type in a sentence) without
Linguistics ever needing its own notion of a multi-word Vocabulary entry --
it already reads every token as a Word-shaped `LinguisticUnit` regardless of
how many raw source tokens that one reading actually consumed
(`TokenReading.tokenSpan`, `linguistics/data/token_reading.ts`).

### `entryId`'s identity fold

Phrase originally carried two separate top-level `Identifier` fields --
`uuid` (its own per-Domain graph identity) and `entryId` (the stable
identity authored once in the Common Vocabulary Cache) -- kept apart as a
deliberate exception to the fold Word/Sense/WordForm already use. That
exception was later undone: since `Identifier` itself carries a `uuid` of
its own (`value_objects/data/identifier.ts`), there was no reason for a
second `Identifier`-typed field to exist alongside it. Phrase now folds the
two roles into `entryId` exactly the way Word does (`entryId.value` stable
across Domains, `entryId.uuid` fresh per-Domain copy) -- see Word's own
entry above for the shape this mirrors.

### `phraseType`: structurally derived, not guessed

`phraseType` (the grammatical shape a Phrase's own words take -- noun
phrase, verb phrase, etc.) is populated by `WordSeeder.seedWordNet`'s own
`classifyPhraseType()` (`role/processor/phrase_processor.ts`) for every
multi-word WordNet synset lemma, derived structurally from the lemma's own
tokens and part of speech, not guessed -- that function's own docstring
documents the real `dict/` distribution this classification was built from.
It's undefined for a Common Vocabulary Cache closed-class Phrase, which has
no constituency-parsing pass of its own, and for the handful of WordNet
parts of speech `classifyPhraseType()` itself never maps (dead code against
real WordNet data today -- every real multi-word lemma is
NOUN/VERB/ADJECTIVE/ADVERB).

`data/entities/noun_phrase.ts` and its five siblings (one per `PhraseType`
member) narrow a Phrase down by this field the same way `data/entities/noun.ts`
and its own siblings narrow a Word down by `partOfSpeech`.

### The WordNet-tagged part of speech: `Phrases`'s own side index, not a Phrase field

Phrase originally carried its own `partOfSpeech` field, mirroring Word's --
the WordNet-tagged lexical category `classifyPhraseType()` takes as *input*
to derive `phraseType` as *output* (the section above). The two were never
independent facts, so once `phraseType` existed there was no remaining
reason for a Phrase to carry both a structural classification and the raw
tag it was derived from.

The naive fix -- drop the field, let `phraseType` stand in for it wherever
the seeder needed to tell two same-spelled Phrases apart -- doesn't work:
`classifyPhraseType()`'s own PHRASE_TYPE_PREPOSITIONS rule sends *both*
`PartOfSpeech.ADJECTIVE` and `PartOfSpeech.ADVERB` to the identical
`PhraseType.PREPOSITIONAL_PHRASE` for a lemma opening with a preposition
("at fault" ADJECTIVE, "by hand" ADVERB, both PREPOSITIONAL_PHRASE) -- so
`phraseType` alone can't recover which WordNet tag a given Phrase carries.
Verified directly against the real bundled WordNet 3.1 dict/ files: 21 real
multi-word lemmas ("in line", "on time", "out of place", ... ) have both an
ADJECTIVE-tagged and an ADVERB-tagged sense that both classify to
PREPOSITIONAL_PHRASE, so a dedup/lookup key built from `(text, phraseType)`
alone would conflate them.

The fact still has to live somewhere WordSeeder.seedWordNet's own polysemy-
merging dedup can reach it (`existing.partOfSpeech === synset.partOfSpeech`,
mirroring Word's own identical `(lemma, partOfSpeech)` reuse-across-synsets
pattern) -- so it moved to a private side index inside `Phrases` itself
(`data/phrases.ts`), keyed by each Phrase's own `graphUuid()`, populated by
the seeder at `Phrases.append()` time (a now-required second parameter) and
read back via `Phrases.partOfSpeechOf(phrase)`. This keeps the fact a
property of "this Phrase, in this Phrases store" rather than a field every
copy of a Phrase carries around regardless of whether anything still reads
it -- the seeder is the only real producer of this fact, so the seeder is
where the instruction "remember this" belongs, not the Phrase type itself.

`toSyntheticWord()`/`phraseAsWord()` (their own section below) both need a
`PartOfSpeech` to populate the synthetic Word they materialise -- they take
a `Phrases` reference now and call `phrases.partOfSpeechOf(phrase)`
internally, rather than reading a field Phrase no longer has.

### `words`: stored by reference, resolved structurally

`words` breaks a Phrase's own `text` down into its constituent Words, one
entry per whitespace-separated token, left to right. It's stored *by
reference* (an `Identifier`), the same "point at a uuid, don't embed a copy
of the Word itself" convention `LexicalRelationship`'s own
`sourceWordId`/`targetWordId` already use -- resolved the same way, via
`Dictionary.findByUuid()` -- not a duplicated Word snapshot that could drift
out of sync with the Dictionary's own copy.

A given position is undefined when no Word for that token exists in the
seeding Dictionary (WordNet itself never lexicalizes some closed-class
function words on their own) -- reported, not guessed, the same convention
`DefinitionWordReference` already uses for an unresolved definition token.

Populated by `WordSeeder.seedWordNet` only, after its own pass 1 has
finished seeding every single-word synset member (a phrase like "toy
poodle" can otherwise be processed before the standalone "toy"/"poodle"
synsets, in whatever order the loader returns them) -- always empty for a
Common Vocabulary Cache closed-class Phrase, which has no per-token
composition need of its own.

### `wordRoles`, `unresolvedHeadWord`, `headWordForm`, `headWord`: the linking pass

`wordRoles` assigns a `ModifierRole` to each position in `words`, computed by
`classifyModifierRoles()` (`role/processor/phrase_processor.ts`, that
function's own docstring for the full per-`PhraseType` Head/Modifier/
Particle/Determiner rules -- `data/phrase_type_patterns_and_word_roles.md`'s
own tables). A position is left `undefined` under the "No Role" Common Rule
from that same document: either the token itself never resolved in `words`,
or the Head Identification Rule/Word Role Assignment for this Phrase's own
`phraseType` genuinely assigns that position no role at all (a post-head
Noun in a Prepositional Phrase, for instance). Exactly one position holds
`ModifierRole.HEAD` when `phraseType` is defined and at least one word
resolves to that type's own Head part of speech -- never more than one, per
that document's own "Head" Common Rule.

`unresolvedHeadWord` is `words[wordRoles.indexOf(ModifierRole.HEAD)]` --
kept as its own field rather than left for every caller to re-derive by
scanning `wordRoles`, since `linkPhraseWords()` already knows the Head's own
index the moment it computes `wordRoles` and sets both in the same pass. It
is named `unresolvedHeadWord`, not `headWord`, because an `Identifier` is a
graph-reference pointer a caller still has to resolve against a Dictionary
(`builder_phrase.ts`'s own `phraseHeadWordSegment()`, in particular) -- never
the resolved Word entity itself.

`headWordForm` is `unresolvedHeadWord`'s own literal spelling as it actually
appears in this Phrase's own `text` -- the token `classifyModifierRoles()`
identified as the Head, before Dictionary resolution ("at" in "at fault",
never resolved to any Word at all, but `headWordForm` still names which
token filled that role). Distinct from `headWord`'s own resolved
`Word.lexicalForm` on purpose: this is the phrase-local surface form
(matters for a token whose casing or inflection in this exact phrase might
differ from that Word's own canonical spelling elsewhere), not a second copy
of the same fact.

`headWord` is `unresolvedHeadWord` resolved via `Dictionary.findByUuid()` --
genuinely populated, for every real multi-word WordNet Phrase, by
`linkPhraseWords()` right alongside `unresolvedHeadWord` itself. Every
`*_phrase.ts` subtype narrows this down to the specific Word subtype(s) its
own Head Identification Rule allows -- `NounPhrase` to `Noun | Pronoun`, for
instance -- the same way each subtype already narrows `phraseType` to one
literal `PhraseType` member.

### `preModifiers`/`postModifiers`: naming and scope

`Word | Phrase | Clause` is deliberately the broadest constituent union any
`PhraseType`'s own MODIFIER row ever needs
(`data/phrase_type_patterns_and_word_roles.md`'s own "Phrase Role Allowed
Types" table) -- every `*_phrase.ts` subtype narrows this down to the
specific constituent type(s) its own MODIFIER row actually allows, the same
way each subtype already narrows `headWord` to its own HEAD row.

Named `preModifiers`/`postModifiers`, not one combined `modifiers`, even
though `ModifierRole.MODIFIER` itself draws no pre/post distinction and the
Allowed Types table's own MODIFIER row doesn't either: not every
`PhraseType` places its modifiers before the Head in practice (`VerbPhrase`'s
own "(Auxiliary verbs) + Main verb + (Particles) + (Complements) +
(Modifiers)" structure puts them last, `PrepositionalPhrase`'s own
"Preposition + Noun phrase/complement + (Modifiers)" too), and these two
fields name the constituent's *role*, not its *position* within `text`.

Both are genuinely populated, today, by `linkPhraseWords()`, for every
MODIFIER-role position that resolves to a real single Word -- deliberately
Word-only: nothing in this codebase parses a phrase's own text into nested
sub-phrase/Clause spans, so a MODIFIER that would actually be one of those
(the Allowed Types table also permits `AdjectivePhrase`/`NounPhrase`/
`AdverbPhrase`/`PrepositionalPhrase`/`Clause` here) is simply left out
rather than guessed at.

### Two Word projections: `toSyntheticWord` vs `phraseAsWord`

Both materialise a Phrase as a Word-shaped `LinguisticUnit`, for different
reasons.

`toSyntheticWord()` is the token side of Phrase's own dual Vocabulary-type/
Linguistics-token use described above -- never inserted into any
Dictionary, only ever handed to a Linguistics-facing caller
(`DictionaryProcessor.identifyPhrase()`) that expects a `WordIdentifier`'s
own `.word: Word` field. A fresh `entryId.uuid` on every call is correct,
not a bug: this Word is a token (one occurrence in one reading), never
persisted or looked up again by identity, the same as any other Word
materialised for a sentence.

`phraseAsWord()` is the identity-preserving projection instead -- it passes
`phrase.entryId` straight through, so the resulting Word resolves under the
identical identity the Phrase itself is known by. It exists because a
`LexicalRelationship`'s `sourceWordId`/`targetWordId` is an opaque uuid
string that doesn't record which store (`Dictionary` or `Phrases`) it came
from, so every place that resolves a relationship endpoint -- `role/word_processor.ts`'s
own `relatedWords()` family, `DictionaryView`'s relationship/Hierarchy
rendering -- needs to turn that endpoint back into something displayable
regardless of which store actually holds it, only after a Dictionary lookup
by the same uuid has already failed. When `wordForms` is supplied, it also
registers a matching base-lemma `WordForm` under this same `phrase.entryId`
(idempotent find-or-create), carrying `phrase.senseIds`/`phrase.synsetId`
across -- `builder_word.ts`'s own `wordRecordFor()` is why its own two call
sites always pass one; without it, the returned Word carries no senses at
all.
