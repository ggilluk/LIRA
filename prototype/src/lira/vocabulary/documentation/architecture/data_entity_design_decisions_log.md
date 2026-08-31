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
all. It now passes `phrase.lexicalForm` straight through as the WordForm's
own `text` too (rather than leaving it to `registerBaseLemmaForm()`'s own
bare `{value: word.text}` default), so the synthetic Word's base-lemma
WordForm carries the same language/dialect/version facts the Phrase's own
`lexicalForm` does -- the section right below explains why those facts live
there and not on Phrase itself.

### `version`/`languageCode`/`dialectCodes`: moved onto `lexicalForm`'s own `Text`

Phrase originally carried these as three of its own top-level fields,
mirroring the Vocabulary Layer's ported Python specification (`documentation/README.md`
4.2's `version`/`language_code`/`dialect_codes` Word fields, Phrase's own
equivalents). Each one is really a fact about *one specific wording* --
which language it's written in, which regional/social variety it belongs
to, which revision of it this is -- not a fact about the Phrase record as a
whole, so once `Text` itself grew `languageCode`/`dialectCode`/`version` as
its own supplementary components (`value_objects/data/text.ts`'s own
docstring on why: the identical reasoning already justified `Text.scriptCode`)
there was no remaining reason for Phrase to carry a second, entity-level
copy of the same three facts alongside its own `lexicalForm: Text`.

This mirrors a migration Word already went through: Word lost its own
`lexicalForm`/`normalisedForm`/`version`/`languageCode` fields entirely when
`WordForm` was introduced (`WordForm`'s own docstring, data/entities/word_form.ts)
-- a Word's canonical spelling, and every fact about that one spelling,
moved onto its base-lemma `WordForm.text`. Phrase never went through that
migration (there is no `PhraseForm` -- a Phrase's `lexicalForm`/`normalisedForm`
already live directly on Phrase itself, `words`'s own docstring on why a
Phrase has no per-token composition store the way Word now has WordForms),
so `version`/`languageCode`/`dialectCodes` had nowhere to land except back
onto that same already-present `lexicalForm` field -- no new indirection
needed, unlike Word's case.

`dialectCodes` stayed a genuine gap in Word's own earlier WordForm migration
-- it was never carried across at the time, so Word still had its own
top-level `dialectCodes: Code[]` until this decision, read only by
`builder_word.ts`'s own `dialect_codes` column and the (uncalled)
`WordSeeder.promoteWord()`/`wordToEntry()` promotion path. It now resolves
via `WordForms.baseLemmaFormOf(word)?.text.dialectCode` instead, closing
that gap the same way Phrase's own `lexicalForm.dialectCode` does.

Verified directly against the real bundled Common Vocabulary Cache before
this change: every entry's own `version`/`language_code` is a uniform
`"1.0"`/`"en"` and every `dialect_codes` array is empty (`[]`) -- none of
the three ever varied in practice, so this move loses no real data, only
relocates where the (currently uniform) fact is read from. `Text.dialectCode`
is singular, unlike the old `dialectCodes: Code[]` array it replaces -- a
narrowing from "any number of dialects" to "at most one" that's lossless
today (nothing in the real cache or WordNet path ever populates more than
zero), documented here as a deliberate, not accidental, narrowing should a
future asset ever need more than one.

### `headWord`/`headWordForm`: by-reference, not an embedded copy or a raw spelling

Phrase originally carried two separate Head-related fields alongside the
already-by-reference `unresolvedHeadWord?: Identifier`: `headWord?: Word`
(the Head's own resolved Word, embedded directly on the Phrase -- a real
object copy stored per-Domain, unlike every other structural field on
Phrase, all of which already reference by uuid) and `headWordForm?: Text`
(the Head's own literal spelling as it appears in this Phrase's own
`text` -- a bare string value, never linked to any real `WordForm`
entity). Both are now by-reference instead: `headWord?: Identifier`
absorbs `unresolvedHeadWord`'s own former role outright (the two held the
exact same value -- `unresolvedHeadWord` was always `words[wordRoles.indexOf(HEAD)]`,
and `headWord` was always that same Identifier resolved via
`Dictionary.findByUuid()` -- so keeping both was pure duplication once
`headWord` itself became a reference), and `headWordForm?: Identifier` now
points at the one real `WordForm` (data/entities/word_form.ts), owned by
`headWord`'s own resolved Word, whose own spelling case-insensitively
matches this Head's literal occurrence in `phrase.text` -- resolved via
`WordForms.findByUuid()`, the same `WordForms`-store pattern
`wordFormIds`/`baseLemmaFormOf()` already use elsewhere.

`linkPhraseWords()` (role/processor/phrase_processor.ts) now takes an
optional `wordForms: WordForms` parameter (matching every other seeding
pass's own `Senses`/`WordForms` convention) to perform this match --
`wordForms.formsOf(headWordEntity).find(form => form.text.value.toLowerCase()
=== token.toLowerCase())`, exactly the match `definitionWordSegment()`
(ui/server/builder_segment.ts) already performs when rendering any other
word reference inside a definition, so a Head Word's own case-insensitive
spelling match behaves identically to every other resolved word reference
in the UI. `headWordForm` stays undefined whenever `wordForms` is omitted,
or whenever the Head's own resolved Word carries no WordForm spelled
exactly the way it appears in this Phrase (an inflected/irregular spelling
this Phrase happens to use that was never separately registered) -- unlike
the old field, which always held *some* raw text whenever a Head was
identified at all, regardless of whether any WordForm existed to back it.
This is a real, deliberate behavior narrowing (a reference can fail to
resolve; a raw string copy never could), accepted because a `headWordForm`
that resolves to nothing meaningful is no more useful to a caller than one
that's simply absent.

Every `*_phrase.ts` subtype (`noun_phrase.ts`, `verb_phrase.ts`,
`adjective_phrase.ts`, `adverb_phrase.ts`, `prepositional_phrase.ts`) used
to narrow `headWord` down to its own specific resolved Word subtype (e.g.
`NounPhrase.headWord: Noun | Pronoun`) -- with `headWord` now an
`Identifier`, an `Identifier` carries no type of its own to narrow, so
each subtype's own field-level narrowing is gone; the same fact (which
Word subtype(s) a real seeded Phrase of that PhraseType's Head always
resolves to) is now documented in prose on each subtype's own docstring
instead, unchanged in substance. `InfinitivePhrase` never narrowed
`headWord` to begin with (an infinitive has no single Word POS subtype
it mirrors), so it needed no change.

`ui/server/builder_phrase.ts`'s `phraseHeadWordSegment()` -- the one real
consumer -- now resolves both references before handing them to
`definitionWordSegment()`: `wordForms.findByUuid(phrase.headWordForm.value)`
for the WordForm's own spelling (`form.text.value`, the exact surface text
`definitionWordSegment()` needs), `dictionary.findByUuid(phrase.headWord.value)`
for the resolved Word. Verified end-to-end against real seeded WordNet
data (Playwright, Phrases tab, "toy poodle"): the detail panel's own "Head
Word" row renders "poodle" with a working tooltip (Noun · Common · Base
Lemma Canonical Form: poodle), the identical rendering the old embedded-copy
shape produced, confirming the by-reference resolution is behaviorally
transparent to this UI.

### `classifyDeterminerPhrase()`: "a bit"/"a few" as NOUN_PHRASE, not their WordNet-tagged function

Reported bug: "a bit" and "a few" weren't recognised as NounPhrases.
`classifyPhraseType()` (role/processor/phrase_processor.ts) trusted
WordNet's own synset tag for the *whole* multi-word lemma with only two
structural overrides ahead of it (PREPOSITIONAL_PHRASE, INFINITIVE_PHRASE)
-- neither applied here, so each fell straight through to the POS-based
switch keyed on the idiomatic *function* WordNet tagged it by, not its
actual *structure*. WordNet tags "a bit" ADVERB ("to a small degree"), so
it became ADVERB_PHRASE -- and since neither "a" nor "bit" is
Adverb-capable, `adverbPhraseHeadIndex` found no Head at all (confirmed
directly: `wordRoles = [DETERMINER, undefined]`, `headWord`/`headWordForm`
both stayed undefined). WordNet tags "a few" ADJECTIVE (`a_few(a)`'s own
satellite synset), so it became ADJECTIVE_PHRASE -- and did resolve a Head
("few" is independently WordNet-tagged ADJECTIVE too), just the wrong
PhraseType. Both are structurally `Determiner + Noun-quantifier` --
literally NOUN_PHRASE's own documented shape, `"(Determiner) +
(Modifiers) + Noun/Pronoun + (Complements)"`.

Fixed with a new `classifyDeterminerPhrase(tokens, lemma, nounLemmas)`
check in the identical "structural override ahead of the POS-based
switch" slot the PREPOSITIONAL_PHRASE/INFINITIVE_PHRASE checks already
occupy: `tokens[0]` is the indefinite article ("a"/"an") and a real Noun
resolves among the remaining tokens -- routes to NOUN_PHRASE. No new
PhraseType was added for this (a "Determiner Phrase" enum value) -- the
enum is fixed at six categories, numerically mirrored by Linguistics' own
PhraseType (enums/phrase_type.ts's own docstring), and this fits
NOUN_PHRASE's existing shape exactly.

`nounLemmas` is `verbLemmas`'s own exact counterpart (the pre-existing set
INFINITIVE_PHRASE's own check already builds) -- every single-word
NOUN-tagged lemma across the whole synset list, built once up front by
`seedWordNet()` before pass 1 runs, *not* a live `Dictionary` lookup:
exactly the same reason `verbLemmas` isn't a `dictionary.lookup()` check
either (that field's own pre-existing docstring) -- a Phrase like "a bit"
can be processed before the standalone "bit" synset, in whatever order
`loadWordNetSynsets()` itself returns, so a live Dictionary lookup would
give a different, seeding-order-dependent answer. `classifyPhraseType()`
itself gained a fourth `nounLemmas: ReadonlySet<string>` parameter for
this; `synsetMemberToPhrase()` (word_seeder.ts, its own one real call
site) threads it through the same way it already threads `verbLemmas`.

Deliberately scoped to the indefinite article ("a"/"an") alone, not the
full `PHRASE_TYPE_DETERMINERS` set `classifyModifierRoles()` uses --
verified directly against every real bundled ADJECTIVE/ADVERB multi-word
lemma opening with any of those determiners (not guessed): broadening to
"all"/"every"/"each"/"the"/"many"/"that"/"what" would pull in over a
dozen further idioms ("all right", "all over", "that is to say", "every
last", "many a") whose own remaining tokens likewise happen to resolve an
unrelated, obscure Noun homograph purely by coincidence -- "right"'s
civil-rights sense, "over"'s cricket-innings sense, "in"'s Indiana-postal-
abbreviation sense, "say"'s "have your say" sense, even "a"/"an"
themselves (a unit-symbol/letter-name sense) -- not because the idiom is
genuinely headed by a noun. Correctly separating those false positives
from the genuine hits among the same broader set ("every week", "each
year", "this evening", "all the time") would need real per-idiom
judgement this fix doesn't attempt; "a"/"an" alone stays a small, clean,
real closed set instead, where every hit enumerated against the bundled
data is a genuine Determiner + Noun-quantifier construction: "a bit", "a
little", "a lot", "a trifle", "a good/great deal", "a hundred/million
times", "a couple of", "a few".

Within that "a"/"an" scope, three lookalikes needed a hand-verified
denylist (`DETERMINER_PHRASE_LOOKALIKE_DENYLIST`, the identical shape
`INFINITIVE_LOOKALIKE_DENYLIST` already has): "a capella"/"a la
carte"/"a la mode" are Latin/French loans where "a" isn't the English
article at all, but each happens to contain a token with an unrelated,
independently-real WordNet Noun -- "Capella" the star, "carte"/"mode" the
common nouns (verified directly: `index.noun` lists all three). "a
cappella" (double-p) and "a fortiori"/"a posteriori"/"a priori" need no
denylist entry -- none of their own remaining tokens resolves a real Noun
in the first place, so `classifyDeterminerPhrase()` already excludes them
on its own.

### `synsetId`: a side index, not a field, everywhere it appeared

`Sense`, `WordForm`, and `Phrase` each originally carried their own
`synsetId?: Identifier` field, naming the Princeton WordNet synset the
entity corresponds to. All three lost it: WordNet's own synset identifier
is an *externally* defined attribute (WordNet's own, not a fact this
codebase's own data model needs to assert about itself) -- `senseIds` is
already the correct, internal way every Word/Phrase names which Sense(s) it
lexicalizes, and `Sense` is already this codebase's own first-class
counterpart to a WordNet synset (Sense's own docstring above `## Sense`).
A second, WordNet-specific identifier duplicated onto three different
entity types, alongside the `senseIds` reference that already reaches the
one place (`Sense`) that fact belongs, was the thing to remove -- not
`senseIds` itself, which stays exactly as it was.

Each of the three now keeps this fact in a private side index instead,
mirroring the identical `Phrases.partOfSpeechByUuid` pattern this same log
already documents for `Phrase`'s own WordNet-tagged part of speech:
- `Senses.synsetIdByUuid` (paired with the pre-existing `bySynsetId`
  reverse index `WordSeeder.seedWordNet`'s own per-synset dedup needs),
  read via `Senses.synsetIdOf(sense)`, written via `Senses.append(sense, synsetId?)`.
- `WordForms.synsetIdByUuid`, read via `WordForms.synsetIdOf(word)`
  (unchanged signature -- only its own backing store moved), written via
  `WordForms.registerBaseLemmaForm(word, text, extra, synsetId?)`'s new
  fourth parameter (previously folded into `extra`, but `synsetId` was
  never really a `WordForm` attribute to begin with) or directly via the
  new `WordForms.setSynsetId(form, synsetId)`.
- `Phrases.synsetIdByUuid`, read via `Phrases.synsetIdOf(phrase)`, written
  via `Phrases.append(phrase, partOfSpeech, synsetId?)`'s new third
  parameter, or directly via the new `Phrases.setSynsetId(phrase, synsetId)`.

`WordSeeder.orderSensesByFrequency()` is the one place that needs the
setter form directly, not just the constructor-time parameter: it reorders
a polysemous Word/Phrase's own `senseIds` by real usage frequency after
every synset has been seeded, and re-syncs the denormalized synset
identifier to match the new `senseIds[0]` in the same pass (that method's
own docstring on why this invariant matters and how it stays correct --
the same reasoning applied before this change, just against a side index
now instead of a field write).

### `WordForm.pronunciations`: removed outright, not migrated

`WordForm` originally carried `pronunciations: readonly Pronunciation[]`
(`Pronunciation { notation: Text; value: Text; dialectCode?: Code }`,
data/pronunciation.ts). Once `Text` itself grew `dialectCode` (the section
above, and `Text`'s own docstring), `Pronunciation.dialectCode` became the
same redundancy `version`/`languageCode`/`dialectCodes` already were on
Word/Phrase -- a fact about one specific value (`Pronunciation.value`)
duplicated as a sibling field instead of living on that value's own `Text`.

Unlike that earlier migration, this one didn't fold `dialectCode` onto
`Pronunciation.value` and keep the rest -- it deleted `Pronunciation`
outright, along with `WordForm.pronunciations`, `WordFormAttributes`'s own
`"pronunciations"` entry, and `WordFileEntry.pronunciations` (the wire
schema field). The difference from the `version`/`languageCode`/
`dialectCodes` case: those had real producers and consumers (the Common
Vocabulary Cache, WordNet, the UI's own `dialect_codes` column) that
needed their data preserved somewhere. `Pronunciation` had none, anywhere
in this codebase -- confirmed directly: every real `pronunciations` array
was always the hardcoded `[]` `createWordForm()` itself defaults to;
nothing in `WordSeeder` ever read `WordFileEntry.pronunciations` into it
(the wire field existed in the bundled JSON, unused, and everywhere
`Pronunciation`'s own fields were reachable, the reachable value was
always empty). Migrating a type nothing produces or consumes would just
relocate dead code, not fix a redundancy with live data behind it, so it
was removed instead. The bundled JSON assets still carry a `"pronunciations": []`
key per entry -- left as-is; an unread key in a data file costs nothing,
and touching every asset file for a key the loader was already ignoring
would be a needless, higher-risk change for the same zero-behavior-change
result. Re-adding real pronunciation data in the future should model it
directly as one more `Text`-typed field/array on `WordForm` (carrying its
own `languageCode`/`dialectCode` the same way `text` itself now can),
rather than reintroducing a bespoke value object to hold what `Text`
already expresses.

### `syllableRepresentation`/`syllableCount`/`stressPattern`: removed, unlike `frequencyValue`/`frequencyScale`

`WordForm` originally carried five curated-attribute fields side by side:
`syllableRepresentation`/`syllableCount`/`stressPattern` and
`frequencyValue`/`frequencyScale`. The first three are gone; the frequency
pair stays. The difference isn't producer/consumer symmetry the way
`Pronunciation`'s removal above was (every producer/consumer pair there
was equally dead) -- here the three removed fields and the two kept ones
have genuinely different data profiles, verified directly against the
real bundled Common Vocabulary Cache before removing anything:
`syllable_representation`/`stress_pattern` are null on every real entry
(the same "always empty" profile `version`/`language_code`/`dialect_codes`
had before their own migration), but `syllable_count` is genuinely
populated -- real, curated integer values on thousands of entries.

What all three removed fields share, and what actually decided this,
isn't their own data: it's that **nothing anywhere in this codebase ever
read any of the three back off a `WordForm`** -- no builder, no client
view, no test, confirmed by a repo-wide search before removing. Real
`syllable_count` data existed, but it was already fully invisible to
every caller; removing it changes nothing any user could observe, the
same standard `Pronunciation`'s removal applied, just with a real (if
unconsumed) dataset behind one of the three fields this time instead of
none. `frequencyValue`/`frequencyScale` stayed for the opposite reason:
`ui/server/builder_word.ts`'s own Word Forms section genuinely reads them
through `wordFormsFor()`.

The wire schema (`WordFileEntry.syllable_representation`/`syllable_count`/
`stress_pattern`, `role/asset_loader.ts`) and `WordSeeder.validateAssets()`'s
own `syllable_count` integer-range check both stay, deliberately, unlike
`Pronunciation`'s wire field (which was dropped since nothing ever
validated or read it either). Validating the shape of the *source* asset
file is a different concern from storing the parsed result on a `WordForm`
-- catching a malformed `syllable_count` in the JSON is still worth doing
regardless of whether anything downstream keeps that value once parsed,
so `recordWordFormAttributes()` stopped storing it, but nothing about the
asset validation pass changed.

### `normalisedForm`: derivable on demand, not a second stored `Text`

Phrase originally carried `normalisedForm?: Text` alongside `lexicalForm`
-- `lexicalForm`'s own lower-cased value, defaulted by `createPhrase()` to
`{value: phrase.text.toLowerCase()}` whenever a caller didn't supply one,
and read back from `entryToPhrase()`'s own `entry.normalised_form` for a
real Common Vocabulary Cache entry. Removed outright: `textToLowerCase()`
(value_objects/data/text.ts) now derives the identical value from
`phrase.lexicalForm` on demand, so `normalisedForm` was never an
independent fact -- purely `lexicalForm.value.toLowerCase()`, kept in
sync by convention (`createPhrase()`'s own default) rather than by
construction. `Phrases`'s own `byText` lookup index already normalises
this way internally (`text.toLowerCase()` at both `append()` and
`lookupAll()` time) and never read the stored field either, so nothing
outside `createPhrase()`/`entryToPhrase()` themselves ever touched it.

The wire schema field (`WordFileEntry.normalised_form`) and
`WordSeeder.validateAssets()`'s own consistency check on it (`entry.normalised_form`
must equal `entry.lexical_form.toLowerCase()`) both stay, the same
`syllable_count` precedent immediately above: validating the source
asset's own internal consistency is a different concern from storing the
already-derivable value on a `Phrase`.

### `words`/`wordRoles`: removed once `headWord`/`preModifiers`/`postModifiers`/`determiners` existed as their own typed fields

Supersedes the "`words`: stored by reference, resolved structurally" and
"`wordRoles`, `unresolvedHeadWord`, `headWordForm`, `headWord`: the linking
pass" sections above (both still accurate as historical record of why
those fields existed in the first place): `Phrase` no longer carries
`words: readonly (Identifier | undefined)[]` or
`wordRoles: readonly (ModifierRole | undefined)[]` at all. Once `headWord`
(this document's own `headWord`/`headWordForm` section, above) and
`preModifiers`/`postModifiers`/`determiners` (next section) exist as their
own typed, purpose-built fields, the full per-token `words`/`wordRoles`
arrays were pure duplication -- every real field derived from them, and no
other consumer read either one directly (confirmed by a repo-wide grep
before removing: only `linkPhraseWords()` itself, `phraseWordSegments()`/
`phraseModifierSegments()` in `ui/server/builder_phrase.ts`, and this
codebase's own tests ever touched either field).

`linkPhraseWords()` (role/processor/phrase_processor.ts) still computes an
equivalent `words`/`wordRoles` pair, but as local variables scoped to that
one function call, never written back onto the `Phrase`. `phraseWordSegments()`/
`phraseModifierSegments()` (ui/server/builder_phrase.ts) now recompute the
identical facts fresh at render time instead -- `dictionary.lookup(token)`
per token for the former, a direct `classifyModifierRoles()` call for the
latter -- rather than reading a stored array. This isn't a new pattern for
either function: `phraseModifierSegments()` already recomputed from
`phrase.text`/`phrase.wordRoles`/`phrase.words` rather than reading
`preModifiers`/`postModifiers` directly, for the exact same reason this
section's own new fields still can't fully replace it (below) -- this
change just moves where the recomputed values come from, not whether
recomputation happens at all.

One real, unanticipated consequence, found only once the type-checker
caught it: `"words" in x` was the codebase-wide idiom for narrowing a
`Word | Phrase` union (`Senses.memberUuid()`, `WordSeeder`'s own
`endpointUuid()`/`memberUuid()`/`memberPartOfSpeech()`/`registerUniqueSense()`,
several `ui/server/resolver_*.ts`/`builder_*.ts` functions, and this
codebase's own tests) -- removing `Phrase.words` broke every one of those
call sites, not just the two functions this change was actually about.
Fixed by switching the discriminant to `"senseIds" in x` instead:
`Phrase.senseIds` is required (never optional, unlike `phraseType`) and,
since `Word`'s own former `senseIds` field moved onto its base-lemma
WordForm this session (`synsetId`/pronunciation/syllable sections above,
and the WordForm migration itself), is now exclusively a `Phrase` field --
confirmed by the compiler itself once the swap was made: every remaining
`Word`-vs-`Phrase` narrowing call site resolved cleanly.

### `preModifiers`/`postModifiers`/`determiners`: WordForm references, not embedded Words

Supersedes the "`preModifiers`/`postModifiers`: naming and scope" section
above. Both fields' own element type changed from `Word | Phrase | Clause`
to `Identifier | Phrase | Clause` -- the same "by-reference, not an
embedded copy" correction `headWord`/`headWordForm` already went through
(this document's own section on that change): each `Identifier` now points
at the one WordForm (data/entities/word_form.ts), owned by that
MODIFIER-role token's own resolved Word, whose own spelling matches this
token's literal occurrence in `phrase.text` -- `headWordForm`'s own exact
resolution rule, one ModifierRole over, via the same `matchingFormId()`
helper `linkPhraseWords()` now shares across `headWordForm`/`preModifiers`/
`postModifiers`/`determiners` alike. A MODIFIER-role token whose own
resolved Word carries no WordForm spelled the way it appears here is left
out of `preModifiers`/`postModifiers` entirely now, rather than included
via its bare `Word` regardless (a real, deliberate behavior narrowing, the
same one `headWordForm` itself already accepted: a reference that can't
resolve is no more useful than one that's simply absent). Every
`*_phrase.ts` subtype's own `XPhraseModifier` union dropped the `Word`
subtype member(s) it used to narrow to (`Noun`, `Adjective`, `Adverb`,
...) -- an `Identifier` carries no type of its own to narrow, the same
reason `headWord`'s own per-subtype narrowing was dropped earlier -- while
keeping its own `Phrase` subtype members (`NounPhrase`, `AdjectivePhrase`,
...) intact, since those genuinely narrow the embedded-constituent half of
the union.

`determiners?: readonly Identifier[]` is new -- `preModifiers`'s own exact
shape and resolution rule, one ModifierRole over (the Common Rules table's
own "Determiner" row applies regardless of `PhraseType` or position, so
unlike `preModifiers`/`postModifiers` this is never split pre/post). Added
because nothing else on `Phrase` had ever stored this fact as a typed
field -- the Phrases tab's own "Determiners:" detail-panel row
(`ui/client/client_detail_panel_controller.ts`) existed and worked before
this change, built by `phraseModifierSegments()` re-scanning
`wordRoles`/`words` for `DETERMINER`-role tokens, with no dedicated
resolved field of its own to read instead. Verified directly against real
seeded WordNet data: `determiners` stays *empty* far more often than
`preModifiers`/`postModifiers` do, since WordNet lexicalizes almost none
of the closed set of English determiners as a standalone sense ("the",
"this", "my" have no Dictionary entry at all, hence no WordForm to
reference) -- only the minority that double as a real WordNet lemma
("few", "many", "all") ever populate it. `phraseModifierSegments()`
itself, notably, does *not* read this new field either (the same
"recomputes rather than trusts a stored reference" reasoning as
`words`/`wordRoles` above) -- it still shows every Determiner token,
resolved or not (`definitionWordSegment()`'s own `resolved: false`
fallback), which the reference-only `determiners` field alone could never
reproduce for a bare function word like "the". Verified end-to-end against
real seeded WordNet data (Playwright): "toy poodle"'s own Pre-Modifiers
row still shows "toy" with a working tooltip, and "in the meantime"'s own
Determiners row still shows "the" as unresolved plain text exactly as
before -- the by-reference `preModifiers`/`postModifiers`/`determiners`
fields and the live-recomputing UI path coexist without conflict, each
serving the purpose the other can't.

### `gloss` retired on both Word and Phrase: `definition` alone survives

Verified directly against every bundled `assets/common/en/*.json` file
(top-level entries and each `forms` array) before touching any code: of
the 3958 entries carrying both a `gloss` and a `definition`, all 3958 are
byte-for-byte identical -- and no entry anywhere has one without the
other. `gloss` was never an independent fact for Word or Phrase, only a
second name for the same hand-curated text `definition` already carried
(a WordNet-seeded Word/Phrase never populated `gloss` at all, only
`definition` -- the same asymmetry `Sense.gloss`/`Sense.definition` still
carry today, deliberately left untouched: a Sense's own `gloss` genuinely
does serve a distinct short-summary role there, this decision doesn't
extend to it). `Word.gloss`/`Phrase.gloss` are gone; `Word.definition` is
new (`Word` had none of its own before this -- Sense's own docstring on
why that used to be an accepted gap, mirroring the identical PAD gap) and
`Phrase.definition` is unchanged in shape, just now the only field of its
kind on either entity.

The wire schema followed suit: `WordFileEntry.gloss` (`role/asset_loader.ts`)
had zero `validateAssets()` consistency check of its own -- unlike, say,
`syllable_count`, which stays as a wire field with no stored counterpart
specifically because it still has one -- so it was removed outright,
matching the `Pronunciation` precedent from earlier in this same log
(a wire field with no validator and no consumer once the stored field is
gone is dead weight, not a compatibility shim worth keeping). The bundled
JSON asset files themselves were left untouched: an unread `gloss` key
sitting in a real `.json` file is harmless, the same reasoning that
applied when `Pronunciation` was dropped.

`role/word_seeder.ts`'s `cacheDefinition` side-channel Map -- which
existed *purely* because "Word carries no `definition` of its own" was
true at the time -- is now provably redundant and was deleted outright:
its one real read site (`seedClosedClassWords()`'s call into
`registerUniqueSense()`) now reads `copy.definition` directly off the
already-in-scope per-Domain Word, the same way a Phrase call site already
read `entry.definition` directly. `registerUniqueSense()`'s own
`wordDefinition?: Text` parameter survives, though its purpose narrowed:
it's no longer covering for Word's missing `definition`, only for the
one case a Word's own singular `definition` genuinely can't serve --
`cacheSenses`/`entry.senses[]`, the ordered multi-sense hand-curated
case, where each call passes a distinct per-Sense text rather than the
Word's own one value.

`ui/server/resolver_domain.ts`'s `senseFieldsFor()` had carried two
structurally different fallback branches -- one for `Word` (no
`definition` to fall back to), one for `Phrase` (its own `definition`
field) -- ever since the Word/Phrase split first happened. Once Word
regained `definition`, the two branches became byte-for-byte identical,
so they collapsed into one shared return; `gloss` was dropped from that
fallback shape entirely; the primary, Sense-resolved branch (`sense.gloss`)
is untouched, since `Sense.gloss` still exists and still resolves first
whenever a matching Sense is found in this Domain. The one behavior
change this produces: an un-resolvable Word (its own Sense not found in
the current Domain -- the same cross-Domain-copy accepted gap
`SemanticRelationshipStore` already has) now falls back to its own
`definition` exactly the way an un-resolvable Phrase always has, instead
of showing a blank definition -- closing the asymmetry, not just
preserving it under a new name. `vocabulary.test.ts`'s own regression
test for this path was rewritten to assert the new, closed-gap behavior
rather than the old accepted-gap one.

Two server-side search filters were quietly inconsistent with each other
before this change, discovered while auditing every remaining `gloss`
reference: `searchWords()`/`searchPhrases()` (`ui/server/builder_word.ts`/
`builder_phrase.ts`) each read `definitionQuery` correctly through
`senseFieldsFor()` already, but `glossQuery` read the raw entity field
(`word.gloss?.value`/`phrase.gloss?.value`) directly, bypassing Sense
entirely -- out of step with the client-side small-Domain path
(`client_words_tab_view.ts`/`client_phrases_tab_view.ts`), which has
always filtered on the Sense-derived `WordRecord.gloss`/`PhraseRecord.gloss`.
Since the raw entity field no longer exists at all, fixing `glossQuery`
to route through `senseFieldsFor()` was required, not optional -- and it
happens to close that pre-existing inconsistency for free. The gloss
search box itself (`#search-gloss`, `ui/client/client_shell_html.ts`) was
kept exactly as-is: it's one shared toolbar reused by the Words, Phrases,
*and* Senses tab panels alike, so removing it would have broken Senses'
own still-genuine gloss search too -- only the two server-side filters'
data source changed, not the UI surface.

`ui/server/builder_segment.ts`'s `definitionWordSegment()` -- the
tooltip-preview builder behind every underlined word link inside a
rendered definition -- read `resolved.gloss?.value` directly off the raw
Word as its first-choice preview text, falling back to the Sense-derived
`fields.definition`. With `Word.gloss` gone, this became
`fields.gloss?.value ?? fields.definition?.value ?? ""` -- the identical
short-gloss-over-long-definition preference, just sourced entirely
through `senseFieldsFor()` (Sense's own `gloss` when a matching Sense
resolves, otherwise straight to `definition`) instead of half raw-entity,
half Sense.

Two smaller call sites outside the Word/Phrase entities themselves also
needed the rename, found via `tsc -b --force` after the entity fields
changed (not anticipated up front): `role/auxiliary_seeder.ts` and
`role/determiner_seeder.ts` each construct their own hand-curated Word
with `gloss: { value: lemmaSeed.definition }` -- both became
`definition: { value: lemmaSeed.definition }`; their own sibling
`createSense()` calls a few lines below (which do set `Sense.gloss`
deliberately) were left untouched, since Sense's own `gloss` isn't in
scope here. `linguistics/role/graph_processor.ts`'s `materialiseToken()`
also builds a transient, never-persisted `Word` with a placeholder
"Pending external hydration..." message on `gloss` -- moved to
`definition` the same way. `data/external_word_candidate.ts`'s own
`gloss?: Text` field (mirroring what Word used to support, per its own
docstring) turned out to have zero production write sites populating it
at all (confirmed by grep on `role/external_dictionary_adapter.ts`) --
always `undefined` in practice -- so it was dropped outright rather than
renamed, and `role/dictionary_hydrator.ts`'s own `gloss: candidate.gloss`
(itself therefore always `undefined` before this change) became
`definition: candidate.definition`, the field that adapter actually
populates.

Verified end-to-end against the real bundled WordNet 3.1 dataset
(Playwright, ~92,705 Words / ~64,463 Phrases seeded): a Word's detail
panel (e.g. "abdicate") still renders its definition with working,
underlined word-link tooltips; a Phrase's detail panel (e.g. "toy
poodle") still renders its definition, Head Word, and Pre-Modifiers
correctly; gloss search still finds a hand-curated closed-class entry
(e.g. searching "already referred" finds the Pronoun "ones") via its
Sense-derived `gloss`, while searching a WordNet-only term's `gloss`
correctly returns no matches -- WordNet-seeded Senses never populated
`gloss` before this change either, so that emptiness is pre-existing
behavior, not a regression.
