# Data Entity Design Decisions Log

Design history for the Vocabulary Layer's data entities (`data/entities/*.ts`
and the sibling top-level entities still awaiting their own move into
`entities/`, such as `data/infinitive_phrase.ts` -- the rest of the
`*_phrase.ts` family, `phrase.ts`/`prepositional_phrase.ts` included, has
already made that move) -- the "why" behind a shape, kept out of the
entity files' own field comments so those stay focused on what each
field *is*. Each entity file's own top docstring points back here.

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
`recogniseLemmaPhraseType()` (`role/processor/phrase_processor.ts`) for every
multi-word WordNet synset lemma, derived structurally from the lemma's own
tokens and part of speech, not guessed -- that function's own docstring
documents the real `dict/` distribution this classification was built from.
It's undefined for a Common Vocabulary Cache closed-class Phrase, which has
no constituency-parsing pass of its own, and for the handful of WordNet
parts of speech `recogniseLemmaPhraseType()` itself never maps (dead code against
real WordNet data today -- every real multi-word lemma is
NOUN/VERB/ADJECTIVE/ADVERB).

`data/entities/noun_phrase.ts` and its five siblings (one per `PhraseType`
member) narrow a Phrase down by this field the same way `data/entities/noun.ts`
and its own siblings narrow a Word down by `partOfSpeech`.

### The WordNet-tagged part of speech: `Phrases`'s own side index, not a Phrase field

Phrase originally carried its own `partOfSpeech` field, mirroring Word's --
the WordNet-tagged lexical category `recogniseLemmaPhraseType()` takes as *input*
to derive `phraseType` as *output* (the section above). The two were never
independent facts, so once `phraseType` existed there was no remaining
reason for a Phrase to carry both a structural classification and the raw
tag it was derived from.

The naive fix -- drop the field, let `phraseType` stand in for it wherever
the seeder needed to tell two same-spelled Phrases apart -- doesn't work:
`recogniseLemmaPhraseType()`'s own PHRASE_TYPE_PREPOSITIONS rule sends *both*
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
`recogniseModifierRoles()` (`role/processor/phrase_processor.ts`, that
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
scanning `wordRoles`, since `updatePhraseWordLinks()` already knows the Head's own
index the moment it computes `wordRoles` and sets both in the same pass. It
is named `unresolvedHeadWord`, not `headWord`, because an `Identifier` is a
graph-reference pointer a caller still has to resolve against a Dictionary
(`builder_phrase.ts`'s own `phraseHeadWordSegment()`, in particular) -- never
the resolved Word entity itself.

`headWordForm` is `unresolvedHeadWord`'s own literal spelling as it actually
appears in this Phrase's own `text` -- the token `recogniseModifierRoles()`
identified as the Head, before Dictionary resolution ("at" in "at fault",
never resolved to any Word at all, but `headWordForm` still names which
token filled that role). Distinct from `headWord`'s own resolved
`Word.lexicalForm` on purpose: this is the phrase-local surface form
(matters for a token whose casing or inflection in this exact phrase might
differ from that Word's own canonical spelling elsewhere), not a second copy
of the same fact.

`headWord` is `unresolvedHeadWord` resolved via `Dictionary.findByUuid()` --
genuinely populated, for every real multi-word WordNet Phrase, by
`updatePhraseWordLinks()` right alongside `unresolvedHeadWord` itself. Every
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

Both are genuinely populated, today, by `updatePhraseWordLinks()`, for every
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

`updatePhraseWordLinks()` (role/processor/phrase_processor.ts) now takes an
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

### `isDeterminerPhrase()`: "a bit"/"a few" as NOUN_PHRASE, not their WordNet-tagged function

Reported bug: "a bit" and "a few" weren't recognised as NounPhrases.
`recogniseLemmaPhraseType()` (role/processor/phrase_processor.ts) trusted
WordNet's own synset tag for the *whole* multi-word lemma with only two
structural overrides ahead of it (PREPOSITIONAL_PHRASE, INFINITIVE_PHRASE)
-- neither applied here, so each fell straight through to the POS-based
switch keyed on the idiomatic *function* WordNet tagged it by, not its
actual *structure*. WordNet tags "a bit" ADVERB ("to a small degree"), so
it became ADVERB_PHRASE -- and since neither "a" nor "bit" is
Adverb-capable, `recogniseAdverbHeadIndex` found no Head at all (confirmed
directly: `wordRoles = [DETERMINER, undefined]`, `headWord`/`headWordForm`
both stayed undefined). WordNet tags "a few" ADJECTIVE (`a_few(a)`'s own
satellite synset), so it became ADJECTIVE_PHRASE -- and did resolve a Head
("few" is independently WordNet-tagged ADJECTIVE too), just the wrong
PhraseType. Both are structurally `Determiner + Noun-quantifier` --
literally NOUN_PHRASE's own documented shape, `"(Determiner) +
(Modifiers) + Noun/Pronoun + (Complements)"`.

Fixed with a new `isDeterminerPhrase(tokens, lemma, nounLemmas)`
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
give a different, seeding-order-dependent answer. `recogniseLemmaPhraseType()`
itself gained a fourth `nounLemmas: ReadonlySet<string>` parameter for
this; `synsetMemberToPhrase()` (word_seeder.ts, its own one real call
site) threads it through the same way it already threads `verbLemmas`.

Deliberately scoped to the indefinite article ("a"/"an") alone, not the
full `PHRASE_TYPE_DETERMINERS` set `recogniseModifierRoles()` uses --
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
in the first place, so `isDeterminerPhrase()` already excludes them
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

### `syllableRepresentation`/`recogniseSyllableCount`/`stressPattern`: removed, unlike `frequencyValue`/`frequencyScale`

`WordForm` originally carried five curated-attribute fields side by side:
`syllableRepresentation`/`recogniseSyllableCount`/`stressPattern` and
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
before removing: only `updatePhraseWordLinks()` itself, `phraseWordSegments()`/
`phraseModifierSegments()` in `ui/server/builder_phrase.ts`, and this
codebase's own tests ever touched either field).

`updatePhraseWordLinks()` (role/processor/phrase_processor.ts) still computes an
equivalent `words`/`wordRoles` pair, but as local variables scoped to that
one function call, never written back onto the `Phrase`. `phraseWordSegments()`/
`phraseModifierSegments()` (ui/server/builder_phrase.ts) now recompute the
identical facts fresh at render time instead -- `dictionary.lookup(token)`
per token for the former, a direct `recogniseModifierRoles()` call for the
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
helper `updatePhraseWordLinks()` now shares across `headWordForm`/`preModifiers`/
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

### `Word.registerCodes`/`Phrase.registerCodes` retired: `RegisterCode` renamed to `LanguageStyleCode`, moved onto `Text`

Renamed at the user's explicit direction: `RegisterCode` (`data/enums/register_code.ts`,
a numeric tensor-coded enum, PartOfSpeech's own convention) is retired outright,
replaced by `LanguageStyleCode`/`LanguageStyleCodelist`
(value_objects/data/code/languageStyleCode.ts, value_objects/data/enum/languageStyleCodelist.ts)
-- new files following this exact folder's own established pair-per-code
convention (`DialectCode`/`DialectCodelist`, `ScriptCode`/`ScriptCodelist`, ...).
`LanguageStyleCodelist` is string-valued with its own keys equal to their
values, `PronounciationCategoryCodelist`'s own shape, not `DialectCodelist`/
`LanguageCodelist`/`ScriptCodelist`'s own numeric-plus-external-standard-code
shape -- because, like pronunciation category, there is no external standard
code list for a text's own register/style of use (formal, slang, ...) to
translate through, so `LanguageStyleCode.value` is typed as the Codelist
member directly rather than through an `xCodelistCode()` mapping function,
and `listAgencyId`/`listAgencyName`/etc. stay unset (`PronounciationCategoryCode`'s
own identical "LIRA code list, no UNCL 3055 agency" reasoning).

More than a rename: `registerCodes` moved off both `Word` and `Phrase`
entirely, onto `Text.languageStyleCode` -- a new optional field alongside
`languageCode`/`scriptCode`/`dialectCode`. This follows `dialectCode`'s own
already-established precedent to the letter, not a new principle: a
register/style of use is a fact about one specific wording ("notwithstanding"
reads as formal/literary; a synonym might not), not a fact about the Word or
Phrase as a whole, the identical reasoning `dialectCode`'s own move already
established (this same log, "`words`/`wordRoles`..." section and Phrase's
own `lexicalForm` docstring: "each is a fact about one specific wording, not
about the Phrase as a whole"). Concretely: `Word` carries no `registerCodes`
of its own any more -- a reader resolves it via
`wordForms.baseLemmaFormOf(word)?.text.languageStyleCode`, `dialectCode`'s
own exact read path, both now documented together on `Word.wordFormIds`'s
own docstring. `Phrase.lexicalForm.languageStyleCode` is Phrase's own
equivalent, alongside `lexicalForm`'s own `dialectCode`.

Cardinality changed too, deliberately: `Word.registerCodes`/`Phrase.registerCodes`
were arrays; `Text.languageStyleCode` is singular, matching `languageCode`/
`scriptCode`/`dialectCode`'s own singular shape on `Text` (the user's own
explicit instruction: "It should be an attribute of the Text object").
Verified against every bundled `assets/common/en/*.json` file before making
this call, the same empirical discipline this log's own `gloss` section
used: of 3958 entries carrying any `register_codes` at all, only one --
"notwithstanding" (`['LITERARY', 'FORMAL']`) -- ever carries more than one.
The wire schema (`WordFileEntry.register_codes?: string[]`, `role/asset_loader.ts`)
keeps its own plural array shape unchanged (matching `dialect_codes`' own
identical wire-vs-domain cardinality mismatch, already an accepted pattern
here) -- `role/word_seeder.ts`'s `entryToWord()`/`entryToPhrase()` both take
`entry.register_codes?.[0]` only, `dialectCode`'s own exact `entry.dialect_codes?.[0]`
precedent, so "notwithstanding" keeps only `LITERARY` (the array's first
entry) going forward; `FORMAL` is silently dropped, an accepted, verified-
minimal loss (one real word, one of its two codes) rather than a
speculative one. `role/word_processor.ts`'s new `languageStyleCodeFor(code)`
mirrors `dialectCodeFor()`'s own "asset-sourced, undefined for unrecognised,
don't throw" shape exactly, since register/style is equally curated/optional
data, not a WordSeeder-configured guarantee the way language always is.

`role/auxiliary_seeder.ts`/`role/determiner_seeder.ts` each used to set
`registerCodes: [RegisterCode.NEUTRAL]` once on the whole lemma Word; with
that field gone, each now attaches `languageStyleCode: new LanguageStyleCode(LanguageStyleCodelist.NEUTRAL)`
onto every WordForm's own `text` as it's created instead (`createWordForm()`/
`registerNamedForm()`), preserving the identical fact (every invariant
AUXILIARY/DETERMINER spelling is NEUTRAL register) at the level it now
belongs -- the spelling, not the lemma as a whole.

The wire-facing `register_codes` key stays unchanged everywhere outside the
domain entities themselves: `WordFileEntry.register_codes` (the JSON key),
`WordRecord.register_codes`/`PhraseRecord.register_codes` (the client-facing
DTOs, `ui/server/builder_word.ts`/`builder_phrase.ts`), and the client tab
views that read them (`client_words_tab_view.ts`/`client_phrases_tab_view.ts`)
-- matching `dialect_codes`' own precedent of keeping its wire/API name
stable even after its storage moved onto `Text`. Both DTO builders now
project `Text.languageStyleCode` back into a one-or-zero-element array for
that wire shape (`languageStyleCode !== undefined ? [languageStyleCode.value] : []`),
`dialect_codes`' own exact projection one line above each, in both files.

Verified end-to-end against the real bundled WordNet 3.1 dataset
(Playwright): "notwithstanding" renders with a "Literary" label in the
Words tab (its own Labels column concatenates `register_codes` with
`editorial_labels`, unchanged client-side code) -- confirming the full
`entry.register_codes[0]` -> `languageStyleCodeFor()` -> `Text.languageStyleCode`
-> `WordRecord.register_codes` -> client tag rendering pipeline end-to-end,
with "Archaic" (an editorial label, untouched by this change) rendering
alongside it exactly as before.

### A Pronoun-headed multi-word Phrase is a NounPhrase too, not just a Noun-headed one

Reported bug, confirmed by inspecting the codebase's own already-published
design docs against its own implementation: `data/phrase_type_patterns_and_word_roles.md`'s
own "Phrase Role Allowed Types" table gives NounPhrase's HEAD row as "Noun,
Pronoun" -- and `data/entities/noun_phrase.ts`'s own docstring already said
so too ("Structure: (Determiner) + (Modifiers) + Noun/Pronoun + (Complements)")
-- but the actual code never implemented the Pronoun half of that rule in two
separate places, and a third place never even got the chance to try.

**`role/processor/phrase_processor.ts`'s `recogniseModifierRoles()`** --
NounPhrase's own Head Identification Rule was `recogniseGeneralHeadIndex(possiblePos,
PartOfSpeech.NOUN)`, checking `PartOfSpeech.NOUN` alone. Fixed by giving
`recogniseGeneralHeadIndex()` an optional second target POS
parameter (`alsoTargetPos`), and passing `PartOfSpeech.PRONOUN` for
NounPhrase specifically -- AdjectivePhrase/AdverbPhrase's own call sites are
unaffected, still single-target. In practice this rarely bit a real
WordNet-seeded NounPhrase: verified directly against the bundled dict/
files that no multi-word NOUN-tagged lemma's own last token is ever a
pronoun-only word ("something", "someone", "everybody", ... have no
standalone WordNet NOUN synset of their own at all, confirmed by direct
inspection) -- but it did matter the moment closed-class Phrases started
getting a real `phraseType` (next paragraph), and matters for any future
multi-word entry whose Head can only resolve as PRONOUN.

**`role/word_seeder.ts`'s `entryToPhrase()`** -- the deeper issue: every
closed-class (Common Vocabulary Cache) multi-word Phrase left `phraseType`
permanently `undefined`, regardless of its own `partOfSpeech`, a
long-standing documented "no constituency-parsing pass of its own"
decision repeated across several docstrings this session already touched.
Verified against every bundled `assets/common/en/*.json` file first (the
same discipline every other decision in this log used): the *only*
multi-word closed-class entries that exist at all are pronouns.json's 17
real PRONOUN idioms ("each other", "one another", "no one", "someone
else", "the former", "the latter", "a few", "a little", "a lot", "a bit",
...) and subordinating_conjunctions.json's 19 CONJUNCTION entries (out of
scope -- PhraseType has no CONJUNCTION shape to assign). So this "never
classified" behavior, while general in how it was written, only ever had
one real consequence in the bundled data: every Pronoun-headed idiom
showed no Phrase Type at all. `entryToPhrase()` now calls the identical
`recogniseLemmaPhraseType()` synsetMemberToPhrase() already uses for the
WordNet path, with `verbLemmas`/`nounLemmas` passed as empty `Set`s
(deliberately -- recogniseLemmaPhraseType()'s own structural overrides for "to
"+verb and Determiner-Phrase-shaped ADJECTIVE/ADVERB lemmas only ever fire
for those other parts of speech, so an empty set changes nothing for the
PRONOUN case this call site actually reaches).

**`role/processor/phrase_processor.ts`'s `recogniseLemmaPhraseType()` itself** --
its own switch had no `PartOfSpeech.PRONOUN` case at all, falling through
to `default: return undefined`, with a docstring explicitly framing that as
correct ("dead code against real WordNet data today"). Added `case
PartOfSpeech.PRONOUN:` alongside `case PartOfSpeech.NOUN:`, both mapping to
`PhraseType.NOUN_PHRASE` -- true dead code against WordNet's own ss_type
assignments (confirmed: WordNet never tags a multi-word lemma PRONOUN), but
now genuinely reachable from the Common Vocabulary Cache path above, and
the function's own "total mapping over PartOfSpeech" docstring claim is
accurate again.

`headWord`/`preModifiers`/`postModifiers`/`determiners` still never get a
*stored* value for one of these closed-class Phrases -- `updatePhraseWordLinks()`
is still never called outside `seedWordNet()`, untouched by this fix, so
that half of `Phrase.headWord`'s own documented "undefined... or for a
Common Vocabulary Cache closed-class Phrase" case stays true. But the
Phrases tab's own detail panel doesn't read a stored value for any of
these fields at all -- `phraseWordSegments()`/`phraseModifierSegments()`
(`ui/server/builder_phrase.ts`) recompute `recogniseModifierRoles()` fresh
at render time (this same log's own "`words`/`wordRoles`..." section, on
why) -- so fixing `phraseType` alone was enough to also unlock a correct,
live-computed Determiners row for these phrases in the UI, with no
`updatePhraseWordLinks()` call needed.

Verified end-to-end against the real bundled Common Vocabulary Cache
(Playwright): "each other" and "no one" both now show a "Noun Phrase" tag
in both the Phrases tab's own table and detail panel (previously blank),
and "each other"'s own detail panel additionally now renders a correct,
live-computed "Determiners: #1 each #2 other" row it couldn't show at all
before (`recogniseModifierRoles()` returns every role `undefined` outright
when `phraseType` itself is `undefined` -- the early-return guard at the
top of that function).

### Follow-up: a PRONOUN-headed closed-class Phrase's own `headWord` still wasn't attached

Immediate follow-up bug report on the fix above, confirmed the same way:
the Phrases tab's own detail panel showed "Noun Phrase" and a correct,
live-computed "Determiners" row for "no one" -- but no "Head Word: one"
row at all, even though "one" is a real Word (both NOUN, from WordNet, and
PRONOUN, from pronouns.json) that `recogniseModifierRoles()`'s own
NounPhrase Head Identification Rule (fixed in the section above) can
already resolve.

Root cause: `ui/server/builder_phrase.ts`'s `phraseHeadWordSegment()` --
unlike `phraseModifierSegments()` right next to it, which deliberately
recomputes `recogniseModifierRoles()` fresh at render time -- reads
`phrase.headWord`/`phrase.headWordForm` as *stored* fields directly
(`if (phrase.headWordForm === undefined) return undefined; ...`). Those
two fields are only ever written by `updatePhraseWordLinks()`
(role/processor/phrase_processor.ts), and `updatePhraseWordLinks()` was only
ever called from `seedWordNet()` -- never from `seedClosedClassWords()`'s
own Phrase loop. So even with `phraseType` and the live-recomputed
Modifiers/Determiners rows both correctly fixed, `headWord`/`headWordForm`
themselves stayed permanently unset for every closed-class Phrase,
Pronoun-headed ones included -- a second, independent gap behind the same
user-visible symptom ("pronouns are not being attached to the head"),
not something the first fix could reach on its own.

Fixed by calling `updatePhraseWordLinks(phraseCopy, dictionary, wordForms)`
inside `seedClosedClassWords()`'s own Phrase loop (`role/word_seeder.ts`),
`seedWordNet()`'s own call site's exact counterpart. Safe unconditionally:
`dictionary` already carries every closed-class Word this same seeding
pass inserted moments earlier (the Word loop always runs before the
Phrase loop within one `seedClosedClassWords()` call), and for a Phrase
whose own `phraseType` stays `undefined` (every CONJUNCTION-tagged one,
subordinating_conjunctions.json -- PhraseType has no CONJUNCTION shape)
`recogniseModifierRoles()`'s own early-return guard leaves every field
`updatePhraseWordLinks()` sets at its own harmless empty/undefined default,
identical to today's behaviour for those.

"each other" surfaced a genuinely different, harder case while verifying
this: neither "each" nor "other" is a Noun or Pronoun Word on its own --
both are `DETERMINER_LEMMAS` entries instead (role/determiner_seeder.ts)
-- so its own Head Identification Rule finds no Head token to point at at
all, `headWord`/`headWordForm` correctly stay `undefined` even after this
fix. Confirmed this is `Phrase.headWord`'s own already-documented
"Undefined whenever no token carries the HEAD role at all" case, not a
remaining gap -- both tokens still resolve as Determiners regardless,
since that role assignment (unlike Modifier) is never gated on an
identified Head position (data/entities/phrase.ts's own `determiners` docstring,
updated to say so). `Phrase.headWord`/`preModifiers`/`postModifiers`'s
own docstrings, and `data/entities/noun_phrase.ts`'s, were all updated to
drop their now-inaccurate blanket "undefined for a Common Vocabulary
Cache closed-class Phrase" claims in favour of this precise reasoning.

Verified end-to-end against the real bundled Common Vocabulary Cache
(Playwright): "no one"'s own detail panel now renders "Head Word: one"
(underlined, linking to the real PRONOUN Word), alongside its already-
correct "Determiners: #1 no" row; "each other"'s own panel correctly
still shows no Head Word row at all, with "Determiners: #1 each #2 other"
unaffected either way.

### Second follow-up: "a few" still resolved both "a" and "few" as Determiners

Third bug report on the same thread, same shape of confirmation: "a few"'s
own detail panel showed "Determiner Phrase"-style behaviour -- no Head Word
row, "few" folded in alongside "a" as if both were Determiners -- even
though the two fixes above had already made `phraseType`/`headWord` work
correctly for "no one"/"each other". Three distinct, independently-verified
root causes, not one:

**1. Seeding order.** The follow-up fix above added a
`updatePhraseWordLinks(phraseCopy, dictionary, wordForms)` call inside
`seedClosedClassWords()`'s own Phrase loop -- but that loop runs once, at
Common Vocabulary Cache seeding time, before `seedWordNet()` has added
anything to `dictionary` at all. For "few" specifically this matters more
than for "one" ("no one"'s Head): at closed-class-seeding time, `dictionary.lookup("few")`
resolves to only one homograph -- `role/determiner_seeder.ts`'s own
`DETERMINER_LEMMAS` entry for "few" ("a small number of, used
attributively") -- since pronouns.json's own "few" entry (added in fix #3
below) doesn't exist in the seeded Dictionary until `seedWordNet()` runs
its own closed-class pass moments later in the real seeding pipeline order,
and even then `updatePhraseWordLinks()` was never called again afterward to
pick it up. Confirmed directly: a diagnostic test read `dictionary.lookupAll("few").map(w
=> w.partOfSpeech)` before/after `seedWordNet()` and saw `[DETERMINER]`
then `[DETERMINER, PRONOUN, NOUN, ADJECTIVE]` -- the PRONOUN sense
straightforwardly did not exist yet at the moment "a few"'s own `headWord`
got resolved and permanently stored.

Fixed in `role/word_seeder.ts`'s `seedWordNet()`: its own linking pass
used to loop only `newPhrases` (Phrases created by *this* WordNet-seeding
call). Changed to loop `phraseBook.all()` instead -- re-running
`updatePhraseWordLinks()` against every Phrase already in `phraseBook`,
including every closed-class one `seedClosedClassWords()` seeded earlier,
now that `dictionary` carries WordNet's full homograph set too. The
now-fully-dead `newPhrases` array (and its one push site) was removed
outright rather than left as an unused intermediate.

**2. Wrong-homograph resolution -- the deeper, structural bug.** Fixing
(1) alone was not enough: even re-run after WordNet loads, "a few"'s own
`headWord` still resolved to the *Determiner* "few", not the Pronoun one.
`recogniseModifierRoles()` already had the discipline to check every
possible part of speech per token rather than one arbitrary pick (its own
docstring's "give" example, and this log's own first section above) -- but
`updatePhraseWordLinks()`'s *own* `words[]` construction never inherited that
discipline. It resolved every token, Head included, via plain
`dictionary.lookup(token)` -- first-seeded-homograph-wins, completely
disconnected from which homograph `recogniseModifierRoles()` had actually
matched the Head position against. For "few" specifically, the Determiner
homograph happens to be seeded first (closed-class pass runs before
WordNet), so it silently won every time, regardless of role.

This is a general architectural bug, not a "few"-specific one -- confirmed
by two independent real-data cases already living (and passing) in
`vocabulary.test.ts` before this fix, each of which had documented the
wrong resolution as if it were correct, intended behaviour: "give up"'s
own Head ("give") resolved to its own rare NOUN sense ("there's a lot of
give in the rope") instead of the VERB sense actually being headed;
"look up to"'s own Head ("look") resolved to its own NOUN sense ("a look
of surprise") instead of VERB; "to be sure"'s own Head ("be") resolved to
the chemical-element NOUN "Be" instead of the VERB "be"; "long ago"'s own
Head ("ago") resolved to an ADJECTIVE sense instead of the ADVERB one an
AdverbPhrase structurally requires. All four were silently wrong in
exactly the same way "a few" was, just never reported because nothing in
the UI made the mismatch as visually obvious as a Determiner-tagged
Pronoun does.

Fixed by adding two new functions to `role/processor/phrase_processor.ts`:

- `identifyHeadTargetPartsOfSpeech(phraseType)` -- returns the `ReadonlySet<PartOfSpeech>`
  a given PhraseType's own Head Identification Rule targets (NounPhrase:
  Noun/Pronoun; AdjectivePhrase: Adjective; AdverbPhrase: Adverb;
  VerbPhrase/InfinitivePhrase: Verb; PrepositionalPhrase: Preposition) --
  extracted from `recogniseModifierRoles()`'s own switch (which already
  computed this per-branch inline) so both that switch and the new
  resolution step below share one definition and can never drift apart.
- `recogniseMatchingTokenHomograph(token, targetPos, dictionary)` -- searches every
  homograph `dictionary.lookupAll(token)` returns for one whose own
  `partOfSpeech` is in `targetPos`, falling back to the old
  `dictionary.lookup(token)` first-seeded pick only when no homograph
  matches (the correct behaviour for every non-Head position, and for a
  Head with no matching homograph at all -- unchanged from before).

`updatePhraseWordLinks()` now computes `wordRoles`/`headIndex` first, then
resolves only the Head token through `recogniseMatchingTokenHomograph()` (using
`identifyHeadTargetPartsOfSpeech(phrase.phraseType)`); every other position keeps
resolving via plain `dictionary.lookup()`, matching this codebase's
existing, otherwise-accepted arbitrary-but-deterministic convention for
non-Head positions (`recogniseDefinitionWords()`, `word_processor.ts`).

The two pre-existing tests documenting "give up"/"look up to"'s NOUN
mis-resolution and "to be sure"/"long ago"'s wrong-homograph resolution as
correct were rewritten to assert the new, actually-correct VERB/ADVERB
resolutions instead, with comments explaining why the change is a fix, not
a regression.

**3. "few" itself needed its own PRONOUN sense.** Fixing (1) and (2) still
left one gap specific to "few": once `recogniseMatchingTokenHomograph()` correctly prefers
a PRONOUN- or NOUN-tagged homograph for a NounPhrase Head, it can only find
one if one actually exists. WordNet's own real NOUN sense for "few" is "a
small elite group" ("it was designed for the discriminating few") --
semantically unrelated to the quantifier-pronoun meaning "a few" itself
needs, and confirmed by direct inspection of `dict/data.noun` to be the
*only* NOUN sense WordNet has for "few" at all. Added a new standalone
PRONOUN entry for "few" to `assets/common/en/pronouns.json` (mirroring the
existing "fewer" entry's own shape exactly): `"definition": "A small
number of, used pronominally"`, bumping `pronouns.json`'s own `count`
(100 -> 101) and `manifest.json`'s `total_lexical_forms` (332 -> 333) /
its own `pronouns.json` file-count entry / `asset_version` (1.28.0 ->
1.29.0) to match, with a new `## Version` changelog entry in
`assets/common/en/README.md` documenting the addition and its exact
rationale.

While verifying, checked (but deliberately left unfixed, as out of this
report's own scope) two further words sharing "few"'s exact structure --
a `DETERMINER_LEMMAS` entry shadowing an unrelated WordNet NOUN/ADJECTIVE
sense of the same spelling: "lot" (WordNet NOUN sense = "a parcel of land
having fixed boundaries") and "bit" (WordNet NOUN senses = drill bit/
horse bit/key parts) -- both still silently resolve their own
Determiner-Phrase Head to the wrong homograph today, same as "few" did.
"little" shares the same structure but is *not* broken -- its own WordNet
NOUN sense ("a small amount or duration") already matches the meaning
needed, confirmed directly against `dict/data.noun`. "each"/"other" have
no Noun/Pronoun-capable Word at all, a separate, pre-existing, intentional
gap documented in the section above, not a new one this fix touches.

Verified end-to-end against the real bundled Common Vocabulary Cache plus
WordNet (Playwright): "a few"'s own detail panel now renders "Head Word:
few" (tagged Pronoun, underlined, linking to the new standalone PRONOUN
Word), alongside its own correct "Determiners: #1 a" row -- "few" no
longer appears in the Determiners list at all, only "a" does.

## Coordination

### `coordinates`/`coordinator`: a flat n-ary array replaces the binary `left`/`conjunction`/`right` shape

`data/entities/coordination.ts` and its 12 specialisations (`WordCoordination`,
`NounCoordination`, `VerbCoordination`, `AdjectiveCoordination`,
`AdverbCoordination`, `PhraseCoordination`, `NounPhraseCoordination`,
`VerbPhraseCoordination`, `AdjectivePhraseCoordination`,
`AdverbPhraseCoordination`, `PrepositionalPhraseCoordination`,
`ClauseCoordination`) were added as pure type scaffolding, no consumers
wired up (commit `2e1f979`) -- `left: T | Coordination<T>`, `right: T |
Coordination<T>`, and a required, embedded `conjunction: Conjunction`.
Three or more coordinates nested ("A and B and C" ->
`Coordination(A, and, Coordination(B, and, C))`), which only works when
every join genuinely repeats the conjunction word. It can't represent
the far more common English list shape, where only the last join gets a
conjunction and every earlier one is just a comma ("red, white, and
blue") -- there's no real `Conjunction` Word standing in for the comma
between "red" and "white", and `conjunction` was required on every
`Coordination`, inner ones included. Filed as
[ggilluk/LIRA#3](https://github.com/ggilluk/LIRA/issues/3) at the time,
with three candidate directions, none chosen yet.

Fixed by taking that issue's own third suggested direction (flatten the
shape rather than force it through nesting), refined further: `left`/
`right` became a single `coordinates: readonly (T | Coordination<T>)[]`
-- two or more elements in order, so "red, white, and blue" is one
three-element array on one `Coordination`, not a nested tree at all.
Layered coordination ("A and B and C" read as two real, separate
conjunctions) remains representable too -- a `coordinates` entry can
still itself be a nested `Coordination<T>`, unchanged from what `left`/
`right` already allowed. The "at least two" invariant isn't enforced at
the type level -- no runtime or TypeScript validation mechanism exists
for this anywhere in this codebase yet, the same "documented ahead of
enforcement" status `data/entities/noun_phrase.ts`'s own ModifierRole
note already carries.

`conjunction: Conjunction` (an embedded Word copy) became `coordinator?:
Identifier` (an optional graph-reference pointer to a WordForm,
resolved against a `WordForms` store) -- `Phrase.headWord`'s own
by-reference pattern (`data/entities/phrase.ts`), not a copy. Optional
because the fix above already covers the case that motivated it: an
asyndetic list join ("red, white, blue" with no "and" at all, or the
non-final joins of "red, white, and blue") now has an honest
representation with `coordinator` simply left `undefined`, rather than
needing a fake value or a second discriminant field (the issue's own
first two suggested directions, not taken).

`Coordination<T>` also gained a `T extends LinguisticUnit` constraint --
every real instantiation (`Adjective`, `Verb`, `Noun`, `Adverb`, `Word`
via Word; `NounPhrase`, `AdjectivePhrase`, `AdverbPhrase`, `VerbPhrase`,
`PrepositionalPhrase`, `Phrase` via Phrase; `Clause` directly) already
satisfied it structurally, so this changes no call site, only makes
explicit what was already true: every coordinate is some kind of
Linguistic Unit, `Coordinates: LinguisticUnit [2..*]`'s own general
shape, narrowed per specialisation the same way `left`/`right` already
were.

Still no seeder wired up at this point -- the shape changed, but the
type family stayed pure scaffolding, the same status the original
addition had (`Coordinations`/`coordination_processor.ts` follow in the
section below). Closes
[ggilluk/LIRA#3](https://github.com/ggilluk/LIRA/issues/3).

### `Conjunction.conjunctionType`: coordinating vs. subordinating, now on the Word itself

A `Coordination`'s own `coordinator` (above) is only ever meaningful
when it names a *coordinating* Conjunction ("and"/"or"/"but") -- never a
*subordinating* one ("although"/"because"), which introduces a
dependent clause rather than joining equal constituents (Huddleston,
Pullum & Reynolds, Chapter 15). The Common Vocabulary Cache already
keeps the two apart at the file level
(`coordinating_conjunctions.json`/`subordinating_conjunctions.json`,
each entry's own `closed_class_kind`), but `Conjunction`
(`data/entities/conjunction.ts`) carried no field of its own recording
which one a given seeded Word came from -- the distinction existed only
implicitly, in which file happened to seed it.

Added `ConjunctionType` (`data/enums/conjunction_type.ts`,
`COORDINATING = 0`/`SUBORDINATING = 1`, the same numeric-code convention
as `PartOfSpeech`/`PhraseType`/`ModifierRole`) and a new required
`conjunctionType: ConjunctionType` field on `Conjunction`. Wired at seed
time: `WordFileEntry` (`role/asset_loader.ts`) gained a
`closed_class_kind?: string` field -- the per-entry copy of this fact
already present in the bundled JSON (verified against both files: every
entry in each carries its own matching `closed_class_kind`, redundant
with but identical to the file-level one) was simply never part of the
parsed schema before now. `word_seeder.ts`'s new
`conjunctionTypeFor(entry)` maps `"coordinating_conjunction"` ->
`COORDINATING`, `"subordinating_conjunction"` -> `SUBORDINATING`,
throwing on anything else (defensive -- every real bundled CONJUNCTION
entry has one of the two, confirmed directly). `entryToWord()`'s own
`PartOfSpeech.CONJUNCTION` branch passes it into `createConjunction()`
explicitly, rather than through the shared `fields` object every other
branch reads from -- no other POS has a use for it, so it stays a
CONJUNCTION-only override at that one call site, the same shape
`ConjunctionInit` (`role/processor/conjunction_processor.ts`) now
requires (`Pick<Conjunction, "text" | "conjunctionType">`, not merely
`Partial`, so a future call site that forgets it fails to compile
rather than silently seeding an unset value).

Multi-word CONJUNCTION entries (`subordinating_conjunctions.json`'s own
19, e.g. "in order that") seed as Phrases via `entryToPhrase()`, not
`entryToWord()` -- `conjunctionTypeFor()` never runs against them,
unaffected: Phrase carries no `Conjunction` subtype of its own for a
`conjunctionType` to live on.

Verified against real seeded data: "and"/"but"/"or"
(`coordinating_conjunctions.json`) seed with `conjunctionType:
COORDINATING`; "although"/"because" (`subordinating_conjunctions.json`)
seed with `SUBORDINATING`.

### `Coordinations`/`coordination_processor.ts`: a real store and processor, still no seeder

`Coordination<T>` had a base-entity shape (`entryId`, `coordinates`,
`coordinator`) but no store to hold instances of it and no processor to
construct/copy them -- every other entity in `data/entities/` has both
(`Senses`/`role/sense_processor.ts`, `WordForms`/`role/word_form_processor.ts`,
`Phrases`/(`createPhrase` on `Phrase` itself), `Dictionary`/`role/word_processor.ts`),
Coordination didn't.

Added `role/coordination_processor.ts` (`createCoordination`,
`createFreshUuidCoordinationCopy`, `graphUuid`) -- `sense_processor.ts`'s
own exact shape and placement rationale (a top-level `role/` file, not
`role/processor/`, since Coordination isn't a Word POS subtype either).
`CoordinationInit<T>` requires `coordinates` (`Pick`), leaves
`coordinator`/`entryId` optional (`Partial<Omit<...>>`) -- `PhraseInit`'s
own identical split between what a caller must supply and what gets a
sensible default (`entryId` auto-assigned via `identifier(newUuid())`,
the fold every other entity's own constructor already performs).
`createCoordination()` does not enforce the "two or more" invariant
`Coordination.coordinates`'s own docstring documents -- consistent with
that docstring's own explicit "not enforced at the type level" claim,
which stays true rather than becoming stale the moment a real
constructor exists.

Added `data/coordinations.ts`'s `Coordinations<T extends LinguisticUnit>`
-- `Senses`'s own shape (`all`/`findByUuid`/`append`/`totalEntries`/
`seedFrom`), deliberately smaller: no text/lemma index (a Coordination
carries no `text` of its own -- only its own `coordinates` do), no
synsetId/partOfSpeech side index (no WordNet concept applies to a
Coordination the way it does a seeded Word/Phrase sense). Holds every
specialisation (`WordCoordination`, `NounCoordination`, ...) mixed
together under one shared `Coordination<LinguisticUnit>`, Dictionary's
own "store broadly, narrow on read" choice for Word's POS subtypes --
structurally sound since `coordinates`/`coordinator`/`entryId` are all
either `readonly` or themselves covariant, so a `Coordination<Noun>`
(say) is assignable to `Coordination<LinguisticUnit>` with no cast
needed. No `isXCoordination()` guard family exists yet to narrow back
down on read -- not needed by anything today, the same reason
Coordination itself still has no seeder or UI consumer.

Wired `coordinations = new Coordinations<LinguisticUnit>()` onto
`VocabularyContext`, one per Domain alongside `dictionary`/`phrases`/
`senses`/`wordForms` -- `wordForms`'s own precedent
(`data/entities/word_form.ts`'s docstring: added to every Domain well
before every POS wrote to it) for giving an entity a real per-Domain
home ahead of the seeder that will eventually populate it, rather than
only adding the field once that seeder exists. Deliberately NOT copied
into the Physics domain snapshot inside `vocabulary_worker.ts`
(`physicsDomain.vocabulary.dictionary.seedFrom(...)`/`.phrases.seedFrom(...)`)
-- that snapshot already leaves `senses`/`wordForms` uncopied too, so
`coordinations` simply joins the stores that snapshot has never
covered, not a new omission of its own.

At this point no seeder yet populates a real `Coordinations` store with
a real seeded `Coordination` -- detecting coordinate structure in real
Common Vocabulary Cache or WordNet data (or real Linguistics Layer
text) is a separate, much larger undertaking than giving the type
family a store and processor, and was out of scope here (a small,
closed-set seeder follows in the section below). Verified via direct
construction instead (`vocabulary.test.ts`'s own new
`describe("Coordinations", ...)` block): `createCoordination()`/
`createFreshUuidCoordinationCopy()`/`graphUuid()` against a synthetic
`Coordination<Adjective>`, the `Coordinations` store's own CRUD/seedFrom
round-trip, and one test tying `coordinator`/`ConjunctionType` together
end-to-end -- "red, white, and blue" as a single three-element
`coordinates` array (`red`/`white`/`blue`, three real `Adjective`
Words) with `coordinator` resolving, via a real `WordForms` store, to
"and"'s own base-lemma `WordForm`, whose owning Word is a Conjunction
with `conjunctionType: ConjunctionType.COORDINATING` -- exactly the
shape `Coordination.coordinator`'s own docstring describes.

### `WordCoordinationSeeder`: a small, closed-set seeder, the first real Coordination producer

`Coordinations`/`coordination_processor.ts` (above) gave the type
family a real store and processor, but still no seeder -- every real
`Coordination` in this codebase existed only inside a test. Detecting
coordinate structure in arbitrary real text (or inferring it from
WordNet, which encodes no coordination facts of its own at all) is a
genuinely large, separate undertaking; what's added here instead is
much narrower: a small, closed, hand-curated set of fixed, idiomatic
coordinate expressions that are themselves a real, if minor, part of
English's own closed-class inventory -- "salt and pepper", "trial and
error", "cause and effect", "law and order", "bread and butter" (`NOUN`),
"back and forth", "here and there", "now and then" (`ADVERB`) -- the
same "closed set, hand-curated, real linguistic fact" spirit
`coordinating_conjunctions.json`/`DETERMINER_LEMMAS`/every other
closed-class source already has, just for coordinate pairs instead of
single lemmas.

Source data: `assets/common/en/word_coordinations.json`, one entry per
expression naming its own `coordinates` (two or more lexical forms) and
`coordinator` (a coordinating conjunction's own lexical form, "and" for
every entry today) -- `assets/common/en/README.md`'s own new "Word
coordinations" section has the full schema and rationale, including why
this file carries no `WordFileEntry`-shaped schema and sits outside
`validateAssets()`'s own count/manifest checks entirely
(`preposition_verb_noun_senses.json`'s own identical status, read via
`readWordDirJson()` rather than the strict `readWordFile()`/
`WordFileDocument` path, `role/word_coordination_seeder.ts`'s own
docstring on why).

Every `coordinates` word here is open-class (`NOUN`/`ADVERB`), which
only exists in a Domain's own Dictionary once `WordSeeder.seedWordNet()`
has actually run -- unlike `PrepositionSenseSeeder`'s own targets, every
hand-curated `PREPOSITION` already existing before WordNet ever loads.
`WordCoordinationSeeder` is meant to run only after `seedWordNet()`
completes, `PrepositionSenseSeeder`'s own identical timing
(`role/web_worker/vocabulary_worker.ts`'s own `handleSeedWordNet()`
calls both, back to back); called any earlier, every `coordinates` word
fails to resolve and the whole entry is skipped, the same "skipped, not
an error" outcome `skipUnresolvable` already gives an ordinary
unresolvable relationship spec.

Resolution deliberately does NOT reuse `phrase_processor.ts`'s own
`recogniseMatchingTokenHomograph()` -- that function always returns *some* Word (a Head
position always has a real token to resolve, best-effort, falling back
to the first-seeded homograph when no exact match exists). A
coordinate here needs the opposite contract: `wordWithPartOfSpeech()`
(`role/word_coordination_seeder.ts`) returns `undefined`, skipping the
whole entry, rather than ever silently coordinating the wrong
homograph -- this session's own "a few" fix (this log's own "Second
follow-up" section above) is exactly the failure mode a silent fallback
here would risk repeating, just for a Coordination's own `coordinates`
instead of a Phrase's own `headWord`. `coordinator` resolution is
similarly strict: `dictionary.lookupAll(text)`, filtered to Conjunction
homographs, further filtered to `conjunctionType: COORDINATING` --
`Coordination.coordinator`'s own docstring requirement, checked here
rather than assumed.

Idempotent across repeated calls (an existing `entryId.value`, read
back from the Domain's own `Coordinations.all()`, is never seeded
twice) -- `PrepositionSenseSeeder`'s own identical guard shape.
`entryId` itself is built via `identifier(entry.entry_id)` (not the
`{ value: entry.entry_id }` object literal `entryToWord()`/
`entryToPhrase()` use) -- those two deliberately leave `entryId.uuid`
unset, fixed up later by `createFreshUuidWordCopy()`/
`copyPhraseWithFreshUuid()` once `seedClosedClassWords()`'s own per-
Domain loop has a real `copy` to mint a fresh uuid for (word_seeder.ts's
own cached, domain-agnostic prototype pattern) -- `WordCoordinationSeeder`
has no such two-phase cache, it constructs one real per-Domain
`Coordination` directly, so `identifier()`'s own default behaviour (a
real `uuid` alongside the given `value`, in one call) is what's needed
here instead.

Verified against real seeded data (`vocabulary.test.ts`): a no-op
before `seedWordNet()` runs, exactly 8 `WordCoordination`s (one per
`word_coordinations.json` entry) after, "salt and pepper" resolving to
two real `NOUN` Words plus a `coordinator` naming "and"'s own real
base-lemma `WordForm`, "back and forth" resolving the identical shape
with `ADVERB` instead, and a second `seed()` call against the same
Domain creating nothing new.

### A Coordinations tab, between Phrases and Senses

`WordCoordinationSeeder` gave a Domain real, seeded `WordCoordination`s
-- still invisible in the UI, though: the Words/Phrases/Senses/
Relationships/Hierarchy/Cyclic tab row had nothing that read them.
Added a new "Coordinations" tab, positioned between Phrases and Senses
(the user's own requested placement) -- both, like Coordination, aren't
Word-headed the way Words itself is.

`ui/server/builder_coordination.ts`'s new `CoordinationRecord`/
`coordinationRecordFor()`/`coordinationRecords()` are `builder_phrase.ts`'s
own `PhraseRecord`/`phraseRecordFor()`/`phraseRecords()` counterpart,
deliberately leaner: a Coordination carries no relationships, sense, or
definition of its own to build a detail panel around (it only
references Words some other seeding pass already created), so the new
tab is a plain searchable list with no `aside` detail panel at all --
`panel-rels`'s own simpler shape, not `panel-phrases`/`panel-senses`'s.
`coordinatorTextFor()` resolves `Coordination.coordinator` (a WordForm
reference) all the way back to the real Conjunction Word that owns it
-- WordForm carries no back-reference of its own for this
(`word_coordination_seeder.ts`'s own identical resolution at seed time,
reused here for display rather than re-derived by hand). No capacity
gate the way `phraseRecords()`/`senseRecords()` need -- Coordination is
seeded from a small, closed, hand-curated set today, nowhere near
WordNet scale, so `coordinationRecords()` always embeds the full list
directly; `DictionaryView.render()`'s own `COORDINATIONS_JSON`
substitution has no `overCapacity`-gated `[]` branch to match.

Client-side (`ui/client/client_coordinations_tab_view.ts`, new) mirrors
that same simplicity -- no over-capacity search dispatch/debounce
(`client_phrases_tab_view.ts`'s own `renderPhrasesOverCapacity()` has
nothing here to parallel), just a plain client-side filter against
`state.search.word`/`state.pos`, the shared state every other tab
already reads. `coordinatesText()` renders "salt and pepper" (two
coordinates) or "red, white, and blue" (three or more, Oxford-comma
style) from the flat `coordinates` array -- `Coordination.coordinates`'s
own docstring on why a flat array reads this way directly, with no
binary-tree reconstruction needed to get there.

Wired into every layer `Phrases`/`Senses`/`WordForms` already reach:
`DictionaryViewOptions.coordinations` (new, optional, empty-store
default -- `phrases`'s own identical convention), `client_shell_html.ts`'s
tab button + panel markup (between `tab-phrases`/`panel-phrases` and
`tab-senses`/`panel-senses`), `client_render_helper_html.ts`'s
`COORDINATIONS` data binding, `client_bootstrap_controller.ts`'s
`selectTab()`/`renderAll()`/click-listener/`pos-filter`-change wiring,
and all seven of `vocabulary_worker.ts`'s own `new DictionaryView(...)`
call sites (`domain.vocabulary.coordinations` alongside the
`phrases`/`senses`/`wordForms` those already pass) -- every one gets it
for consistency, even the five that never call `.render()`/
`.renderFragment()` at all (`searchPhrases`/`searchSenses`/
`searchRelationships`/`searchLexicalRelationships`/`resolveHierarchy`'s
own handlers), the same "pass every store, whether or not this one
endpoint needs it" convention `phrases`/`senses`/`wordForms` already
follow there.

Verified against real seeded data (Playwright, the real app): the
Coordinations tab renders between Phrases and Senses exactly as
positioned, showing all 8 real seeded coordinations ("back and forth"
tagged Adverb, "salt and pepper" tagged Noun, ...) with their own real
coordinator ("and"), no console errors.

### Follow-up: every Conjunction Word/Phrase moved into the Coordinations tab too, with its own Conjunction Type

Bug report on the fix above: "as long as" (a multi-word `CONJUNCTION`
`Phrase`, `subordinating_conjunctions.json`) was appearing in the
Phrases tab, not the Coordinations tab -- read literally, not a bug at
all: "as long as" doesn't coordinate anything ("and"/"or"/"but" join
two-or-more equal constituents; "as long as" introduces a subordinate
clause instead, `ConjunctionType`'s own docstring), so it was never a
`WordCoordination` to begin with, and every multi-word lexical entry
lives in Phrases regardless of its own part of speech. Clarified with
the user what they actually wanted: the Coordinations tab broadened
into this Domain's own single, merged home for every Conjunction --
real coordinate pairs, standalone Conjunction Words ("and", "although"),
and multi-word Conjunction Phrases ("as long as", "in order that")
alike -- each carrying its own Conjunction Type (Coordinating/
Subordinating), not just a real coordinate pair's own `coordinator`.

`builder_coordination.ts`'s `CoordinationRecord` gained a `conjunction_type`
field, and `coordinationRecords()` now unions three sources into one
sorted list: real `Coordination`s (`coordinationRecordFor()`, largely
unchanged, now also resolving its own coordinator's `conjunctionType`),
every `dictionary.all()` Word that `isConjunction()` (`conjunctionWordRecord()`,
new), and every `phrases.all()` Phrase whose own `partOfSpeechOf() ===
CONJUNCTION` (`conjunctionPhraseRecord()`, new). `pos` is what tells a
real coordinate-pair row apart from a Conjunction-itself row on the
same list, no separate discriminant field needed: `NOUN`/`ADVERB`/...
names a coordinate pair (`coordinator` is that pair's own joining
conjunction); `CONJUNCTION` names a row that IS a Conjunction, single-
or multi-word (`coordinator` stays undefined -- there's no separate
joining word, the row already is one).

`conjunctionPhraseRecord()`'s own Conjunction Type is hardcoded
`SUBORDINATING`, not read off a stored field -- Phrase carries no
`conjunctionType` of its own (only `Conjunction`, a Word subtype,
does; `Phrase`'s own `phraseType` has no `CONJUNCTION` shape to assign
either, `entryToPhrase()`'s own docstring). Verified this is a real,
checked structural fact rather than a guess: `coordinating_conjunctions.json`
has zero multi-word entries of its own (`assets/common/en/README.md`'s
own Word coordinations section), so every multi-word `CONJUNCTION`
`Phrase` that exists today, by construction, comes from
`subordinating_conjunctions.json` alone -- flagged in the function's
own docstring as something a future multi-word *coordinating*
conjunction would need taught a real source for, rather than staying
hardcoded.

Client-side (`client_coordinations_tab_view.ts`), `coordinatesText()`
now branches on `pos === "CONJUNCTION"`: a Conjunction-itself row
rejoins its own token(s) with plain spaces ("as" + "long" + "as" ->
"as long as", the same text `updatePhraseWordLinks()` itself split it from),
while a real coordinate pair still gets the "and"/Oxford-comma join
`coordinatesText()` already had. Added a "Conjunction type" column
(`conjunctionTypePill()`, new -- Coordinating/Subordinating, its own
fixed two-colour palette) to the Coordinations tab's own table, both
in `client_shell_html.ts`'s header and `coordinationRowHtml()`'s own
per-row cell.

Verified against real seeded data (`vocabulary.test.ts`): 51 total
rows (8 real coordinate pairs + 7 coordinating + 17 subordinating
single-word Conjunctions + 19 subordinating multi-word Conjunction
Phrases), "and" appearing as its own `CONJUNCTION`-tagged row
(`COORDINATING`, no `coordinator`) distinct from "salt and pepper"'s
own `NOUN`-tagged row (`coordinator: "and"`), "although" tagged
`SUBORDINATING`, and "as long as" appearing as `["as", "long", "as"]`
tagged `CONJUNCTION`/`SUBORDINATING` with no `coordinator` -- the
reported bug's own exact example, now resolving correctly.

### A real three-coordinate example: "red, white, and blue"

Every bundled `word_coordinations.json` entry until now had exactly
two `coordinates` -- the flat-array shape (this log's own "`coordinates`/
`coordinator`..." section above, closing
[ggilluk/LIRA#3](https://github.com/ggilluk/LIRA/issues/3)) always
supported two or more, and every layer built on top of it
(`WordCoordinationSeeder`'s own resolution loop, `coordinationRecordFor()`,
`coordinatesText()`'s own Oxford-comma branch client-side) was already
written generically, never assuming exactly two -- but nothing in the
bundled data had ever actually exercised three, so that support was
still only theoretical.

Added a ninth entry to `word_coordinations.json`: `coordinates: ["red",
"white", "blue"]`, `part_of_speech: "ADJECTIVE"`, `coordinator: "and"`
-- verified directly against the bundled WordNet `dict/data.adj` that
all three are real ADJECTIVE senses first, the same discipline every
other entry's own words were checked against. No code changed anywhere
in the seeder, record builder, or client script -- the whole pipeline
already handled this shape correctly by construction; this only adds
the first real bundled data that proves it, end to end rather than
only in a synthetic unit test.

Verified against real seeded data (`vocabulary.test.ts`, both the
seeder's own test and `coordinationRecords()`'s own): "red, white,
and blue" seeds with all three `ADJECTIVE` coordinates in order and a
real `coordinator` resolving to "and", and renders (Playwright, the
real app) as "red, white, and blue" -- `coordinatesText()`'s own
Oxford-comma branch, confirmed live rather than only unit-tested.

## Test infrastructure

### `seededVocabularyFixture()`: one shared WordNet-scale domain instead of 23 independent ones

`vocabulary.test.ts` called `WordSeeder.seedWordNet()` 23 separate
times, each building a brand-new Dictionary/Phrases/Senses/WordForms/
relationship-store domain from scratch -- ~92,000 Words and ~175,000
relationships, every single call, with no sharing between them.
`wordnet_loader.ts`'s own module-level cache (`loadWordNetSynsets()`,
`lexnamesCache`, `senseFrequencyCache`) only memoizes the raw `dict/`
file *text parsing*; the downstream object construction into fresh
stores -- the dominant cost, 10-30+ seconds per call -- was redone in
full on every one of those 23 sites, serialized (no `test.concurrent`
anywhere in the file, and the suite already runs under
`--no-file-parallelism`). This was the whole suite's own dominant
runtime cost by a wide margin.

Most of those 23 calls, though, only ever *read* the fully-seeded
domain afterward -- no test-local seeding transition of its own to
observe. Added `seededVocabularyFixture()`, a module-level, lazily-
memoized async function: the first call builds one fresh domain (plain
`new WordSeeder("en").seedWordNet({ vocabulary: {...fresh stores...} })`,
no closed-class seeding, no `NounCharacterFormSeeder`/
`PrepositionSenseSeeder`/`WordCoordinationSeeder` -- deliberately the
same bare shape those 16 tests already built individually, so switching
a test onto the fixture changes nothing observable), caches the
resulting `Promise`, and every later call returns the identical
already-seeded stores. 16 tests across 8 `describe` blocks (word-form
generation, the WordNet seeding suite itself, phrase/relationship
classification, `DictionaryView.searchWords`/`searchPhrases`/
`searchSenses`/`searchRelationships`/`resolveHierarchy`) now destructure
`await seededVocabularyFixture()` instead of rebuilding their own domain.

7 tests deliberately keep their own independent domain, because each
one's own assertions require observing a *transition* the shared
fixture's single build can't reproduce: `NounCharacterFormSeeder`'s
own before/after (updates vs. creates), the closed-class Phrase
headWord re-link (needs closed-class-seeded-before-WordNet ordering),
the big "seeds every synset member... stays idempotent" test (asserts
on the *first* real call's own stats, then calls `seedWordNet()` a
second time on the same domain to check idempotency), `PrepositionSenseSeeder`'s
and `WordCoordinationSeeder`'s own before/after-WordNet no-op checks,
and `coordinationRecords()`'s own test (needs closed-class seeding +
all three post-WordNet seeders together, a combination no other test
shares, so consolidating it would save nothing). Real `seedWordNet()`-
family call sites: 23 -> 8 (1 shared fixture build + 7 independent).

Measured effect (`npx vitest run --no-file-parallelism`, this
environment, 4 CPUs): full suite (166 tests, 5 files) dropped from the
previously observed 250-440s range to a consistent ~135s, still
166/166 passing. `npx tsc -b --force` stays clean -- a test-only
change, so the built `dist-pages` app output is unaffected and this
change was not built/deployed.

## Coordination (continued)

### `correlative`: an optional second by-reference marker, alongside `coordinator`

Added `Coordination.correlative?: Identifier` -- the same by-reference-
to-a-WordForm shape `coordinator` already has (resolved via
`WordForms.findByUuid()`, never an embedded copy), naming the first
half of a correlative pair marking the coordination itself: "either" in
"either A or B", "both" in "both A and B", "neither" in "neither A nor
B". `coordinator` still names the second half ("or"/"and"/"nor") --
`correlative` is additive, not a replacement.

Purely additive to the entity: `createCoordination()`/
`createFreshUuidCoordinationCopy()` (`role/coordination_processor.ts`)
both already build/copy a `Coordination` generically (`Partial<Omit<...>>`
spread and a full object spread, respectively), so neither needed a
change to carry the new optional field. No seeder populates it yet --
`word_coordinations.json`'s own schema has no `correlative` key today,
so every existing and future entry seeds `correlative: undefined` until
a producer is written for it, the same "documented ahead of a real
producer" state `coordinator` itself started in before
`WordCoordinationSeeder` existed.

## `Phrase.complements`: real constituency parsing for the one gap `updatePhraseWordLinks()` always had

### The reported bug: "abatement of a nuisance" silently dropped its own "of a nuisance"

"abatement of a nuisance" (00362285-n, dict/data.noun, synonymous with
"nuisance_abatement") seeds as a real NounPhrase, head "abatement" --
but its own trailing "of a nuisance" span went nowhere at all.
`recogniseModifierRoles()`'s own NounPhrase branch only ever assigns
MODIFIER *before* the Head; nothing assigns any role to a token after
it. `ModifierRole.COMPLEMENT` existed in the enum and NounPhrase's own
COMPLEMENT allowed-types row already named `PrepositionalPhrase`/`Clause`
as valid fillers (`PHRASE_TYPE_DETAILS[PhraseType.NOUN_PHRASE].allowedTypes`,
data/enums/phrase_type.ts) -- but nothing in the codebase ever assigned
that role or built such a Phrase (`data/enums/modifier_role.ts`'s own
former docstring said so outright). `updatePhraseWordLinks()`'s own former
docstring was equally explicit: "nothing in this codebase performs
constituency parsing within a phrase's own text ... a MODIFIER token
that resolves to a Phrase/Clause span rather than a single Word is left
out of every array rather than guessed at." This was a real, working-
as-designed gap, not a regression -- but a gap all the same, and the
reported case is exactly the shape it silently swallowed.

### `data/prepositional_phrase.ts` moved into `data/entities/`

Housekeeping ahead of the real fix, matching every sibling
`*_phrase.ts` subtype's own already-completed move (this log's own
opening note): `git mv data/prepositional_phrase.ts
data/entities/prepositional_phrase.ts`, its own internal relative
imports fixed for the new depth, and its 4 external importers
(`data/entities/prepositional_phrase_coordination.ts`,
`data/entities/noun_phrase.ts`, `role/word_seeder.ts`,
`vocabulary.test.ts`) updated to the new path. `data/infinitive_phrase.ts`
is now the only `*_phrase.ts` file still awaiting this same move --
out of scope here, untouched.

### `recogniseComplementStartIndex()`/`recogniseComplementPhraseType()`: deciding whether a Complement span exists, and what shape it takes

Added to `role/processor/phrase_processor.ts`, alongside
`recogniseModifierRoles()`'s existing Head-finding helpers, for the
three PhraseTypes that actually declare a COMPLEMENT row in their own
`PHRASE_TYPE_DETAILS[...].allowedTypes` -- NounPhrase, AdjectivePhrase,
PrepositionalPhrase (VerbPhrase/AdverbPhrase/InfinitivePhrase declare
none, so `recogniseComplementStartIndex()` always returns `undefined` for them,
unchanged):

- NounPhrase/AdjectivePhrase: the first post-Head token capable of
  reading as a Preposition (`PHRASE_TYPE_PREPOSITIONS`'s own closed
  set, the same membership `recogniseLemmaPhraseType()` itself already checks
  one Phrase-structure level up) starts the Complement, running to the
  end of the token list. `undefined` when no such token exists -- the
  overwhelmingly common case ("toy poodle", "highly reliable").
- PrepositionalPhrase: always `headIndex + 1`, unconditionally, when
  any token follows the Head -- PrepositionalPhrase's own structure
  ("Preposition + Noun phrase/complement + (Modifiers)") places its
  Complement immediately after its own Preposition Head, every time.
  This makes the post-Head Modifier rule `identifyNonHeadModifierRole()` still
  carries for PrepositionalPhrase permanently unreachable in practice
  (verified: no real bundled-data test ever exercised it, only
  `postModifiers.toEqual([])` assertions) -- left in place rather than
  deleted, matching this module's own existing "kept for a case the
  real data never exercises" precedent for a couple of its other
  fallback branches.

`recogniseComplementPhraseType()` decides the nested shape structurally,
never from a WordNet-tagged part of speech (there is none for an
internal span this codebase invents): a nested PrepositionalPhrase when
the span itself opens with another Preposition-capable token ("out of
[of print]" -> "of print" nested one level, itself complementing "of"
with "print"), a NounPhrase otherwise. Only these two branches are ever
actually built -- PrepositionalPhrase's own COMPLEMENT row genuinely
allows six shapes (NounPhrase, Pronoun, Adverb, AdverbPhrase,
PrepositionalPhrase, Clause), but a Pronoun/Adverb/AdverbPhrase/Clause
complement has no real producer here, the same "documented ahead of a
real producer" status this feature itself just closed out for
COMPLEMENT more broadly.

### `Phrase.complements` + narrowed per-subtype fields

Added `complements?: readonly (Identifier | Phrase | Clause)[]` to the
base `Phrase` entity, `preModifiers`/`postModifiers`'s own exact two-
shape union one field over. Narrowed in `NounPhrase`/`AdjectivePhrase`
(`Identifier | PrepositionalPhrase | Clause`, their own shared
COMPLEMENT row) and `PrepositionalPhrase` (`Identifier | NounPhrase |
AdverbPhrase | PrepositionalPhrase | Clause`, its own six-shape row
minus the bare Pronoun/Adverb Word-subtype entries, which fold into the
generic `Identifier` branch the same way every other `*_phrase.ts`
subtype's own MODIFIER row already does). `VerbPhrase`/`AdverbPhrase`/
`InfinitivePhrase` are untouched -- no COMPLEMENT row, no narrowing.

Unlike `preModifiers`/`postModifiers`, this is a field
`updatePhraseWordLinks()` genuinely builds a real nested Phrase for, not just
an `Identifier` or a left-out gap: when `recogniseModifierRoles()` finds
a COMPLEMENT position, every token from there to the end is re-joined
into text and recursively linked into a brand-new Phrase
(`buildComplementPhrase()`) via a recursive `updatePhraseWordLinks()` call --
complete with its own `headWord`/`preModifiers`/`postModifiers`/
`determiners`/`complements`, so a span nested two Prepositions deep
resolves correctly with no separate recursion limit needed. Every token
at or past the Complement's own start index is excluded from the outer
Phrase's flat `preModifiers`/`postModifiers`/`determiners` loop --
already true for free, since none of those tokens carry MODIFIER/
DETERMINER roles any more once `recogniseModifierRoles()` marks them
COMPLEMENT-owned; no separate skip logic was needed in that loop.

### Verified end-to-end against real seeded WordNet data (`vocabulary.test.ts`)

"abatement of a nuisance" itself: outer NounPhrase (head "abatement",
`preModifiers`/`postModifiers`/`determiners` all empty), `complements`
= one PrepositionalPhrase ("of a nuisance", `headWord` genuinely
`undefined` -- "of" has no standalone WordNet sense, same as every
other real preposition), whose own `complements` = one further nested
NounPhrase ("a nuisance", head "nuisance", `determiners` = one real
WordForm reference for "a") -- recursion terminates there, "nuisance"
alone opens no trailing Preposition span. Two existing tests' own
`recogniseModifierRoles()` assertions updated for the same underlying
behavior change: "at fault" (`[HEAD, undefined]` -> `[HEAD, COMPLEMENT]`,
its own single-token Complement "fault" resolving as a nested NounPhrase
in turn) and "in the meantime" (`[HEAD, DETERMINER, undefined]` ->
`[HEAD, COMPLEMENT, undefined]` -- "the" now belongs to the nested
"the meantime" NounPhrase's own `determiners`, not the outer
PrepositionalPhrase's, though it still resolves no WordForm there
either, for the identical "the" has no WordNet sense reason as before).
Live Playwright check against the real running app (WordNet seeded,
Vocabulary UI's Phrases tab): "abatement of a nuisance" renders
correctly, no console errors, seeding completing normally with the new
recursive construction in the real pipeline, not just under test.

Client-side surfacing of `complements` in the Vocabulary UI's detail
panel is out of scope here -- `builder_phrase.ts` reads none of it yet,
matching how `preModifiers`/`postModifiers` themselves were implemented
as a data-layer change before any UI surfaced them.

### Follow-up: a Complement Phrase registered into the Phrases store, not just embedded

Reported after the fix above shipped: "of a nuisance" didn't show up in
the Phrases tab at all -- correct given how it was built (a real nested
`Phrase` object, but only ever reachable by walking into its parent's
own `complements` array, never `phraseBook.append()`ed, `toSyntheticWord()`'s
own "never inserted into any Dictionary" precedent). Asked directly
whether a Complement should become its own independently-listed,
independently-searchable Phrases-tab entry, or stay a detail-panel-only
structural fact -- the answer was both.

**Registration** (`role/processor/phrase_processor.ts`): `updatePhraseWordLinks()`/
`buildComplementPhrase()` both take a new optional `phrases: Phrases`
parameter -- the same optional-store convention `wordForms` already
has. When supplied, `registerComplementPhrase()` finds-or-creates the
Complement directly *in* that store (`Phrases.append()`, tagged with a
new synthetic `partOfSpeech`: NOUN for a NounPhrase complement, matching
`recogniseLemmaPhraseType()`'s own NOUN -> NOUN_PHRASE default; PREPOSITION
for a PrepositionalPhrase one -- genuinely used for once, since no real
WordNet-tagged Phrase is ever PREPOSITION-tagged). Dedup key: (`text`,
`phraseType`, that synthetic `partOfSpeech`) -- the identical (text, tag)
shape `word_seeder.ts`'s own WordNet Phrase append site already uses.

This dedup is what keeps the whole feature idempotent, and it had to
be: `updatePhraseWordLinks()` already runs more than once over the same real
Phrase within a single `seedWordNet()` call (the closed-class-then-
WordNet re-link pass, this log's own earlier section on it) and again
on every repeat `seedWordNet()` call -- without reuse, each of those
would have appended its own fresh duplicate "of a nuisance" every
single time. `word_seeder.ts`'s own two real `updatePhraseWordLinks()` call
sites now both pass `phraseBook` through. Verified directly
(`vocabulary.test.ts`): the "seeds every synset member... stays
idempotent" test's own `dictionary.totalEntries() + phraseBook.totalEntries()`
invariant relaxed from exact equality with `wordsSeeded` (no longer
true -- a Complement Phrase is a real new entry `wordsSeeded` never
counts, since it isn't itself a synset member) to `toBeGreaterThanOrEqual`,
plus a new, stronger check that a *second* `seedWordNet()` call leaves
that total completely unchanged -- the real idempotency proof, not just
"doesn't crash twice."

**Client surfacing** (`ui/server/builder_phrase.ts`/`builder_word.ts`,
`ui/client/client_detail_panel_controller.ts`): a new
`PhraseComplementSegment` (`{ id, text, phrase_type }`) is deliberately
not shaped like `DefinitionSegment` -- a Complement is a real,
independently-registered Phrase now, not a single Word/WordForm
reference, so `phraseComplementSegments()` reads `phrase.complements`
directly rather than recomputing from `text` the way
`phraseModifierSegments()` does. Wired into `WordRecord.complements`
(both `searchWords({ wordId })` branches -- the direct Phrase lookup and
the Sense-representative fallback) and rendered as a "Complement:" row
using the existing `<button class="link-btn" data-pivot-id="...">`
cross-reference pattern (`wireDetailPivotButtons()` already wires every
one on every render) rather than `definitionSegmentHTML()`'s plain
hover-only span, since this genuinely needs to navigate, not just show
a tooltip.

Verified end-to-end (live Playwright, the real running app): searching
"of a nuisance" in the Phrases tab now finds it as its own row --
`Preposition · Prepositional Phrase`, no definition (a synthetic entry
has none) -- alongside "abatement of a nuisance" itself. Opening
"abatement of a nuisance"'s own detail panel shows a "Complement: **of a
nuisance** [Prepositional Phrase]" row; clicking it navigates to "of a
nuisance"'s own detail panel, correctly breaking its own headword down
into "of"/"a"/"nuisance" via the ordinary `phrase_word_segments`
rendering every other Phrase already gets.

## `Phrase.preModifier`/`postModifier`/`determiner`: array -> singular, with real run-collapsing

### The reported bug: "attributive genitive case" split its own "attributive genitive" into two unrelated Modifiers

`Phrase.preModifiers`/`postModifiers` (arrays of bare `Identifier` --
each a WordForm reference) and `determiners` (same shape) assigned one
array entry per MODIFIER- or DETERMINER-role token, independently of
its neighbors. "attributive genitive case" (06322991-n, dict/data.noun)
seeds as a real NounPhrase, head "case" -- correct -- but its own two
pre-Head tokens landed as two independent `preModifiers` entries,
"attributive" and "genitive" each on their own, even though "attributive
genitive" is *itself* a real, independently-seeded two-word ADJECTIVE
lemma of its own (00174035-s, dict/data.adj -- WordNet's own "-s" suffix
for a satellite-adjective sense, still plain `PartOfSpeech.ADJECTIVE`
here) sharing the identical synset as "attributive_genitive_case"
itself. Reported directly, with the exact expected shape named: a
Modifier run of 2+ tokens should collapse into one nested Phrase (or a
`Coordination`, when a real coordinating conjunction sits inside the
run), the same way `Phrase.complements` already collapses a post-Head
span -- not stay a flat array of single-word entries. Explicitly scoped
to apply the identical fix to `postModifier` and `determiner` too.

### Field shape: singular, three-way union

Base `Phrase`: `preModifiers?`/`postModifiers?: readonly (Identifier |
Phrase | Clause)[]` and `determiners?: readonly Identifier[]` became
`preModifier?`/`postModifier?`/`determiner?: Identifier | Phrase |
Coordination<Word | Phrase> | Clause` -- one value, not an array;
`determiner` gains the same `Phrase`/`Coordination` embedding
`preModifier`/`postModifier` already had (it never supported anything
but a bare `Identifier` before, since no real bundled DETERMINER run
was ever longer than the one "each other" exception, below). Every
`*_phrase.ts` subtype's own narrowed `XPhraseModifier` union followed
the same singular rename and gained `Coordination<Word | Phrase>`
alongside its existing `Identifier`/embedded-Phrase branches.
`AdjectivePhraseModifier` also gained a self-referential `AdjectivePhrase`
branch while already being touched here -- correcting a pre-existing,
harmless gap between `PHRASE_TYPE_DETAILS[ADJECTIVE_PHRASE].allowedTypes.MODIFIER`
(which only ever listed `["Adverb", "AdverbPhrase"]`) and the real
runtime `identifyNonHeadModifierRole()` ADJECTIVE_PHRASE branch (which already
treated an ADJECTIVE-capable pre-Head token as a genuine Modifier too,
"bone dry" -- degree-modifier-less compounding). `complements` is
untouched -- it stays an array, `Phrase.complements`'s own docstring on
why a Complement span never has more than one constituent in practice
even though the field's own shape doesn't structurally forbid it.

### Run-collapsing algorithm (`role/processor/phrase_processor.ts`)

`recognisePreHeadModifierRun()`/`recognisePostHeadModifierRun()`/`recogniseDeterminerRun()` find
the maximal contiguous same-role token span adjacent to (or, for
`recogniseDeterminerRun()`, anywhere in) `wordRoles` -- `[start, end)` indices,
`undefined` when no run exists. `createModifierRunValue()` resolves one such
span: length 1 -> `recogniseTokenWordFormId()` (unchanged, the pre-existing
per-token WordForm-reference resolution `updatePhraseWordLinks()`'s own local
`matchingFormId()` closure already did, pulled out standalone since this
function now operates on an arbitrary token sub-span, not a whole-phrase
index); length 2+ -> `recogniseCoordinatingConjunctionIndex()` first (below),
falling back to `recogniseModifierPhraseType()` + `createLinkedNestedPhrase()`
(one flat nested Phrase for the whole run, `createStoredNestedPhrase()`'s
own find-or-create dedup against `phrases` when supplied -- the exact
mechanism `Phrase.complements`'s own `registerComplementPhrase()`
already established one section up, generalised here beyond just
Complements and renamed to match: `partOfSpeechForComplementPhraseType()`
-> `identifySyntheticPartOfSpeech()`, `registerComplementPhrase()`/
`buildComplementPhrase()` -> `createStoredNestedPhrase()`/`createLinkedNestedPhrase()`).
`recogniseModifierPhraseType()` picks the new nested Phrase's own
`phraseType` structurally from the run's own tokens (ADJECTIVE_PHRASE if
any token is ADJECTIVE-capable, else NOUN_PHRASE if any is NOUN-capable,
else ADVERB_PHRASE, else NOUN_PHRASE default) -- verified this picks
ADJECTIVE_PHRASE for "attributive genitive", matching the real
independently-seeded Phrase exactly.

**The determiner self-reference guard.** A pre-/post-Head MODIFIER run
can never span every token in `tokens` -- a Head token always sits
outside it by construction. A DETERMINER run *can*: "each other"
(pronouns.json) has no Head at all, both tokens DETERMINER-role,
spanning 100% of `tokens`. Collapsing that would build a nested Phrase
whose own `text` equals its parent's, and recursively linking it would
never terminate (an identical child containing an identical child,
forever). `updatePhraseWordLinks()` checks for this one case explicitly
(`detRun[0] === 0 && detRun[1] === tokens.length`) and falls back to the
run's own first token alone via `recogniseTokenWordFormId()` instead of
collapsing -- a narrow, deliberate compromise scoped to this one real
idiom shape, not a general non-collapsing rule (verified: "each other"
own updated test now asserts `determiner` resolves "each" alone, not a
nested "each other" Phrase).

### Coordination detection: `recogniseCoordinatingConjunctionIndex()`, and why it needed run-detection changes of its own

`recogniseCoordinatingConjunctionIndex()` finds the one token index (strictly
between a run's own first and last position) whose own
`dictionary.lookupAll(token)` includes a real `Conjunction` Word with
`conjunctionType === ConjunctionType.COORDINATING` (`isConjunction()`,
role/processor/conjunction_processor.ts) -- `WordCoordinationSeeder`'s
own identical resolution pattern, reused rather than reinvented. Binary
split only ("X and Y") -- no comma-aware N-ary coordination, matching
the scope of the one real precedent this mirrors (`WordCoordinationSeeder`
handles N-ary via structured JSON `coordinates`, not free-text parsing).
Found -> split the run around it, resolve each side
(`createCoordinateSide()`: length 1 -> `recogniseMatchingTokenHomograph()` against the
run's own target POS below; length 2+ -> one further nested Phrase, one
level only -- a coordinate side is never itself searched for a second,
nested coordination), `createStoredModifierCoordination(coordinations,
coordinates, coordinator)` finds-or-creates the `Coordination` in the
supplied `Coordinations` store (a linear scan over `coordinations.all()`
comparing each coordinate's own `entryId.uuid` in order plus
`coordinator?.value` -- `Coordinations` has no text index of its own to
do better with, `data/coordinations.ts`'s own documented design choice)
or builds a bare, unregistered one via `createCoordination()` when
`coordinations` is omitted, the same "optional store" convention
`wordForms`/`phrases` already have.

Getting the run itself to include the embedded coordinator at all needed
its own fix. `recogniseModifierRoles()` never assigns MODIFIER or
DETERMINER to a Conjunction-only token ("and"/"or"/... resolve to
CONJUNCTION alone, never alongside NOUN/ADJECTIVE/ADVERB/DETERMINER), so
a naive contiguous-role scan stops dead at the coordinator -- "big and
red" would scan as one lone MODIFIER ("red") immediately before the
Head, with "big" and "and" left outside the run entirely, coordination
detection never even reached. `recogniseBackwardRoleRunBoundary()`/`recogniseForwardRoleRunBoundary()`
(shared by all three run-finding functions) bridge exactly one such gap:
after an ordinary same-role token, also accept a real coordinating
conjunction (`isCoordinatingConjunctionToken()`, the membership check
`recogniseCoordinatingConjunctionIndex()` itself already made, pulled out so both
call sites share it) immediately followed by one more same-role token
beyond it -- one bridge deep on either side, matching
`recogniseCoordinatingConjunctionIndex()`'s own binary-split-only scope.

**Coordinate resolution needed its own target-POS fix, not
`recogniseModifierPhraseType()`'s.** The first working version resolved
each coordinate side against `identifyHeadTargetPartsOfSpeech(recogniseModifierPhraseType(tokens))`
-- reusing the same heuristic `createLinkedNestedPhrase()`'s own non-coordination
branch already uses to pick a brand new nested Phrase's own `phraseType`.
That's the wrong POS source for a coordinate Word specifically: a
coordinate's own correct POS is already pinned down by the *role* this
run is playing in its parent Phrase (e.g. ADVERB, for a VERB_PHRASE
post-Head Modifier run), not by re-guessing from the coordinate tokens'
own ambiguous homograph set -- and the two disagree often enough to
matter. Caught live against the real bundled data: `move_back_and_forth`
(01880523-v) is a real four-token VerbPhrase ("move" Head, "back and
forth" one post-Head Modifier run); `recogniseModifierPhraseType(["back",
"forth"])` picked NOUN_PHRASE (both tokens are *also* real NOUN
homographs -- "forth" names a river, capitalized "Forth"), so the
coordinate resolution searched for a NOUN "forth" and silently returned
the wrong homograph -- a Scottish river standing in for the adverb.
Fixed by adding `identifyModifierRunTargetPos(phraseType, role, isPreHead?)`,
`identifyNonHeadModifierRole()`'s own per-`phraseType` MODIFIER/DETERMINER
switch re-expressed as an allowed-POS *set* instead of a per-token role
decision (NOUN_PHRASE -> `{NOUN, ADJECTIVE, ADVERB}`; VERB_PHRASE/
ADVERB_PHRASE -> `{ADVERB}`; ADJECTIVE_PHRASE -> `{ADVERB, ADJECTIVE}`;
PREPOSITIONAL_PHRASE -> `{ADVERB}` pre-Head / `{ADJECTIVE}` post-Head;
DETERMINER role, any `phraseType` -> `{DETERMINER}`), computed once in
`updatePhraseWordLinks()` from the enclosing Phrase's own `phraseType` and
passed into `createModifierRunValue()`/`createCoordinateSide()` directly --
`recogniseModifierPhraseType()` stays exactly as it was, still used
(correctly) for the non-coordination nested-Phrase-`phraseType` decision
one branch over, since that nested Phrase gets its own full recursive
`updatePhraseWordLinks()` pass afterward to self-correct any imprecision there,
the same safety net a directly-embedded `Coordination` Word never gets.

### Verified against real seeded WordNet + Common Vocabulary Cache data, not just synthetic tests

Contrary to this feature's own original plan, which found no real
bundled `X_and_Y_Z`-shaped 3-word lemma and assumed coordination
detection could only be verified synthetically: a live dump against the
real seeded data (`seedClosedClassWords({ excludeOpenClasses: true })` +
`seedWordNet()`, `coordinations` threaded through) found **48** real,
correctly-structured Modifier-run coordinations -- almost entirely
genuine multi-word organisation/idiom names whose own coordinated span
is embedded *inside* a longer WordNet lemma, not the lemma's whole text:
"National Aeronautics and Space Administration" -> "National Aeronautics"/
"Space" either side of "and"; "search and rescue [mission]"; "Health and
Human [Services]"; "profit and loss"; "clear and present [danger]";
"last but not [least]" (a real `but`-coordinated one, not just `and`).
Of those 48, 15 have at least one multi-word (nested Phrase) coordinate
side rather than a single Word on both sides. `vocabulary.test.ts`'s own
pure-function synthetic test ("big and red dog" against a hand-seeded
four-Word Dictionary) still exists alongside this, since it's the only
way to exercise the idempotent-re-link/`Coordinations`-store-registration
path in isolation from ~92,000 other Words' worth of real seeding noise
-- but the claim that no real bundled coordination example exists was
wrong, and the feature turns out to do real, immediately useful work
against the bundled data as shipped, not just a hypothetical.

This interaction changed two pre-existing `WordCoordinationSeeder`/
`coordinationRecords()` test expectations that had implicitly assumed
`coordinations` stayed empty until `WordCoordinationSeeder` ran: it
doesn't any more, since `seedWordNet()` now threads `coordinations`
through every `updatePhraseWordLinks()` call
(role/word_seeder.ts's own `seedClosedClassWords()`/`seedWordNet()`,
both gaining an optional `coordinations?: Coordinations<LinguisticUnit>`
parameter, `VocabularyContext.coordinations` already existed and needed
no change of its own). `coordinations.totalEntries()` after
`WordCoordinationSeeder` runs is `48 + 9`, not `9` alone -- the two
pipelines' totals simply add, even on the one case where they happen to
name the same real-world pairing ("back and forth" is independently both
one of `word_coordinations.json`'s own 9 hand-curated entries *and* one
of the 48 auto-detected ones, from the unrelated `move_back_and_forth`
lemma above) -- neither pipeline dedups against the other's own entries,
so this is an accepted, harmless doubling, not a bug. `coordinationRecords()`'s
own count grew by 33, not 48: `coordinationRecordFor()`'s pre-existing
`isWord()` guard silently drops any Coordination with a multi-word
(Phrase) coordinate side, the same as it always has -- 15 of the 48 hit
that guard, leaving 33 that render.

### UI (`ui/server/builder_phrase.ts`/`builder_word.ts`, `ui/client/client_detail_panel_controller.ts`)

`phraseModifierSegments()` no longer recomputes from `phrase.text` via a
fresh `recogniseModifierRoles()` pass the way its array-shaped
predecessor did (that recomputation existed only to recover a token's
own plain surface text when no WordForm matched it, an `Identifier`-only
concern) -- now that a multi-token span is a real, independently-built
nested Phrase or Coordination rather than an array of independent
per-token references, it reads `phrase.preModifier`/`postModifier`/
`determiner` directly, `phraseComplementSegments()`'s own identical
"nothing left for a fresh recomputation to recover" reasoning. Returns
`{ pre?, post?, determiner?: ModifierSegment }`, `ModifierSegment` being
`DefinitionSegment | PhraseComplementSegment` -- the single-token
`Identifier` case renders as a plain word (hover-tooltip only, reusing
`definitionWordSegment()`), the multi-token nested-Phrase case as a
`PhraseComplementSegment`-shaped clickable link (`{ id, text,
phrase_type }`, `phraseComplementSegments()`'s own exact shape and
reasoning -- a nested Phrase here is registered into `Phrases` the same
way a Complement already is). A `Coordination` value renders as plain
joined text instead of a link (`coordinationText()`, joining each
coordinate's own `text` around the coordinator's own spelling) --
deliberately never clickable, unlike a nested Phrase: a `Coordination`
is never independently registered into any store with its own
detail-panel route (`data/coordinations.ts`'s own docstring: "no
isXCoordination() guard family exists yet, mirroring how Coordination
itself still has no seeder/UI consumer of its own"), so a pivot link
here would resolve nowhere. `WordRecord.pre_modifiers`/`post_modifiers`/
`determiners` (arrays) became `pre_modifier`/`post_modifier`/`determiner`
(single, possibly-undefined `ModifierSegment`) in both `searchWords({
wordId })` branches; the client's own `modifierListHTML()` (numbered,
array-shaped) was replaced by `modifierEntryHTML()`/`modifierRowHTML()`,
branching on the segment's own shape (`.id` present -> clickable link,
`.word` present -> `definitionSegmentHTML()`, neither -> plain text) for
a single entry rather than an indexed list.

### Verified end-to-end

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
169/169 passing, including a new dedicated "attributive genitive case"
test (verifying `preModifier` is the exact same already-seeded
"attributive genitive" AdjectivePhrase object, not a fresh duplicate --
`createStoredNestedPhrase()`'s own dedup working end to end against real
WordNet data) and a new synthetic Coordination test ("big and red dog"
against a hand-seeded Dictionary, verifying `coordinates`/`coordinator`/
store-registration/idempotent re-linking). Live Playwright check against
the real running app: seeded WordNet, searched "attributive genitive
case" in the Phrases tab, opened its detail panel, confirmed a single
"Pre-Modifier: **attributive genitive**" link (not two separate word
chips), clicked through to confirm "attributive genitive" is its own
real Phrases-tab row with head "genitive" and its own "attributive"
Pre-Modifier.

### Follow-up: a standalone Conjunction's own text was showing under COORDINATES, not COORDINATOR

Reported directly, with a real example: "as soon as" -- a multi-word
subordinating Conjunction Phrase -- rendered in the Coordinations tab
with its own three tokens under the COORDINATES column and nothing
under COORDINATOR. Not a display-only glitch: `conjunctionWordRecord()`/
`conjunctionPhraseRecord()` (`ui/server/builder_coordination.ts`) had
always built a standalone Conjunction row this way, putting its own
text into `coordinates` with `coordinator` left `undefined` -- a real,
pre-existing category error the field's own docstring had rationalised
away ("there's no separate coordinator to join them with") rather than
fixed: a standalone Conjunction row has no real coordinates at all
(nothing is being joined; the row already IS the joining word), so its
own text belongs in `coordinator`, the field that actually means "this
word/phrase joins things."

Fixed by swapping which field carries the text: `coordinates: []`,
`coordinator: word.text` (single-word) / `coordinator: phrase.text`
(multi-word), for both record builders. Client `coordinatesText()`
(`ui/client/client_coordinations_tab_view.ts`) now returns `''` for an
empty `coordinates` list -- `coordinationRowHtml()` renders that as the
same em-dash placeholder the COORDINATOR column already used for an
asyndetic real coordinate pair, so a Conjunction-itself row now reads
COORDINATES "—" / COORDINATOR "as soon as", not the reverse.

**A real, silent regression this surfaced and fixed in the same pass**:
`coordinationRecords()`'s own sort (`records.sort((a, b) =>
a.coordinates.join(" ")...)`) keyed purely off `coordinates` -- with
that now empty for all 43 Conjunction-itself rows, every one of them
would have compared equal (empty string) and lost their alphabetical
order entirely, silently, with no test catching it (nothing asserted
sort order for that subset). Fixed by falling back to `coordinator`
when `coordinates` is empty (`(r.coordinates.join(" ") ||
r.coordinator || "").toLowerCase()`), so both shapes still sort
correctly against each other on one list.

**Investigation dead-end worth recording**: live-checking this fix
first turned up an apparently empty Coordinations tab (0 rows) no
matter what was searched, even right after "Load WordNet" reported
92,335 words seeded. Traced with temporary `console.log`s in
`vocabulary_worker.ts` (Worker console output surfaces through
Playwright's own `page.on("console")`) down to `dictionary.lookupAll("and")`
returning zero homographs even after a full WordNet seed --
`handleSeedWordNet` never calls `seedClosedClassWords()` at all
(`word_seeder.ts`'s own "Load WordNet is this prototype's actual
source of truth for NOUN/VERB/ADJECTIVE/ADVERB coverage" design,
`handleSeedCommonVocabulary`'s docstring), so with only "Load WordNet"
clicked, no Conjunction Word ever exists in the Dictionary at all --
neither `WordCoordinationSeeder` (its own `coordinatorWord` resolution
fails for every one of its 9 entries) nor this feature's own modifier-
run coordination detection (`isCoordinatingConjunctionToken()` finds
nothing to match) can find a coordinator to key off. Not a bug of its
own -- "Seed Vocabulary" (`handleSeedCommonVocabulary`) is what seeds
every closed-class Conjunction, and is meant to be clicked alongside
"Load WordNet" for full coverage, exactly the workflow the toolbar's
own two separate buttons already imply -- but a genuine trap for a
same-day live check that only exercises one of the two. Live-verified
correctly afterward, both buttons clicked: 85 coordinations total, "as
soon as"/"although"/"and" all rendering COORDINATES "—" / COORDINATOR
their own text, "search and rescue" (a real modifier-run auto-detected
Coordination) still rendering its own real coordinate pair correctly
either side of "and", unaffected.

Full `vitest run --no-file-parallelism`: 169/169 passing, including
the existing `coordinationRecords()` test's own standalone-Conjunction
assertions updated for the new `coordinates: []`/`coordinator: <text>`
shape.

## Words tab: every WordForm as its own fixed column, Base Lemma Canonical Form first

Requested directly: "show all wordForms as columns. The first column
should be the base lemma Form." No data-layer change needed at all --
`WordRecord.word_forms: WordFormEntry[]` (`ui/server/builder_word.ts`)
has carried every one of a Word's own real `WordForm` records, fully
populated, for every row already embedded in `WORDS` (under
`MAX_INTERACTIVE_WORDS`) and for every `searchWords()` result (over it)
since the WordForm migration itself (this log's own much earlier
"Phase 1-6" sections) -- this was purely a client-rendering gap, never
a plumbing one.

Asked directly how to scope it, given `WordFormField` has 27 possible
members but any one Word only ever populates a handful (a Noun ~3, a
Verb ~9): **all 27, fixed, in the enum's own canonical order** (not a
narrower dynamic set that would shift under a filter) -- and to keep
the existing "Word" column (lexical form + its common/root-word/
derivable-noun/sense-id badges) as its own column rather than folding
it into the new Base Lemma one, even though the two usually show the
same spelling.

**Column order gives the "Base Lemma first" requirement for free.**
`WordFormField`'s own declared order (`data/enums/word_forms_enum.ts`)
already opens with `BASE_LEMMA_CANONICAL_FORM` -- it mirrors the Word
Form to Part of Speech Matrix's own row order, and every real seeding
path registers a Word's own base-lemma WordForm before any
POS-specific `generateXForms()` adds the rest (`WordForms.formsOf()`'s
own docstring, `data/word_forms.ts`). Using that enum order directly
for the 27 new columns needed no special-casing to put Base Lemma
first -- it already is first.

**Two files hand-mirror the same 27-entry list, by necessity.**
`client_shell_html.ts`'s own `<thead>` (27 new `<th>` cells, hardcoded
label text, between "Word" and "Part of speech") is a plain template
string with no computation step of its own -- consistent with every
other table header in that file already being static text, not
generated. `client_words_tab_view.ts`'s own new `WORD_FORM_FIELDS`
constant carries the matching 27 field *values* (the camelCase strings
`WordFormEntry.field` actually holds) in the identical order, so
`wordFormColumnsHtml()` can build a `{field: entry}` lookup map per row
and emit one `<td>` per `WORD_FORM_FIELDS` entry -- the entry's own
`value` when the Word has that form, an em-dash otherwise
(`modifierListHTML()`'s/`coordinationRowHtml()`'s own identical
"absent" convention, reused rather than reinvented). Neither file can
import the real `WordFormField` TS enum at runtime (both are plain
strings embedded into the page), so the two lists are cross-referenced
by comment and have to be kept in sync by hand if the enum ever
changes -- the one real cost of not adding a third server->client
plumbing token (`WORD_FORM_FIELDS_JSON`, mirroring `POS_VALUES_JSON`'s
own established pattern) for something this foundational and rarely
changed.

**Table width**: 33 columns (Word + 27 WordForm + Part of speech/
Domain/Definition/Labels/Relationships) don't fit in `.table-wrap`'s
own width the way every other table's much smaller column count
already does under the shared `table { width: 100% }` rule -- squashed
to 100%, most WordForm columns would render as unreadable slivers.
Scoped a `#panel-words table { width: max-content; min-width: 100% }`
override so this one table sizes to its real content instead, letting
`.table-wrap`'s own pre-existing `overflow-x: auto` scroll it
horizontally (the same way it already scrolls vertically past
`MAX_WORD_ROWS_SHOWN`) -- every other table keeps the plain
`width: 100%` rule, unaffected, since none of them has enough columns
for this to matter.

**One real regression caught before it shipped**: `client_words_tab_overcapacity.ts`'s
own "Searching…" placeholder row hardcodes `colspan="6"` to span the
Words table's own column count while a live over-capacity search is in
flight -- missed on the first pass, since it's a separate file from
the header/row-rendering changes, and would have rendered a
mis-spanned placeholder row (visually broken, one cell way too narrow)
for exactly the population size (>20,000 words) this feature matters
most for. Updated to `colspan="33"`, with a comment cross-referencing
`client_shell_html.ts`'s own `<thead>` row as the source of truth to
keep in sync by hand. The three sibling tables' own identical
`colspan` placeholders (Phrases 5, Senses 6, Relationships 4) were
checked and confirmed untouched/correct -- this feature only ever
touches the Words table.

Verified end-to-end (live Playwright, the real running app, both "Seed
Vocabulary" and "Load WordNet" clicked): 33 header cells in the
expected order (`Word`, `Base Lemma Canonical Form`, ...,
`Reflexive Case Form`, `Part of speech`, ...); a real seeded Noun
("boondoggle") shows Base Lemma/Singular/Plural populated with its own
tense-form columns all correctly dashed; a real seeded Verb ("brunch")
shows Base Lemma/Present/Past/Third Person Singular Present/Present
Participle/Past Participle all correctly populated with its own
singular/plural-number columns dashed; the table visibly overflows its
own container width and scrolls horizontally rather than squashing.
`npx tsc -b --force` clean, full `vitest run --no-file-parallelism`
169/169 (no test exercised the Words table's own HTML/column
structure before this, so nothing needed updating).

## `WordFormEntry.field`/`DefinitionSegment.word_form.field`: typed as `string`, should be `WordFormField`

Reported directly: "in wordForm the attribute field should be the
wordform enum." Both were genuinely mistyped as bare `string` even
though every real value ever assigned to either (`wordFormsFor()` in
`builder_word.ts`, `definitionWordSegment()` in `builder_segment.ts`)
was already a real `WordFormField` member's own string value -- a
type-only gap, not a runtime one. Fixed by narrowing
`WordFormEntry.field` to `WordFormField | "wordCharacterForms"` (the
one non-enum literal `wordFormsFor()` itself synthesizes for
`Noun.wordCharacterForms`, `WordForm` being a Word-only concept with no
Matrix row of its own for that field) and `DefinitionSegment.word_form.field`
to plain `WordFormField`. Confirmed the built output was byte-identical
to the prior deploy (a pure type change, no runtime code path
altered), so this one was committed and pushed without a redeploy.

## `WordFormField`: string-valued -> numeric, tensor-coded, with a dedicated `wordFormFieldLabel()` for the GUI

Requested directly, and explicitly reversing this enum's own prior
documented decision: "the wordforms enum should be by number not text.
Otherwise it cannot be used by tensor operations a seperate functiom
should exist to comvert to text for the GUI." `WordFormField`
(`data/enums/word_forms_enum.ts`) had been string-valued since its own
introduction (this log's much earlier WordForm-migration sections),
each member's value spelled out as its own camelCase name (e.g.
`PLURAL_NUMBER_FORM = "pluralNumberForm"`) precisely so client code
without access to the real TS enum could still read a self-describing
value straight off the wire -- the enum's own docstring argued this
directly. That reasoning is overridden now: `WordFormField` moves onto
the same "tensor-coded" convention `PartOfSpeech`/`LinguisticUnitKind`
already use (`data/enums/part_of_speech.ts`'s own docstring) --
sequential integers, `0`-`26`, matching the enum's own declared order
(itself unchanged, still mirroring the Word Form to Part of Speech
Matrix's own row order) -- so a `WordForm`'s own `field` can be used
directly as a tensor index/one-hot position, not just a display key.

**The user's own second requirement -- text still has to reach the
GUI somehow -- is a new, separate, dedicated function**, not a
retrofit of the existing generic one. `wordFormFieldLabel(field:
WordFormField): string` (new, same file) looks a numeric code up in a
new `WORD_FORM_FIELD_LABELS: Record<WordFormField, string>` table
carrying each of the 27 members' own exact prior label text ("Plural
Number Form", etc, byte-identical to what the old camelCase-splitting
transform used to produce, so no rendered label changed). Deliberately
NOT the same function as `formFieldLabel()` (`builder_segment.ts`,
generic camelCase-string -> Title Case splitter): that one has 5 real
call sites, only 2 of which ever passed a real `WordFormField` value
(`wordFormsFor()`'s own real WordForm rows, `definitionWordSegment()`'s
own matched-form segment) -- the other 3 pass arbitrary non-enum
camelCase strings with no numeric code of their own at all (Word's own
`isNominalised`/`isAdjectivised`/... derivation-pointer field names in
`morphologicalDerivations()`, and the synthetic `"wordCharacterForms"`
literal). Retyping `formFieldLabel()`'s own parameter to `WordFormField`
would have broken those 3 unrelated call sites for no reason; adding a
second, dedicated, table-backed function for the 2 real-enum sites
keeps both concerns cleanly separated, and `formFieldLabel()` itself
was left otherwise untouched (only its own docstring rewritten, to
scope it explicitly to non-enum field names now that it no longer
covers `WordFormField` at all).

**Real call sites updated, beyond the enum's own file**:
`wordFormsFor()`/`builder_word.ts` and `definitionWordSegment()`/
`builder_segment.ts` (both switched to `wordFormFieldLabel()` for their
label text, per above); `recogniseFormTextIssue()`/`role/word_processor.ts`
(`WordFormIssue.reason`'s own diagnostic message interpolates a
`field` value into human-readable text -- switched to
`wordFormFieldLabel(field)` so the message still reads e.g. "...for
'Plural Number Form'" rather than a bare digit); `vocabulary.test.ts`
(two `reason`-string assertions, `formTextOf()`'s own `field` parameter
type).

**One genuinely pre-existing, previously-undetected bug this surfaced**:
`role/part_of_speech_identifier.ts`'s `identifySeeded()`/`inflectedReason()`
locally re-typed a real `WordFormField` value as a bare `string` on its
own `formMatches` array and burned it straight into a user-facing
`WordIdentifier.reason` diagnostic ("Matched ... via this Word's own
\"${field}\" form..."). Not on the original list of files expected to
need a change -- only surfaced via a dedicated research agent's
exhaustive full-tree grep before implementation began, given the size
of this refactor's blast radius and that it explicitly reverses a
documented prior decision. Would have been a straight compile error
the moment the enum went numeric (the local `string` retyping papered
over the real type, so `tsc` itself never caught it on its own), not
merely a display regression. Fixed by properly typing `field` as
`WordFormField` and routing the message through `wordFormFieldLabel()`
too, the same as every other real diagnostic call site above.

**Client-side (`ui/client/*.ts`, plain JS template strings -- neither
file can import the real TS enum at runtime)**: `client_words_tab_view.ts`'s
own `WORD_FORM_FIELDS` constant, previously a hand-written 27-entry
array of the camelCase string values in declared order (kept in sync
with the enum by hand, the previous section's own documented cost),
collapses to `Array.from({ length: 27 }, (_, field) => field)` -- once
the enum's own values ARE its declared order (0-26, no gaps), the
array is just that whole range, no name-copying needed at all; the
one hand-sync cost this replaced is gone outright.
`client_senses_section_html.ts`'s own `verbFrameText()` compared a
`WordForm.field` against the string literals `'presentParticipleForm'`/
`'thirdPersonSingularPresentForm'` to find the two real inflected
spellings a WordNet verb-frame sentence's own "----ing"/"----s"
placeholders substitute against -- switched to the literal numeric
codes `8`/`7` (`WordFormField.PRESENT_PARTICIPLE_FORM`/
`THIRD_PERSON_SINGULAR_PRESENT_FORM`'s own declared positions), with a
comment naming which enum member each number is, since this client
script has no way to import the real enum and name them any other way.
This one was flagged as the highest-risk client-side site during
review -- a wrong number here fails silently (frame text falls back to
naive lemma+suffix concatenation, not a crash or a console error), not
loudly -- so it got its own dedicated live check rather than relying on
code review alone.

**Files read and confirmed safe as-is, no change needed**: `data/entities/word_form.ts`
(`WordForm.field: WordFormField` was already correctly typed against
the enum, unaffected by a change to the enum's own underlying
representation), `data/word_forms.ts`, `data/matrices/pos_vs_wordform_matrice.ts`
(`WORD_FORM_MATRIX` is looked up via `.find()`/`.filter()` with `===`,
never keyed by string), every `role/processor/*_processor.ts` /
`*_seeder.ts` (each assigns/compares real `WordFormField` enum members
by name, never their own literal string spelling), `client_shell_html.ts`
(the Words tab `<thead>` cells are static label text, not field
values), `client_detail_panel_controller.ts`, `data/matrices/word_form_part_of_speech_matrix.md`.

Verified end-to-end. `npx tsc -b --force` clean; full `vitest run
--no-file-parallelism` 169/169. Live Playwright, the real running app
(both "Seed Vocabulary" and "Load WordNet" clicked): the Words tab
table's "brunch" (Noun) row's own 24th WordForm column -- 0-indexed
enum value 23, `POSSESSIVE_CASE_FORM` -- correctly shows `"brunch's"`
while every other WordForm column on that row correctly shows an
em-dash, confirming the numeric codes round-trip correctly through
JSON serialization, the client's own numeric-keyed `{field: entry}`
lookup (relying on JS's implicit numeric-to-string key coercion, no
code change needed there), and the fixed-column rendering order all
stay aligned; the word detail panel's own Word Forms section for the
same Word renders "Base Lemma Canonical Form", "Singular Number Form",
"Plural Number Form", "Possessive Case Form" as real label text (not
raw numeric codes), confirming `wordFormFieldLabel()` reaches the GUI
as the user's own second requirement asked.

## `DeterminerSeeder`: every lemma was missing its own Base Lemma Canonical Form

Reported directly: "when seeding determiners in vocabulary the base
lemma form must be set. There are entries with it not set." Confirmed:
`WORD_FORM_MATRIX`'s own `BASE_LEMMA_CANONICAL_FORM` row (`data/matrices/pos_vs_wordform_matrice.ts`)
lists `DETERMINER` in its `appliesTo` set, alongside NOUN/VERB/ADJECTIVE/
ADVERB/PRONOUN/PREPOSITION/CONJUNCTION/INTERJECTION/NUMERAL --
`recogniseDeterminerFormIssues()`'s own docstring (`role/processor/determiner_processor.ts`)
even already documented `DeterminerSeeder` as this Word's own writer for
"Singular/Plural Number Form and Consonant/Vowel-Sound Form, plus
baseLemmaCanonicalForm" -- but `DeterminerSeeder.seed()`
(`role/determiner_seeder.ts`) never actually called `WordForms.registerBaseLemmaForm()`
for any of its 44 lemmas, only `registerNamedForm()` for the other four
fields. Every real DETERMINER Word this seeder ever produced -- "the",
"a", "this", ... -- carried no `BASE_LEMMA_CANONICAL_FORM` WordForm at
all, silently missing from both the Words tab's own fixed-column table
and the word detail panel's Word Forms section (both simply show an
em-dash for an unregistered field, so this had no error to surface, only
a permanently-blank column).

Fixed with one line, `this.wordForms?.registerBaseLemmaForm(word)`,
inserted right after `dictionary.append(word)` and before the
per-lemma Sense/forms loop -- the same "keep Base Lemma Canonical Form
the *first* WordForm on record" ordering `WordSeeder`'s own closed-class
loop and every `generateXForms()` already follow (`registerBaseLemmaForm()`'s
own call-site comments elsewhere in `word_seeder.ts`). `registerBaseLemmaForm()`
defaults its own `text` parameter to `word.text` when omitted (`WordForms`'s
own signature), so no per-lemma text needs threading through
`DeterminerLemmaSeed` -- "a"'s own Base Lemma Canonical Form correctly
comes out as the bare lemma "a", not its own Vowel-Sound Form "an".

`AuxiliarySeeder` was checked too, as the other closed class seeded
outside the ordinary `loadCache()` loop -- `WORD_FORM_MATRIX`'s own
`BASE_LEMMA_CANONICAL_FORM` row's `appliesTo` set deliberately excludes
AUXILIARY, so it has nothing to fix here; the gap was DETERMINER-only,
exactly as reported.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
181/181 (180 prior + one new test asserting `wordForms.formsOf(the)`
now includes a `BASE_LEMMA_CANONICAL_FORM` WordForm, that it's the
first form registered, that `recogniseDeterminerFormIssues()` still reports no
issues, and that "a"'s own Base Lemma Canonical Form is "a" rather than
"an").

## Removed `data/uuid.ts` -- every fresh-uuid call site now uses `crypto.randomUUID()` directly

Asked directly whether anything still called `data/uuid.ts`'s own
`newUuid()` wrapper (a one-line `crypto.randomUUID()` re-export, the
browser-port stand-in for Python's `uuid.uuid4()`). It did have real
callers -- 8 files, all in the Vocabulary role/ layer -- but every one
of them was already reachable through `Identifier` itself:
`value_objects/data/identifier.ts`'s own `identifier()` already calls
`crypto.randomUUID()` directly to auto-assign `Identifier.uuid`, so
`newUuid()` was a redundant second entry point to the exact same
browser global, not a distinct capability anything actually needed.

Replaced every call site 1:1, no behaviour change:

- The 5 entity `createXxx()` constructors' own `entryId: init.entryId ??
  identifier(newUuid())` (Word/WordForm/Sense/Coordination/Phrase --
  `role/word_processor.ts`, `role/word_form_processor.ts`,
  `role/sense_processor.ts`, `role/coordination_processor.ts`,
  `data/entities/phrase.ts`) -> `identifier(crypto.randomUUID())`.
- Their own `copyXxxWithFreshUuid()` counterparts' `{ ...entryId, uuid:
  newUuid() }` -> `{ ...entryId, uuid: crypto.randomUUID() }`, same five
  files, plus `Phrase.toSyntheticWord()`'s own identical inline copy.
- The 3 relationship processors' own `const relationshipUuid = newUuid()`
  (`role/lexical_relationship_processor.ts`, `role/morphological_pointer_relationship_processor.ts`,
  `role/semantic_relationship_processor.ts`) -> `crypto.randomUUID()`
  directly -- these three don't build a real `Identifier` via
  `identifier()` at all (their own `uuid` field is a bare `{ value }`
  literal), a separate, narrower gap than this change's own scope
  (confirmed with the user directly: only the 5 constructors' own
  double-random-uuid-at-creation question was in scope here, not this
  one) -- left otherwise untouched, just pointed at the same browser
  global instead of the retired wrapper.

`newUuid` imports removed from all 8 files; `data/uuid.ts` itself
deleted once nothing referenced it any more (confirmed via a
repository-wide grep for `newUuid`/`data/uuid` turning up nothing else,
this log's own historical entries aside).

## `MeronymKind`: string union -> numeric enum, `data/enums/`

Asked directly, after reporting a real-WordNet-seeded table of every
`AttributeValue` name/value pair the codebase produces (only one name
exists at all, `"meronymKind"`, always one of three values): make
`MeronymKind` a real enum, alongside every other closed classification
in `data/enums/`. It had been a bare string union
(`"part" | "member" | "substance"`, `data/enums/lexical_relationship_type.ts`)
-- the one exception to this codebase's own established rule that a
closed, small, internal-only classification is a numeric `enum`
(`WordFormField`'s own conversion, this log's own section on it, is the
direct precedent for the exact split applied here).

`MeronymKind` itself only ever needs to move through internal code
(`relationshipKindForPointer()`'s own return value, threaded through
`seedPointerRelationship()`/`copySemanticRelationship()`/`copyLexicalRelationship()`) --
it becomes a string again only at the one point it actually leaves that
internal path: `AttributeValue.value` is a `Text` (string-typed, by that
type's own generic "any qualifier" contract, `data/attribute_value.ts`),
so the numeric enum member has to render to its real lowercase spelling
somewhere. New `meronymKindLabel()` does exactly that --
`wordFormFieldLabel()`'s own identical shape (a `Record<Enum, string>`
lookup table, one function reading it) -- called at the single
`AttributeValue` construction site (`WordSeeder.seedPointerRelationship()`)
instead of relying on the enum member's own text being the union
value it used to be.

`MERONYM_KIND_QUALIFIER` (the qualifier's own `name`, always literally
`"meronymKind"`) is unaffected -- it was never part of the union this
converts, just a sibling constant.

`SemanticMeronymKind`/`SEMANTIC_MERONYM_KIND_QUALIFIER`
(`data/enums/semantic_relationship_kind.ts`) were deliberately left
untouched -- a duplicate-shaped declaration of the identical
`"part" | "member" | "substance"` union under a different name, but
never actually referenced by any real qualifier-construction code
(only `MeronymKind`/`MERONYM_KIND_QUALIFIER`, from
`lexical_relationship_type.ts`, are); out of this request's own named
scope (`MeronymKind` specifically), and a separate, pre-existing
duplication this didn't introduce.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
181/181, unchanged -- `meronymKindLabel()` reproduces the exact same
`"part"`/`"member"`/`"substance"` strings the union literals used to be,
so the existing real-WordNet-seeded assertion on those exact strings
(`vocabulary.test.ts`'s own MERONYM-qualifier test) needed no change at
all, and none of the six `relationshipKindForPointer()` call sites
change behaviour, only which literal (`MeronymKind.PART` vs `"part"`)
they write.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
181/181, unchanged -- this is a pure call-site substitution (same
underlying `crypto.randomUUID()` either way), not a behavioural change,
so no test needed updating or adding.

## `AttributeValue`/`qualifiers` collapsed into a direct `meronymKind` field, `data/attribute_value.ts` deleted

Follow-up to the `MeronymKind` -> `MeronymKindEnum` conversion above.
Asked to rename `AttributeValue` -- a fully generic `{name: Text, value:
Text}` qualifier struct, attached as `qualifiers: readonly
AttributeValue[]` to all three relationship kinds
(`LexicalRelationship`/`MorphologicalPointerRelationship`/`SemanticRelationship`),
speced (Vocabulary Layer developer specification 7.3) as an open-ended
"attach any future typed qualifier" extensibility point. Flagged before
acting: the requested new name (`SemanticMeronymKind`) both mis-describes
a type used across all three relationship kinds (not semantic-specific)
and collides with the *other*, separate, pre-existing
`SemanticMeronymKind`/`SEMANTIC_MERONYM_KIND_QUALIFIER` duplicate this
same log's own previous section had already flagged as unused. Resolved
by recommendation, then implementing exactly what the user actually
wanted once clarified: since a real-WordNet-seed tally (this log's own
prior "make a table" request) had already shown `qualifiers` never
carries more than one real fact in this entire codebase -- the
`meronymKind` qualifier, nothing else, ever -- the generic array-of-
qualifiers mechanism was pure indirection for a single always-present-
or-absent fact. Collapsed it to a direct field instead of renaming the
generic type at all.

- `LexicalRelationship`/`MorphologicalPointerRelationship`/`SemanticRelationship`'s
  own `qualifiers: readonly AttributeValue[]` -> `meronymKind?: MeronymKindEnum`,
  a single optional field, directly typed, no `Text` boxing.
- `data/attribute_value.ts` deleted outright -- nothing constructs an
  `AttributeValue` any more anywhere in the codebase.
- `MERONYM_KIND_QUALIFIER` (`"meronymKind"` string constant,
  `lexical_relationship_type.ts`) deleted -- it only ever existed to
  name the one qualifier a caller had to string-match for; a real field
  name doesn't need one.
- The *other* pre-existing duplicate, `SemanticMeronymKind`/
  `SEMANTIC_MERONYM_KIND_QUALIFIER` (`data/enums/semantic_relationship_kind.ts`),
  deleted too -- this is what actually resolves the collision the
  requested rename ran into: nothing is left named `SemanticMeronymKind`
  anywhere afterward. (Its own `SEMANTIC_MERONYM_KIND_QUALIFIER`
  constant turned out to have one real caller after all,
  `builder_relationship.ts`'s own qualifier lookup -- corrected an
  earlier, wrong "fully unused" read of it from this log's prior
  section; folded onto the single `meronymKindLabel()` call the direct
  field now uses instead.)
- The 3 relationship processors' own `create()` options: `qualifiers?:
  readonly AttributeValue[]` -> `meronymKind?: MeronymKindEnum`, passed
  straight through instead of defaulted to `[]`.
- `word_seeder.ts`: the local `qualifiers` array built once in
  `seedPointerRelationship()` and threaded through
  `copySemanticRelationship()`/`copyLexicalRelationship()`/`createEdges()`
  is gone -- each now takes `meronymKind: MeronymKindEnum | undefined`
  directly and passes `resolved.meronymKind` straight through, no
  intermediate array-wrapping or `meronymKindLabel()` call needed at
  construction time any more (the enum member is stored as-is; only a
  *reader* that wants the human spelling calls that function now).
  `MERONYM_KIND_QUALIFIER`/`AttributeValue` imports removed.
- `ui/server/builder_lexical_relationship.ts` and
  `ui/server/builder_relationship.ts`: `rel.qualifiers.find((q) =>
  q.name.value === X)?.value.value ?? null` -> `rel.meronymKind !==
  undefined ? meronymKindLabel(rel.meronymKind) : null` -- same output
  shape (`qualifier: string | null`) client code already consumes,
  simpler to read, and compiler-checked against a real enum instead of
  a string literal.

Deliberate trade-off, stated to the user before implementing: this
narrows the data model from "a relationship can carry any future
qualifier" (the original spec's own intent) to "a relationship can
carry *only* a meronym kind." A second qualifier, if one is ever
needed, means adding another named field, not extending an array. Given
`qualifiers` has never carried a second kind of fact across this
codebase's entire seeded dataset, accepted as a good trade for the
simplification -- but recorded here since it's a genuine narrowing, not
a pure refactor.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
181/181 -- the one test that read `.qualifiers` directly (`vocabulary.test.ts`'s
own MERONYM test) now reads `.meronymKind` and compares against
`MeronymKindEnum` members instead of raw strings; nothing else changed,
confirming this really is a pure representational collapse, not a
behavioural one.

## `WordFormField` renamed to `WordFormType`

Asked directly: rename `WordFormField` -> `WordFormType` (the enum
itself, `data/enums/word_forms_enum.ts`). A pure identifier rename
across all 21 files that reference it -- `wordFormFieldLabel()` ->
`wordFormTypeLabel()` and its own backing `WORD_FORM_FIELD_LABELS` ->
`WORD_FORM_TYPE_LABELS` renamed alongside it (both embed the enum's own
name, so left un-renamed they'd read as if they still referred to a
type called `WordFormField`). `WordForm.field`, the property this enum
is the type of, was deliberately left as `field` -- the user's own
request named the enum/type itself, not that property, and
`field`/`WordFormType` (a field typed by a WordFormType) reads no
worse than `field`/`WordFormField` did.

Mechanical: `WordFormField` (and its two derived names above) replaced
1:1 wherever they appeared -- enum declaration, every `WordFormField.X`
member access, every `field: WordFormField`/`WordFormField | undefined`
type position, every import/export, and every docstring/comment
mentioning it by name. `git diff --stat` confirms it: 458
insertions/458 deletions across 21 files, a perfectly balanced rename
with no other line touched.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
181/181, unchanged -- pure identifier rename, no runtime behaviour or
data shape affected.

## `WordForm.field` renamed to `WordForm.formType`

Follow-up to the `WordFormField` -> `WordFormType` enum rename above:
asked to rename the entity property itself, `WordForm.field: WordFormType`,
to `formType`. Scoped narrowly to the real `WordForm` entity (`data/entities/word_form.ts`)
and every direct construction/read of it -- `WordFormInit`
(`role/word_form_processor.ts`, `Pick<WordForm, "field" | ...>` ->
`"formType"`), `WordForms.findNamedForm()`/`registerNamedForm()`
(`data/word_forms.ts`, both their own `field` parameter and internal
`form.field` reads renamed to `formType`, since these are the core
Vocabulary Layer API real callers interact with directly), every POS
processor's own `recogniseFormTextIssue(form.field, ...)`/`stringPatternsFor(form.field,
...)` call (all seven `role/processor/*_processor.ts` files),
`word_seeder.ts`'s `hasBothDegreeForms()`, `part_of_speech_identifier.ts`'s
inflected-form fallback, `auxiliary_seeder.ts`'s direct `createWordForm()`
call, and every real-`WordForm`-instance read in `vocabulary.test.ts`.

Deliberately **not** renamed -- separate type declarations that happen
to share the name `field` for their own, independent reasons, not
forced to change just because the source `WordForm` property did:

- `WordFormRow.field` (`data/matrices/pos_vs_wordform_matrice.ts`) --
  a Word Form Matrix row's own classification, a different type.
- `WordFormEntry.field` (`ui/server/builder_word.ts`) and the inline
  `word_form: {field, label, value}` shape (`ui/server/builder_segment.ts`) --
  client-facing JSON output shapes, `builder_word.ts`'s own docstring
  already documenting `field` there as deliberately independent of
  `WordForm`'s own naming.
- `WordFormIssue.field` (`role/word_processor.ts`) -- a validation
  issue's own shape.
- Every client-side (`ui/client/*.ts`) `form.field`/`byField` access --
  these read the JSON shapes above, never a real `WordForm` (client
  code never sees one -- structured-clone/postMessage only ever carries
  the plain JSON records `builder_word.ts`/`builder_segment.ts` build).
- `AuxiliaryFormSeed.field`/`DeterminerFormSeed.field` (`role/auxiliary_seeder.ts`,
  `role/determiner_seeder.ts`) -- each seeder's own local, hand-authored
  seed-data shape, read at its own call sites (`formSeed.field`) and
  passed *into* `registerNamedForm()`/`createWordForm()`'s now-renamed
  parameter/property, not renamed themselves.

Every one of those call sites that copies a value *from* a real
`WordForm.formType` *into* one of these separately-named shapes was
still updated (e.g. `builder_word.ts`'s `field: form.field` ->
`field: form.formType` -- the output key `field` is unchanged, only the
source read is).

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
181/181, unchanged -- pure identifier rename, no runtime behaviour or
data shape affected.

## Two token-resolution gaps, uncovered while verifying the Linguistics Layer's clause-embedding work

Both found empirically, running the real bundled WordNet + closed-class
seed through `LinguisticController.readSentence()` (not a hand-seeded
stand-in) against the two reported sentences from this session's own
"Four grammar-template gaps" paragraph
(linguistics/documentation/architecture/data_entity_design_decisions_log.md) --
neither is really about clause embedding itself, but each independently
blocked one of the two sentences from resolving correctly, so both were
root-caused and fixed here before that feature could be verified.

**Gap 1 -- `recogniseFinalConsonantDoublingStrategy()`'s own "abstain" case was
correct but too broad.** "Did what happened yesterday surprise you?"
read `UNRESOLVED`: `"happened" has no seeded or hydrated part of speech
yet`. Traced to `generatedVerbForms()` -> `createRegularEdForm("happen")` ->
`recogniseFinalConsonantDoublingStrategy("happen")`: "happen" ends
consonant-vowel-consonant but isn't monosyllabic, so the function
correctly abstains rather than guess whether it doubles ("occur" ->
"occurred" does, "happen" -> "happened" doesn't, identical spelling
test, genuinely different stress) -- but `createRegularEdForm` treats "abstain"
as "generate nothing at all", so "happen" (a hugely common, everyday
regular verb) never got a past-tense WordForm registered, period.

Enumerating every real bundled WordNet VERB lemma this abstain branch
actually reaches: **1,007** lemmas. Far too many to classify by hand with
confidence -- and a real, large subset of them (`cancel`/`travel`/
`label`/`model`/`signal`/`level`/`quarrel`/`marvel`/`channel`/`tunnel`/
`barrel`/...) are the well-known British-doubles ("cancelled")/American-
doesn't ("canceled") dialectal spelling class, which this generator has
no dialect parameter to resolve either way -- hardcoding one spelling
would just trade a gap for a wrong answer. So the fix stays narrow: a new
`NON_DOUBLING_MULTISYLLABLE_VERBS` closed set in `role/word_processor.ts`
(23 hand-verified, non-dialectal, unambiguously first-syllable-stressed
common verbs -- "happen", "open", "enter", "answer", "offer", "suffer",
"gather", "listen", "differ", "wonder", "murder", "order", "cover",
"discover", "remember", "consider", "deliver", "visit", "limit",
"profit", "benefit", "develop", "gossip"), checked by
`recogniseFinalConsonantDoublingStrategy()` before it abstains -- the same "closed,
well-known set... not an open curation project" reasoning
`IRREGULAR_VERB_FORMS` (verb_processor.ts) already gives for a different
problem (irregular spelling, not stress), applied here for stress. Every
other lemma among the 1,007 (including every "-el" dialectal one) still
abstains exactly as before -- this is a carve-out of the false-positive
sliver that could be resolved with real confidence, not an attempt at
the rest.

**Gap 2 -- `PartOfSpeechIdentifier.identifySeeded()`'s exact-match
branch hid the inflected fallback outright.** Once Gap 1 was fixed, "Did
what happened yesterday surprise you?" resolved, but "That the door was
unlocked surprised everyone." still only read `VALID` by accident (its
own already-known limitation, this log's "Four grammar-template gaps"
section): `unlocked`/`surprised` each only ever offered `ADJECTIVE` as a
candidate part of speech, never `VERB`, even though both are genuinely,
separately, real WordNet VERB past-participle spellings too (confirmed
directly: `wordForms.lookupByText("surprised")` finds both `VERB:surprise`
(past tense + past participle) and `ADJECTIVE:surprised` (its own real,
independent WordNet lemma) -- but `dictionary.lookupAll("surprised")`
finds only the ADJECTIVE, since that Word's own canonical spelling is
the exact match, while the VERB's canonical spelling is "surprise", not
"surprised"). `identifySeeded()`'s own logic used to be "an exact
`lookupAll()` match always wins outright -- only once that comes back
*empty* does this fall back to `WordForms.lookupByText()`" -- so once the
ADJECTIVE's own exact match was found, the VERB's inflected spelling was
never even queried, let alone offered as a second candidate. This is the
single choke point both `DictionaryProcessor.identifyWord` and
`identifyPhrase` call for every span they try, so this silently starved
every caller in the whole system of the VERB reading for any spelling
hitting this same real, common English pattern (a participial adjective
sharing its exact spelling with a different Word's own inflected verb
form -- "excited", "interested", "confused", "tired", "worried", ...
alongside "surprised"/"unlocked").

Fixed by always gathering *both* candidate sources and merging them
(deduplicated by Word, so a Word's own base-lemma WordForm spelling
never double-counts against its own already-found exact match) rather
than one-or-the-other -- `inflectedConfidence()`'s own docstring already
says it's "below every possible `seededConfidence()` value... an exact
match must always outrank an inflected one when both exist for the same
occurrence", which only makes sense as a real ranking rule if both are
ever actually candidates together; the early-return silently prevented
that from ever happening. One existing test
(`PartOfSpeechIdentifier / DictionaryProcessor: inflected-form fallback`,
vocabulary.test.ts) asserted the old, narrower behavior outright ("run"
never appears once an exact match exists for "ran") -- updated to assert
the corrected one instead (the exact match still ranks first; the
inflected candidate is no longer hidden).

`npx tsc -b --force` clean both times. Full `vitest run
--no-file-parallelism`: 182/182 after Gap 1 (0 regressions across the
whole WordNet-scale suite), 182/182 again after Gap 2 (1 test updated to
match the corrected behavior, as above; every other WordNet-scale test
-- ranking, phrase reconstruction, hierarchy resolution -- unaffected,
despite this being the single choke point for all identification).

## Move `infinitive_phrase.ts` into `data/entities/`

The one Phrase subtype still sitting in `data/` directly -- its five
siblings (NounPhrase, VerbPhrase, AdjectivePhrase, AdverbPhrase,
PrepositionalPhrase) already moved there earlier this session
("Move `prepositional_phrase.ts` into `data/entities/`" above), leaving
`infinitive_phrase.ts` the only inconsistent one. Pure relocation --
`git mv`, its own two internal imports re-pointed the same way every
other `data/entities/*_phrase.ts` file already points (`../enums/phrase_type`,
`./phrase`), and the three external references (`role/word_seeder.ts`'s
own import, a docstring mention each in `role/processor/phrase_processor.ts`
and `vocabulary.test.ts`) updated to the new path. No behavior change.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
186/186, unchanged.

## `WordForm.contractionOf`'s target: `Word`/`WordForm`, not `Phrase`

Reported as a possible design error against the entities class-model
diagram (see the diagram artifact's own "WordForm" panel): should
`contractionOf` point at a `Phrase` -- "can't" as a contraction of the
phrase "can not" -- instead of two `Word`/`WordForm` identifiers? Scanned
the real seeded data and the grammar before answering.

**What was actually seeded, before this work**: nothing. AuxiliarySeeder's
own `AUXILIARY_LEMMAS` comment (role/auxiliary_seeder.ts) already named the
gap outright: the 7 full contractions the old, retired `auxiliaries.json`
used to carry (don't, can't, I'm, it's, isn't, wasn't, hadn't) "still have
no lemma-model equivalent" -- none existed as a Word at all.
`relationships/orthographic_relationships.json` (the CONTRACTION cache) was
empty (`count: 0`). And the negator itself was broken: `PartOfSpeech.PARTICLE`'s
retirement (assets/common/en/README.md's own `particles.json` row) left
"not" resolving only to an unrelated WordNet VERB homograph, and "n't"
with no Dictionary entry at all.

**The grammar question**: neither of this family's two real syntactic
shapes fits any `Phrase` this codebase's own `PhraseType` can express.
Split by shape (Huddleston, Pullum & Reynolds, *A Student's Introduction
to English Grammar* -- this codebase's own cited grammar reference,
`data/entities/coordination.ts`):
- **Auxiliary + Negator** (don't, can't, isn't, wasn't, hadn't) -- "not" is
  a dependent of the auxiliary marking clause polarity, not a phrase of
  its own. Checked `PHRASE_TYPE_DETAILS[VERB_PHRASE]`
  (data/enums/phrase_type.ts) directly: its own Head Identification Rule
  is `[ModifierRole.HEAD]: ["Verb"]` -- an `Auxiliary` can never head a
  `VerbPhrase` in this grammar, with or without a main verb present. And
  `ModifierRole` (data/enums/modifier_role.ts) has no role "not" could
  take either -- not HEAD, MODIFIER (a modifier qualifies the head the way
  "quickly" qualifies "runs"; "not" doesn't qualify "can" that way),
  PARTICLE (reserved for a phrasal verb's own non-head component), or
  COMPLEMENT.
- **Subject Pronoun + finite Auxiliary** (I'm, it's) -- "I am"/"it is" is a
  subject and its predicator, the seed of a `Clause`
  (linguistics/data/clause.ts), never a `Phrase`, in any theory of
  grammar.

So "point `contractionOf` at the correctly seeded phrase" has no single
answer -- the two groups aren't the same *kind* of thing. A `Clause`
target for the second group was considered and rejected: this codebase
has no persisted, addressable Clause store anywhere (unlike
Dictionary/Phrases/Senses/WordForms) -- a `Clause` is built fresh per
sentence read by `ClauseReader`, never seeded -- so inventing Clause
persistence from nothing, for 2 contractions, would be disproportionate.

**What shipped**: `contractionOf` keeps pointing at the honest thing that
already exists for each component -- a `Word` Identifier for a bare
closed-class lemma (do/can/not/n't/I/it), or a `WordForm` Identifier for a
specific inflected spelling that is *not* independently addressable under
this codebase's own lemma+WordForm model (is/was/had/am, each a WordForm
of the "be"/"have" lemma -- an "isn't"->"be" pointer alone couldn't
distinguish 3rd-singular "is" from "was"/"were"/"am"/"are", the exact fact
this field exists to preserve). `WordForm.contractionOf`'s own docstring
(data/entities/word_form.ts) rewritten to describe this split.

New `role/contraction_seeder.ts` (`ContractionSeeder`, called from
`WordSeeder.seedClosedClassWords()` right after its own `loadCache()` loop
-- needs "I"/"it", pronouns.json entries, and "be"/"have"'s own WordForms
already resolvable, unlike AuxiliarySeeder/DeterminerSeeder which run
before `loadCache()`):
- Seeds "not" (ADVERB, real negator definition) and "n't" (ADVERB) -- Step
  0, blocking: nothing downstream can point at a correct negator without
  this. "n't" is itself modelled as a one-component contraction of "not"
  (`contractionOf: [not]`) -- not a separate lexeme, recreating the
  historical `not -> n't CONTRACTION` relationship
  assets/common/en/README.md documents as existing before the retirement,
  and doubling as a real one-component example of `contractionOf`'s own
  many-to-many shape (not always a pair).
- Seeds the 7 full-contraction AUXILIARY lemmas (each single-spelling and
  invariant, the same shape must/ought/need/dare already have), with
  `contractionOf` set directly at seed time rather than through
  `RelationshipSeeder`'s generic cache-driven CONTRACTION pipeline
  (role/relationship_seeder.ts) -- that pipeline is Word-to-Word only and
  predates this session's own lemma+WordForm consolidation (Phase 1-6),
  and these are fixed structural facts about English orthography, not
  curated cache data that varies, AuxiliarySeeder's own "data this seeder
  authors directly" precedent.

**A real UI bug this surfaced**: `morphologicalDerivations()`
(ui/server/builder_word.ts) resolved every derivation pointer -- including
`contractionOf` -- against `Dictionary.findByUuid()` only, silently
dropping any pointer that failed to resolve there (its own docstring:
"an unresolved pointer would mean something else went wrong"). True for
every other derivation field (isNominalised and its siblings always point
at a Word), but no longer true for `contractionOf` now that some of its
own entries are `WordForm` Identifiers -- "isn't" would have shown only
"n't" in its own Word Forms panel, silently dropping "is". Fixed: tries
`Dictionary.findByUuid()` first, falls back to `WordForms.findByUuid()` on
a miss, rendering that WordForm's own spelling as the target text.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
188/188 (2 new tests: `ContractionSeeder` itself, real-seeded, asserting
every one of the 9 new Words' own `contractionOf` resolves to the correct
mix of Word/WordForm identifiers and stays stable across a re-seed; and
`morphologicalDerivations()`'s own WordForm-fallback fix, exercised
through the real `DictionaryView.searchWords()` path).

## Rename `WordForm.entryId` to `WordForm.wordFormId`

`entryId` was the one identity field name every entity in this folder
shared verbatim (Word, Phrase, Sense, Coordination, WordForm all called
theirs `entryId`) -- harmless when each type is read in isolation, but the
Vocabulary layer's own graph-reference architecture means a caller
routinely holds an `Identifier` resolved from one of several possible
source types at once (`WordForm.contractionOf`'s own docstring above is
the freshest example: an entry may resolve against either `Dictionary` or
`WordForms`), and `entryId` alone gives no hint which. Renamed only
`WordForm`'s own field to `wordFormId` -- Word/Phrase/Sense/Coordination
keep `entryId` unchanged; this was requested and scoped to WordForm alone,
not a blanket rename across every entity in this folder.

Every real call site found by tracing actual field access (not a blind
text search across `entryId`, which also matches every other entity's own
identical field name): `data/entities/word_form.ts`'s own declaration,
`role/word_form_processor.ts`'s three functions (`createWordForm()`,
`createFreshUuidWordFormCopy()`, `graphUuid()`), one direct field read each
in `role/word_coordination_seeder.ts` (`coordinatorForm.wordFormId.uuid`)
and `vocabulary.test.ts` (`andForm.wordFormId.uuid`) -- both resolving a
`WordForm` via `WordForms.baseLemmaFormOf()`/`registerBaseLemmaForm()` to
build a `Coordination.coordinator` pointer. Every other file that touches a
WordForm's identity goes through `graphUuid(form)`
(role/word_form_processor.ts) rather than reading `.entryId`/`.wordFormId`
directly, so needed no change at all -- confirmed by a clean
`npx tsc -b --force` immediately after the rename (a stale `.entryId`
access on a `WordForm`-typed value would have been a type error, not a
silent miss).

Also fixed two pre-existing, unrelated test timeouts surfaced while
re-running the full suite after this rename: the two slow real-WordNet-seed
`ClauseReader` clause-embedding tests (`linguistics.test.ts`, added earlier
this session) had no explicit `it()` timeout, so the first caller paying
`seededWordNetController()`'s own real ~20-30s seeding cost occasionally
exceeded Vitest's 5000ms default -- both now pass `60000` explicitly, the
same precedent already used elsewhere in this suite for other slow
real-seeding tests. Unrelated to the `entryId` rename itself, but blocked a
clean "all green" verification of it.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
188/188.

## Remove InfinitivePhrase

Requested outright ("Remove Infinitive_phrase.ts"), then scoped via a
follow-up question once tracing usage showed this touches 16 files across
both layers and changes real classification/parsing behaviour, not just
deleting one quiet file -- user chose full removal: the enum value,
`recogniseLemmaPhraseType()`'s own detection logic, the Linguistics grammar/
sequencing machinery that read it, and the UI, not just the file and a
minimal compile fix.

**Vocabulary layer.** `data/entities/infinitive_phrase.ts` deleted.
`PhraseType.INFINITIVE_PHRASE` removed from the enum (it was the last
value, `= 5`, so no other member needed renumbering) and its
`PHRASE_TYPE_DETAILS` entry dropped. `recogniseLemmaPhraseType()`'s own "to" +
real-verb-lemma detection (`role/processor/phrase_processor.ts`) removed
entirely, along with `INFINITIVE_LOOKALIKE_DENYLIST` and the `verbLemmas`
parameter it threaded through `word_seeder.ts` -- both now dead, since
"to" is already one of `PHRASE_TYPE_PREPOSITIONS`' own closed set, so
every genuine WordNet infinitive ("to be sure", "to begin with") now
lands on the *existing* PREPOSITIONAL_PHRASE check instead, the identical
path the three former denylist entries ("to date"/"to boot"/"to
advantage") already took. Verified this is the actual real-seeded
outcome, not just the pure-function unit test's prediction: live
Playwright, after a real `seedWordNet()`, "to be sure" now resolves
`Adverb -> Prepositional Phrase`, was `Adverb -> Infinitive Phrase`.
`recogniseModifierRoles()`'s own INFINITIVE_PHRASE branch (Head
Identification Rule: "to" always PARTICLE, Head is the first Verb-capable
token after it) removed along with it -- `identifyHeadTargetPartsOfSpeech()`'s own
matching case too. `word_seeder.ts`'s `nounLemmas` precompute (still
needed, `isDeterminerPhrase()`'s own unrelated check) simplified
back to a NOUN-only loop now that `verbLemmas` has no reader left.

**Linguistics layer.** `data/phrase_type.ts` (the mirrored enum,
"kept numerically identical on purpose" with Vocabulary's own) loses the
same value the same way. `role/grammar_configurator.ts`'s own
`grammars.set(PhraseType.INFINITIVE_PHRASE, ...)` entry removed --
this was the *only* PhraseGrammar with non-empty `markerForms`/
`markerNextStates`/`markerObligation` (the "lexically-anchored phrase
marker, not a POS state" mechanism those three fields existed solely to
support), so removing it left that whole mechanism permanently dead
everywhere else it was threaded: `PhraseGrammar`'s own three fields,
`SequenceStep.isMarker` and `TraceToken.isMarker` (both copies --
`role/phrase_reader.ts`'s own and `role/web_worker/linguistics_worker_protocol.ts`'s
independently-declared mirror), `SequenceEngine.findMarkerSequences()`,
and every `if (...markerForms.size > 0)` branch in
`grammar_configurator.ts`'s own `validateAgainstVocabulary()` and
`phrase_reader.ts`'s own `materialiseStep()`/`selectHead()`/
`positionTrace()` -- all removed rather than left as permanently-dead
code paths, `sentence_reader_view.ts`'s own trace-token rendering
simplified to match (no more MARKER-labelled chip).

Three enum members this mechanism used to raise/emit --
`LinguisticScope.INFINITIVE_PHRASE`, `ObligationKind.INFINITIVE_MARKER_REQUIRES_BASE_VERB`,
`ReadingErrorKind.INFINITIVE_MISSING_VERB` -- were deliberately **not**
deleted or renumbered: all three are documented, spec-anchored, numeric
tensor codes (each own docstring says so directly), sitting in the middle
of their own enum, with real, still-active members after them
(RELATIVE_CLAUSE/COORDINATION/..., CONJUNCTION_REQUIRES_COORDINATED_ELEMENT,
NO_VALID_CLAUSE_SEQUENCE/...). Renumbering to close the gap would silently
change what every later value means; deleting would leave a hole a future
reader has no way to distinguish from a typo. Left in place, each with an
updated comment explaining it's the *inverse* of this same file's own
existing "Phase 2, not yet raised" convention -- not "not yet", but "no
longer", the feature that used to raise/emit it now gone.
`buildObligationDischarges()`'s own row for
`INFINITIVE_MARKER_REQUIRES_BASE_VERB` kept too (every ObligationKind
member needs one, `validateAgainstVocabulary()`'s own check), its discharge
set emptied to `new Set()` to match every other never-raised row's own
convention.

Verified real, not just type-checked: `npx tsc -b --force` clean confirmed
every `.markerForms`/`.isMarker` access was actually reachable via the
type system (a stale access would have been a compile error, not a silent
miss); full `vitest run --no-file-parallelism` 187/187 (one test removed
-- it existed specifically to demonstrate INFINITIVE_PHRASE recognition,
nothing left to demonstrate; the "does not mistake 'to' + a non-verb..."
test repurposed into asserting every case, denylisted or not, now lands on
PREPOSITIONAL_PHRASE uniformly); live Playwright against the real running
app, full `Load WordNet` (92,314 words, 70,928 phrases), confirmed no
crash and the real reclassification above.

## Rename `Phrase.entryId` to `Phrase.phraseId`

Requested directly, scoped to `Phrase` alone -- the same "one entity's own
field, not a blanket rename across every entity sharing the name" scope
the immediately preceding `WordForm.entryId` -> `wordFormId` rename above
was given. `entryId` was still the shared name Word/Phrase/Sense/
Coordination all carried after that rename; this narrows it further,
leaving Word/Sense/Coordination's own `entryId` untouched.

Every real call site found by tracing actual field access (not a blind
text search across `entryId`, which also matches the same field name on
three other entities, several `Map<string, ...>` caches in
`word_seeder.ts` keyed by the *raw* `WordFileEntry.entry_id` JSON string
rather than any entity's own field, and `FormLink`'s own Word-only
`baseEntryId`/`formEntryId`, all deliberately left alone):
`data/entities/phrase.ts`'s own field declaration, `createPhrase()`,
`copyPhraseWithFreshUuid()`, `graphUuid()`; `toSyntheticWord()`/
`phraseAsWord()` in the same file still write Word's own `entryId:` key
(unchanged) but now read its value from `phrase.phraseId` rather than
`phrase.entryId`, since they're populating a *different* entity's
identically-named field, not this one; `word_seeder.ts`'s own
`entryToPhrase()` (the actual `createPhrase({ phraseId: ... })` call site)
and the two `phrase.phraseId.value` cache lookups in
`seedClosedClassWords()`; `builder_phrase.ts`'s own `phraseRecordFor()`
(`entry_id: phrase.phraseId.value` -- `PhraseRecord.entry_id`, the
client-facing JSON key, stays `entry_id` unchanged, same as
`WordRecord.entry_id` did across the WordForm rename: only the internal
TypeScript field name changed, not the wire shape); five identical
`"entryId" in <embedded Phrase>` type-narrowing checks across
`vocabulary.test.ts` (complement/preModifier assertions) and one in
`builder_phrase.ts`'s own `phraseComplementSegments()`, all now
`"phraseId" in ...`.

Two real, behaviour-affecting fixes this rename forced, not just renamed
field reads -- found by tracing every place something duck-typed *across*
Word and Phrase using the field name they used to share, not just places
reading `Phrase.entryId` directly:

- `phrase_processor.ts`'s own `createStoredModifierCoordination()` (the
  dedup lookup a coordinated modifier run like "big and red" goes
  through, `createModifierRunValue()`'s own call site) cast each coordinate to
  `{ entryId: Identifier }` and compared `.entryId.uuid` -- safe before
  this rename, since Word and Phrase genuinely shared that field name;
  after it, a real Phrase coordinate has no `.entryId` at all, so the old
  cast would have silently read `undefined.uuid` and thrown. Fixed by
  adding a small `coordinateGraphUuid()` helper (`"phraseId" in entry ?
  phraseGraphUuid(entry) : wordGraphUuid(entry)`, the same
  `memberUuid()`/`endpointUuid()` discriminator shape already used
  elsewhere in this codebase) and importing Phrase's own `graphUuid` the
  same aliased-import way `builder_word.ts`/`builder_relationship.ts`/
  `data/senses.ts` already do.
- `builder_phrase.ts`'s own `modifierUnitSegment()` (renders
  `preModifier`/`postModifier`/`determiner`) discriminated its
  `Identifier | Phrase | Coordination<Word | Phrase> | Clause` union with
  one up-front `"entryId" in value` check -- before this rename, that
  check happened to cleanly bucket {Phrase, Coordination} (both carried
  `entryId`) apart from {Identifier, Clause} (neither did); after it,
  Phrase no longer belongs in the first bucket, so a real embedded Phrase
  modifier would have wrongly fallen into the Identifier/Clause branch
  and silently resolved to `undefined`, dropping a real modifier from the
  UI with no error. Restructured to check `"text" in value` first
  (Phrase and Clause both have it, Identifier and Coordination don't),
  then `"phraseId" in value` within that half (Phrase vs. Clause) and
  `"value" in value` within the other (Identifier vs. Coordination) --
  same four-way outcome, just discriminated on each shape's own field
  now that Phrase and Coordination no longer share one.

Four duplicate copies of the same `memberUuid()` docstring (`data/senses.ts`,
`word_seeder.ts`, `builder_relationship.ts`, `builder_word.ts` -- each an
independently-declared function body, this codebase's established
"no cross-importing UI/role helpers" precedent) said "Phrase's own
entryId now carries the identical two-role shape Word's own does";
updated to say `phraseId` instead. Their function bodies needed no change
-- all four already called through the exported `graphUuid()` functions
rather than reading `.entryId`/`.phraseId` directly.

`npx tsc -b --force` clean -- confirms every real field-access call site
above, not just the ones grep happened to find, since a stale
`.entryId` read on a `Phrase`-typed value is a compile error now, not a
silent `undefined`. Full `vitest run --no-file-parallelism` 187/187 (no
test behaviour changed, only the "entryId"/"phraseId" narrowing key five
tests use). Live Playwright against the real running app, full `Load
WordNet` (92,314 words, 70,928 phrases, 175,513 relationships, 85
hand-curated Word Coordinations) -- confirmed no crash across real
`entryToPhrase()`/`updatePhraseWordLinks()`/`createStoredModifierCoordination()`
construction of every one of those 70,928 Phrases, which would have
thrown immediately had the `coordinateGraphUuid()` fix above been wrong.

## Rename `Word.entryId` to `Word.wordId`, `Sense.entryId` to `Sense.senseId`

Requested directly, both in one turn: two more of the four entities that
used to share the one `entryId` field name, narrowed the same way the
two renames above already were -- `Word`'s own field becomes `wordId`,
`Sense`'s own becomes `senseId`, `Coordination` keeps `entryId`
unchanged (nothing asked it to change, and nothing else in this folder
still shares a name with it now).

Traced exhaustively before editing anything (two parallel research
passes, one per entity, each tracing every real `entryId` occurrence in
the codebase and classifying it: direct field access, generic/duck-typed
code touching `.entryId` across a union, raw-JSON/cache keys that only
coincidentally share the name, comments, and client-facing `entry_id`
wire keys) -- the same discipline the two renames above already
established, since a blind text search across `entryId` also matches
`WordFileEntry.entry_id` (the raw source JSON field, several
`Map<string, ...>` caches in `word_seeder.ts` keyed by that raw string,
`AuxiliaryLemmaSeed.entryId`/`DeterminerLemmaSeed.entryId`, local
seed-schema fields holding hardcoded UUIDs, never the `Word`/`Sense`
entity's own field) alongside every other entity's identical name.

Real edits: `data/entities/word.ts`/`data/entities/sense.ts`'s own field
declarations and docstrings; `role/word_processor.ts`/`role/sense_processor.ts`'s
`createWord()`/`createSense()`, `createFreshUuidWordCopy()`/
`createFreshUuidSenseCopy()`, `graphUuid()`; `data/entities/phrase.ts`'s
`toSyntheticWord()`/`phraseAsWord()` (both build a *Word* via
`createWord({ entryId: ... })` -- the object-literal key itself had to
become `wordId:` since it's populating Word's own field, independent of
`phrase.phraseId` already feeding its value, unrelated to this rename);
`word_seeder.ts`'s `entryToWord()` construction site and every
`word.wordId.value`/`copy.wordId.value` cache-key read in
`seedClosedClassWords()` (renamed the local `insertedByEntryId` Map to
`insertedByWordId` too, for accuracy -- private variable, no external
contract); `auxiliary_seeder.ts`/`determiner_seeder.ts`'s own
`createAuxiliary({ entryId: ... })`/`createDeterminer({ entryId: ... })`
call sites (their own `AuxiliaryLemmaSeed.entryId`/`DeterminerLemmaSeed.entryId`
seed-schema fields keep that name -- only the object-literal key
populating Word's own field changed); `builder_word.ts`'s
`wordRecordFor()`/`builder_sense.ts`'s `senseRecordFor()` (`WordRecord.entry_id`/
`SenseRecord.entry_id`, the client-facing wire keys, stay `entry_id`
unchanged -- `PhraseRecord.entry_id`'s own identical precedent above --
only the internal `.entryId` read the value comes from changed);
`vocabulary.test.ts`'s Word/Sense-typed assertions and two test titles
naming "entryId" in prose.

One real, behaviour-affecting bug found and fixed alongside the rename,
not just a rename -- the same "generic duck-typed code relying on a
field name two entities used to share" shape `phrase_processor.ts`'s
`createStoredModifierCoordination()` and `builder_phrase.ts`'s
`modifierUnitSegment()` turned out to be during the Phrase rename above,
but latent *before* this rename too, not only introduced by it:
`word_seeder.ts`'s own `endpointUuid()` (dispatches a `Word | Phrase |
Sense` relationship endpoint to the right `graphUuid()` function)
discriminated Sense from Word via `"isRootWord" in endpoint`, on the
strength of its own docstring's claim that `isRootWord` is
"Sense-only... even after root-word status moved onto Noun
specifically". That claim was already false: `createNoun()`
(`role/processor/noun_processor.ts`) defaults *every* Noun's own
`isRootWord` to `false` when unset -- not just the 25 real root words --
so every real Noun, WordNet-seeded or closed-class, carries `isRootWord`
as a genuine own-property. `"isRootWord" in endpoint` was therefore
`true` for the large majority of real Noun relationship endpoints
(essentially every WordNet hypernym/hyponym/meronym pair), silently
misrouting them into `senseGraphUuid(nounEndpoint)` instead of
`wordGraphUuid(nounEndpoint)` -- harmless purely by accident while `Word`
and `Sense` still shared one `entryId` field name and shape (reading
`.entryId.uuid` off a mistyped Noun still returned the correct uuid).
The moment `Word.entryId` became `Word.wordId`, that same call would
have read `undefined.uuid` and thrown -- a real, reachable crash on
essentially every Noun-to-Noun WordNet relationship, immediately on the
next `Load WordNet`.

Fixed by discriminating Word via `"partOfSpeech" in endpoint` instead --
`partOfSpeech: PartOfSpeech` is `Word`'s own required (non-optional)
field (`WordInit = Pick<Word, "text" | "partOfSpeech"> & Partial<...>`,
so every real `Word` genuinely has it), and neither `Phrase` nor `Sense`
ever declares a field by that name -- checked before falling through to
Sense as the final case, the same "positively identify, don't guess"
shape `memberUuid()`'s own `"senseIds" in member` check already uses one
line above it. `endpointUuid()`'s own docstring rewritten to explain
both the new discriminator and why the old one was already wrong, not
just newly broken.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`
187/187 -- this alone exercises `endpointUuid()` against real WordNet
Noun-to-Noun relationship pairs (`seedWordNet()`'s own relationship-graph
tests), so a wrong fix would have failed loudly, not silently. Live
Playwright against the real running app, full `Load WordNet` (92,714
words, 70,928 phrases, 118,423 senses, 144,614 relationships) --
confirmed no crash and no page error building all 144,614 real
relationships, which is exactly the path `endpointUuid()`'s own fix
needed to survive.

## Rename `Coordination.entryId` to `Coordination.coordinationId`

The fourth and last of the four entities that used to share the one
`entryId` field name (Word/Phrase/Sense/Coordination) -- requested
separately, after the three others (WordForm -> wordFormId, Phrase ->
phraseId, Word -> wordId / Sense -> senseId) had already landed.
`entryId` no longer names anything shared with another entity in this
folder now that this one's done; every real identity field in
`data/entities/` is its own entity's own name.

By far the smallest of the four in blast radius -- Coordination has no
UI detail panel of its own (`data/coordinations.ts`'s own docstring:
"no isXCoordination() guard family exists yet, mirroring how
Coordination itself still has no seeder/UI consumer of its own"), and
none of the duck-typed cross-entity discriminators this codebase already
has (`memberUuid()`, `endpointUuid()`, `coordinateGraphUuid()`,
`modifierUnitSegment()`) ever included `Coordination` as one of the
types being distinguished by field name -- confirmed by re-checking each
one specifically for this rename, not assumed from the three prior
renames' own conclusions. No behaviour-affecting bug this time, unlike
the `Word`/`Sense` rename's `endpointUuid()` fix.

Real edits: `data/entities/coordination.ts`'s own field declaration and
docstring; `role/coordination_processor.ts`'s `createCoordination()`,
`createFreshUuidCoordinationCopy()`, `graphUuid()`, and their docstrings;
`role/word_coordination_seeder.ts`'s own `existingEntryValues` dedup
read and its `createCoordination<Word>({ coordinationId: ... })`
construction call (the one real seeder that builds a Coordination
directly, `WordCoordinationSeeder`'s own 85 hand-curated entries);
`vocabulary.test.ts`'s `describe("Coordinations", ...)` block (four
direct field reads, two test titles naming "entryId" in prose).
`createStoredModifierCoordination()` (`phrase_processor.ts`) needed no
change at all -- it never reads `.entryId`/`.coordinationId` directly,
only through the already-generic `createCoordination()`/`coordinations.append()`
calls, and its own `coordinateGraphUuid()` dedup helper (added during
the `Word`/`Sense` rename) discriminates `Word` vs `Phrase` only, never
touching `Coordination`'s own field.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`
187/187, including the `Coordinations` describe block and
`WordCoordinationSeeder`'s own real-seeded test. Live Playwright against
the real running app, full `Load WordNet` -- confirmed no crash and no
page error, with the Coordinations tab rendering all 85 real
hand-curated Word Coordinations (their own coordinator/conjunction-type
columns populated correctly) after a full WordNet seed, the one real
production path that constructs a `Coordination` end to end.

## Add a `Domain` entity; migrate `Word`/`Sense`/`Phrase`'s `domainTag`/`relatedDomainTags` from `Text` to `Identifier`

Requested directly: create `data/entities/domain.ts` with a `Domain`
class carrying `domainId: Identifier`/`domainText: Text`, and change
every entity attribute that referenced a topic domain by embedded text
(`domainTag`, `relatedDomainTags`) to reference it by identifier
instead, resolved against a store, rather than each entity carrying its
own duplicate copy of the same string.

Two decisions were made explicit with the requester before implementing,
both preserved here since a future reader would otherwise reasonably
guess differently:

- **Naming.** `Domain` already names something else entirely in this
  codebase's own Knowledge Layer -- a hosted vocabulary partition like
  "Common"/"Physics" (`knowledge/data/portal_domain.ts`'s own docstring,
  the eventual port target of `knowledge/data/domain.py`; this same
  meaning is what `VocabularyContext`'s own constructor `domainName`
  parameter names, and what every `data_entity_design_decisions_log.md`
  entry above this one means by "Domain" in prose). `DomainTag` was
  offered as a collision-free alternative; the requester chose `Domain`
  as literally requested. The new entity is `Domain`
  (`data/entities/domain.ts`) despite the name already being taken by a
  different concept one layer up -- every docstring on the new type
  spells out the distinction explicitly (dozens of lightweight
  classification tags, each living inside a `Domains` store one specific
  knowledge-Domain owns, vs. a knowledge-Domain itself); nothing in this
  layer references the Knowledge Layer's own `Domain` directly, so the
  two names never collide in one scope, but a reader skimming both
  layers' own vocabulary should not assume they're the same thing.
- **Scope.** The request named `Word.domainTag`/`relatedDomainTags`
  specifically. Tracing every real reader/writer found the identical
  field pair, identically shaped, on `Sense` and `Phrase` too -- offered
  as a choice (Word alone vs. all three); the requester chose all three,
  so `Sense.domainTag`/`relatedDomainTags` and
  `Phrase.domainTag`/`relatedDomainTags` both migrated in the same pass,
  not left as a stray `Text`-typed pair a later reader would have to
  notice and reconcile by hand. `Sense.senseDomainTag` (Princeton
  WordNet's own lexicographer-file category string, e.g.
  "noun.artifact") is a distinct, unrelated concept the tracing pass
  flagged by name specifically to avoid conflating with `domainTag` --
  left untouched, still `Text`.

### Why this needed a real call-site trace, not just a clean compile

Every prior rename in this log (`entryId` -> `phraseId`/`wordId`/`senseId`/`coordinationId`)
changed a field *name*, so a stale call site failed to compile --
`tsc -b --force` itself was the exhaustive check. This change keeps the
field name (`domainTag`) and only changes its *type*, `Text` ->
`Identifier`. Both shapes carry a `.value: string`, so a stale call site
reading `word.domainTag?.value` expecting display text ("medicine")
still type-checks cleanly against the new `Identifier` shape -- it just
silently reads a uuid at runtime instead. A clean `tsc -b --force`
therefore proves nothing here; every real reader had to be traced and
checked by hand (the same risk `endpointUuid()`'s own entry above
identifies for a *different* reason -- there, two *different* entities'
identically-shaped identity fields; here, one field whose own shape
changed under a stable name). Two real bugs surfaced this way that a
clean compile alone would never have caught (see Bugs below).

### Shape

`Domain` (`data/entities/domain.ts`) follows this folder's own identity-fold
convention exactly: `domainId: Identifier`, `domainId.value` stable
across every knowledge-Domain holding a copy, `domainId.uuid` fresh per
copy; `domainText: Text` is its own canonical written form. `role/domain_processor.ts`
(`createDomain()`/`createFreshUuidDomainCopy()`/`graphUuid()`) is its
own base-entity counterpart, matching `role/sense_processor.ts`/`role/coordination_processor.ts`'s
own shape -- kept top-level under `role/`, not `role/processor/`, for
the identical reason those two already are (that folder holds each Word
POS subtype's own processor; `Domain` isn't one). `data/domains.ts`'s
`Domains` store (`append`/`findByUuid`/`findByText`/`seedFrom`/`totalEntries`)
mirrors `Coordinations`'s own minimal shape -- case-insensitive
`findByText` is the one addition, needed by the seeder-side "reuse
before create" idiom below. `VocabularyContext.domains = new Domains()`
sits alongside `coordinations`, one store per knowledge-Domain, same as
every other entity store in that class.

`Word.domainTag`/`Sense.domainTag`/`Phrase.domainTag` are now
`Identifier | undefined`, holding `{ value: domain.domainId.uuid }` --
the target `Domain`'s own per-knowledge-Domain graph uuid, resolved via
`Domains.findByUuid()`, the same reference-field convention
`Phrase.headWord` already established (an `Identifier` field that
*points at* another entity holds that entity's own graph uuid, not its
stable cross-Domain `.value`). `relatedDomainTags` is now
`readonly Identifier[]`, one entry per additional topic domain, each
resolved identically.

### Seeder-side resolution: `resolveDomain()` + `applyDomainTag()`

`word_seeder.ts` gets a `resolveDomain(domains: Domains, text: string): Domain`
helper -- "find the existing `Domain` for this exact text, creating it
the first time it's ever seen" -- the same seeder-side "reuse before
create" idiom `createStoredModifierCoordination()`/`createStoredNestedPhrase()`
(`role/processor/phrase_processor.ts`) already establish for their own
stores, so every caller reaches it rather than ever constructing a
`Domain` inline (the identical topic text always resolves to the
identical `Domain` record). `applyDomainTag()` (shared by the
Sense-level and Word/Phrase-level `tagTopicDomain()` paths, since all
three entities share the identical `domainTag`/`relatedDomainTags`
shape) turns a raw WordNet category lemma into a resolved reference via
`resolveDomain()`, then applies first-domainTag-wins /
append-to-relatedDomainTags-if-new exactly as before, just comparing
`Identifier.value` (now a uuid) instead of `Text.value`.

`domains?: Domains` threads through `seedWordNet()`/`seedDomain()`/`seedClosedClassWords()`
as one more parameter in the same explicit, no-hidden-state style this
file already threads `wordForms`/`coordinations` through (`seedPointerRelationship()`
already carried 13+ parameters before this addition) -- optional,
following the identical "graceful degradation when omitted" pattern
those two establish: `tagTopicDomain()` early-returns (no-op, pointer
left untagged) when `domains` is undefined, rather than throwing or
resolving against nothing.

`entryToWord()` (the domain-agnostic prototype-cache build pass) can't
resolve or create a real `Domain` itself -- it has no per-knowledge-Domain
`Domains` store to resolve against, the identical situation
`cachePad`/`cacheWordFormAttributes`/`cacheLexicalForm` already solve:
a new `cacheDomainTag: Map<string, string>` caches each cached entry's
own raw `domain_tag` string, keyed by entryId, and `seedClosedClassWords()`'s
own loop reads it back once it has both a real per-knowledge-Domain
`copy` (post `createFreshUuidWordCopy()`) and the real `domains` store it
was actually given, materializing `copy.domainTag` via `resolveDomain()`
only then.

### Bugs the exhaustive trace caught that a clean compile did not

1. **`seedClosedClassWords()`'s own re-seed idempotency, and its `excludeOpenClasses`
   dedup, both silently broke** the first time they were rewritten to
   resolve `existing.domainTag` through `domains` before comparing --
   correct in isolation, but a caller that (legitimately) omits
   `domains` (this file's own optional-store convention) then has every
   `domainTag` resolve to `undefined` regardless of whether the
   underlying `Domain` reference is genuinely set, so two Words that
   really do carry two different, real domain tags read as
   indistinguishable and get deduplicated into each other, or -- the
   version that actually shipped and failed three real tests -- a
   second `seedClosedClassWords()` call re-inserts every already-present
   domain-tagged Word as a duplicate, since "already present" no longer
   matches "freshly cached" once neither side can be told apart without
   `domains`. Fixed by recognising that this one dedup comparison never
   needed `domains` at all: `existing.wordId.value` is this cache's own
   stable entryId regardless of which knowledge-Domain it was copied
   into (`createFreshUuidWordCopy()` only ever regenerates `.uuid`), so
   `cacheDomainTag.get(existing.wordId.value)` recovers the exact same
   raw text `cacheDomainTag.get(word.wordId.value)` already does for the
   candidate side -- comparing two raw cached strings directly, with no
   store needed for correctness at all. `domains` is still required, and
   still optional, for the one thing it actually does: materializing a
   *new* copy's own `domainTag` reference.
2. **`RelationshipSeeder.resolve()`'s own domainTag-based homograph
   disambiguation** (`role/relationship_seeder.ts`, matching a spec's
   `sourceDomainTag`/`targetDomainTag` string against a candidate Word's
   own domain to pick the correct one of several same-lexical-form,
   same-part-of-speech Words) has no substitute for `domains` the way
   the dedup above did -- resolving a *specific* domain-tagged homograph
   genuinely requires resolving the candidate's own `Identifier` back to
   display text and comparing it against the spec's raw string, so a
   caller that omits `domains` here loses real disambiguation, not just
   an optimization. Confirmed as the correct, expected behaviour (not a
   bug to route around) by updating `vocabulary.test.ts`'s own "seeds
   relationships that resolve against a seeded Dictionary" test to pass
   a real `Domains` store through both `WordSeeder.seedDomain()` and
   `RelationshipSeeder.seedDomain()`, the same way that test already
   supplies `senses`/`wordForms` when a scenario genuinely needs them
   resolved.
3. **`role/web_worker/vocabulary_worker.ts`'s `handleRenderDomain()` --
   the call site behind the Vocabulary tab's own full-page render/
   re-render, the one that builds `DOMAIN_VALUES_JSON` (the Words tab's
   own domain filter dropdown) -- never got the new `domains:
   domain.vocabulary.domains` line at all**, caught only by live
   Playwright, not by the unit suite (nothing in `vocabulary.test.ts`
   exercises this Worker file directly). Its own `new DictionaryView(...)`
   call is nested one indent level deeper than this file's other six
   identical-looking call sites (inside a `try` block), so the bulk
   `replace_all` edit that added `domains: domain.vocabulary.domains,`
   to all seven matched only six -- the seventh's own `coordinations:
   domain.vocabulary.coordinations,` line carried different leading
   whitespace and simply didn't match the search string. Every *other*
   domain-facing read in the app (a Word's own detail panel, in
   particular) goes through a different call site (`handleSearchWords()`)
   that did get the fix, so `domainTag`/`relatedDomainTags` themselves
   resolved correctly everywhere live testing first looked -- only the
   dropdown, sourced from this one specific render path, stayed stuck on
   an empty `Domains` store (`DictionaryView`'s own default), showing
   just "All domains"/"Common" regardless of how many real topic domains
   a WordNet seed actually populated. Fixed by adding the missing line;
   re-verified live afterward (Verification below).

### UI read side

`ui/server/resolver_domain.ts`'s `senseFieldsFor()` return type changed
`domainTag?: Text` -> `Identifier`, `relatedDomainTags: readonly Text[]`
-> `readonly Identifier[]` (a pure pass-through, no resolution inside
that function itself); `domainLabel()` gained a `domains: Domains`
parameter and now resolves via `domains.findByUuid(domainTag.value)?.domainText.value`
instead of reading `.value` directly. Every builder that renders a
domain-facing field threads a `domains: Domains` parameter the same
explicit way `senses`/`wordForms` already are:
`builder_segment.ts` (`definitionWordSegment()`/`definitionSegments()`),
`builder_phrase.ts` (`phraseWordSegments()`/`phraseHeadWordSegment()`/`modifierUnitSegment()`/`phraseModifierSegments()`),
`builder_word.ts` (`sensesFor()`/`wordRecordFor()`/`wordRecords()`/`searchWords()`,
plus resolving `relatedDomainTags` element-wise before mapping to
display text), `builder_sense.ts` (`senseRecordFor()`/`senseRecords()`/`searchSenses()`,
which duplicates the isCommon-fallback logic `sensesFor()` above has,
resolved identically), `builder_relationship.ts`/`builder_lexical_relationship.ts`
(`source_domain`/`target_domain`, never `source_category`/`target_category`
-- that pair is `Sense.senseDomainTag`, untouched), `builder_hierarchy.ts`.
`DictionaryView` (`ui/server/dictionary_controller.ts`) gained a
`domains?: Domains` constructor option (default `new Domains()`, the
same empty-store default `coordinations` already gets) and a private
`domains` field threaded into every one of its own methods that
ultimately reaches a domain-facing builder call. `role/web_worker/vocabulary_worker.ts`'s
seven `new DictionaryView(...)` production call sites needed no new
parameter threading of their own beyond the one added line --
`domain.vocabulary.domains` already exists on every real
`VocabularyContext` instance passed in, the identical reason `handleSeedCommonVocabulary()`/`handleSeedWordNet()`
needed no changes at all to *seed* a real `Domains` store (`WordSeeder.seedDomain()`/`seedWordNet()`
already read `domain.vocabulary.domains` directly off whatever
`VocabularyContext`-shaped object they're given).

One known, accepted gap, consistent with an identical pre-existing one:
`Dictionary.seedFrom()`/`Phrases.seedFrom()` (the Physics-from-Common
one-time bootstrap snapshot, `vocabulary_worker.ts`'s own `handleSeedCommonVocabulary()`)
copy each Word/Phrase via `createFreshUuidWordCopy()`/`copyPhraseWithFreshUuid()`,
which regenerates only the copy's own `wordId.uuid`/`phraseId.uuid` --
any `domainTag`/`relatedDomainTags` `Identifier` the copy carries still
points at the *source* knowledge-Domain's own `Domains` store, which
Physics's own (never separately seeded) `Domains` store doesn't contain.
This is not a new gap this change introduces: `wordFormIds` already has
the exact same cross-knowledge-Domain reference-breaking behaviour today
(`Dictionary.seedFrom()`'s own docstring never claims to fix up
cross-references, and `wordForms` itself is never copied into Physics
either) -- `domainTag`/`relatedDomainTags` simply now behaves the same
way `wordFormIds` already did, not differently.

### Verification

`npx tsc -b --force` clean throughout -- but per the exhaustive-trace
discussion above, this was never treated as sufficient on its own for
this specific change. Full `vitest run --no-file-parallelism` 187/187,
after fixing the first two real bugs above (three idempotency-test
failures plus one `RelationshipSeeder` resolution failure, all genuine,
none pre-existing) -- including `vocabulary.test.ts`'s own real-seeded
infusion/winger topic-domain assertions (now resolving through a real
`Domains` store rather than reading `.value` directly) and the shared
`seededVocabularyFixture()` helper (now also building and returning a
real `Domains` store every fixture-sharing test can request).

Live Playwright against the real running app is what caught the third
bug above (`handleRenderDomain()`'s own missing `domains` line) --
confirmed by staged verification, not a single end-state screenshot: a
fresh "Seed Vocabulary" alone (before "Load WordNet" ever runs) already
shows the Words tab's own domain filter dropdown listing "root_word.common"
correctly, and searching "entity" at that point resolves it to exactly
one Word, domain "root_word.common", showing root_words.json's own
curated definition -- the closed-class seeding path's own `domainTag`
resolution, working end to end on its own. After "Load WordNet" also
runs, the dropdown grows to include every real WordNet topic domain
("field hockey", "medicine", "soccer", ... -- confirmed empty/broken
before the fix, confirmed fully populated after), and "winger" resolves
to one of its four real topic domains in its detail panel with the
other three correctly listed as related domains. Searching "entity"
again at that point now resolves to WordNet's own "entity" synset
instead of the closed-class one -- `seedWordNet()`'s own existing-Word
reuse (`role/word_seeder.ts`, matching by `(text, partOfSpeech)`
regardless of domainTag, unchanged by this migration) reuses the
already-seeded closed-class "entity" Word rather than creating a
second one, and its own primary-Sense-wins display logic
(`senseFieldsFor()`, also unchanged by this migration) then favours
whichever Sense the WordNet pass most recently linked -- a pre-existing
Sense-primacy characteristic of the seeding pipeline, orthogonal to
whether `domainTag` is `Text` or `Identifier`, not something this
change altered or was asked to fix. No console error at any point in
either staged seed or in browsing/searching afterward.

## Rename `WordFormRow.field` to `WordFormRow.wordformType` in `pos_vs_wordform_matrice.ts`

Requested directly. `WordFormRow.field` (`data/matrices/pos_vs_wordform_matrice.ts`)
is the Word Form to Part of Speech Matrix's own row-level `WordFormType`
value (e.g. `PLURAL_NUMBER_FORM`) -- a generic name that read ambiguously
next to `WordFormRule`'s own several genuinely different "field"-shaped
columns (`format`, `baseLemmaPattern`, `stringPattern`, ...) sharing the
same file. Renamed to `wordformType`, matching this codebase's own
established convention for the identical value elsewhere (`WordForm.formType`,
`data/entities/word_form.ts`) closely enough to read as the same concept
under a related name, while staying distinct from that field's own exact
spelling since a `WordFormRow` and a `WordForm` are different things (a
matrix row describing every POS's own rules for one `WordFormType`, vs.
one real per-Word spelling record) -- conflating the two names outright
would have implied a closer relationship than actually exists.

Scoped entirely to this one file: the interface field itself, all 27 row
literals' own `field: WordFormType.XXX`, `stringPatternsFor()`'s own
parameter (`field` -> `wordformType`) and its `row.field`/`r.field`
lookup, `fieldsFor()`'s own `row.field` read, and the one docstring
prose reference to the renamed parameter. Confirmed via a codebase-wide
search that nothing outside this file ever reads `.field` off a
`WordFormRow`/`WORD_FORM_MATRIX` row directly -- every external
reference to this matrix goes through `stringPatternsFor()`/`fieldsFor()`
(both call sites unaffected by an internal parameter rename) or names
the file/constant only in prose/comments, never the row shape itself.

`npx tsc -b --force` clean -- a genuine proof of completeness here,
unlike the `Domain` migration just above: this rename changes a field
*name*, so any stale reference would have failed to compile, not silently
kept compiling against a same-shaped-but-differently-meant value. Full
`vitest run --no-file-parallelism` 187/187, including `stringPatternsFor()`'s
own direct test coverage in `vocabulary.test.ts`. No live Playwright
verification -- this attribute is a pure internal matrix-lookup key with
no UI-facing text or behavior derived from its name, so the type-checked
rename plus the existing test suite already prove correctness end to end.

## Move `role/word_processor.ts`'s Text-metadata code resolvers and spelling primitives to `value_objects/data/text.ts`

Requested after a review of `role/word_processor.ts` found it was really
three files sharing one name: Word's own base-entity trio
(`createWord()`/`createFreshUuidWordCopy()`/`graphUuid()`, the exact scope
every other entity's own `role/<entity>_processor.ts` -- `word_form_processor.ts`,
`sense_processor.ts`, `coordination_processor.ts`, `domain_processor.ts` --
already keeps to), a Dictionary-resolved definition-word breakdown, a
Word Form Matrix validation pair, and -- the two groups moved here --
four `Text`-metadata code resolvers (`languageCodeFor()`/`dialectCodeFor()`/
`scriptCodeFor()`/`languageStyleCodeFor()`) and eight regular-English-
suffix spelling primitives (`isConsonantYEnding()`, `recogniseFinalConsonantDoublingStrategy()`
and its `NON_DOUBLING_MULTISYLLABLE_VERBS` exception set, `createRegularDegreeForm()`,
`recogniseSyllableCount()`, `isPeriphrasticComparison()` and its
`SYNTHETIC_TWO_SYLLABLE_ENDINGS` set, `createPeriphrasticDegreeForm()`, plus
the two private helpers `isCvcEnding()`/`isMonosyllabic()`). None of these
twelve ever took or returned a `Word` -- every one is a plain
`string`/`Text` in, `boolean`/`string`/`number`/`Text` out -- they lived
in `word_processor.ts` only because every POS subtype's own processor
already imported `createWord()` from that file, so borrowing it for
these too "added no new cross-file dependency" (that file's own former
docstring, verbatim). Proximity to a one-time import, not a genuine
`Word`-entity concern.

Moved to `value_objects/data/text.ts` instead, by explicit instruction:
that file already holds `Text`'s own interface plus its constructor and
two case-folding helpers (`text()`, `textToLowerCase()`,
`textToUpperCase()`), directly in `data/`, not behind a separate
`role/` file -- value objects don't get the `role/<entity>_processor.ts`
treatment a Vocabulary-layer entity does (confirmed by
`value_objects/role/` existing today only as an empty, reserved
directory -- a `.gitkeep`, no file in it). The twelve relocated
functions/consts follow that same convention: plain exported helpers
sitting directly beside the `Text` interface they construct or decorate,
under two new section comments ("Text metadata resolution", "Regular
English suffix generation") mirroring the section structure
`word_processor.ts` itself used to have for these two groups.

Every docstring moved verbatim, with only the handful of cross-references
that named `word_processor.ts`/`../word_processor.ts` by path corrected
to `value_objects/data/text.ts`/`text.ts` (`word_processor.ts`'s own new
top-of-file docstring paragraph explaining the move; two lingering
mentions each in `adjective_processor.ts` and `adverb_processor.ts`,
caught by a codebase-wide grep after the move, not assumed complete from
the file list alone).

Every real call site updated to import from `value_objects` (via its own
barrel, `value_objects/index.ts`, the same `export { ... } from "./data/text"`
line the three pre-existing helpers already sit in) instead of
`./word_processor`/`../word_processor`: `word_seeder.ts` (merged into an
already-present `value_objects` import rather than adding a second one),
`dictionary_hydrator.ts`, and the four POS processors that use one or
more of the spelling primitives directly (`noun_processor.ts`,
`verb_processor.ts`, `adjective_processor.ts`, `adverb_processor.ts`) --
each split its old combined `from "../word_processor"` import into two,
one for what's staying (`createWord`/`graphUuid`/`recogniseFormTextIssue`/
`WordFormIssue`) and one for what moved. `vocabulary/index.ts`'s own
public barrel needed no change -- it never re-exported any of these
twelve to begin with, only `WordInit`/`createWord`/`createFreshUuidWordCopy`/
`recogniseDefinitionWords`.

What stayed in `word_processor.ts`, confirmed still correct by the same
review: the base-entity trio; `recogniseDefinitionTokens()`/`recogniseDefinitionWords()`
(needs a `Dictionary` to resolve tokens against, so it's Dictionary/
Vocabulary-level derived behaviour, not a `Text`-only primitive --
doesn't cleanly fit `text.ts` either, noted as a still-open question, not
resolved by this move); `WordFormIssue`/`createFormatPatternRegExp()`/
`recogniseFormTextIssue()` (Word Form Matrix validation, keyed to a `WordForm`'s
own `formType`/`text` fields at every real call site -- arguably
`word_form_processor.ts` material rather than `word_processor.ts`, but
that's a separate move from this one, not requested here).

`npx tsc -b --force` clean -- every one of the twelve functions changed
file, so a stale import anywhere would have failed to compile, the same
completeness guarantee the `wordformType` rename just above had. Full
`vitest run --no-file-parallelism` 187/187, unchanged behaviourally (a
pure relocation, no logic touched). No live Playwright verification --
same reasoning as the rename above: this is an internal module
reorganization with no UI-facing surface of its own.

## Correction: move the eight spelling primitives back from `value_objects/data/text.ts` to `role/word_processor.ts`

The move immediately above was wrong for eight of its twelve functions,
caught in review before it shipped any further and corrected here. The
four Text-metadata code resolvers (`languageCodeFor()` and its three
siblings) stay in `value_objects/data/text.ts` -- that half of the
previous entry's reasoning holds. The eight regular-English-suffix
spelling primitives (`isConsonantYEnding()`, `isCvcEnding()`,
`isMonosyllabic()`, `recogniseFinalConsonantDoublingStrategy()` and its
`NON_DOUBLING_MULTISYLLABLE_VERBS` set, `createRegularDegreeForm()`,
`recogniseSyllableCount()`, `isPeriphrasticComparison()` and its
`SYNTHETIC_TWO_SYLLABLE_ENDINGS` set, `createPeriphrasticDegreeForm()`) move
back to `word_processor.ts`, where they originally were.

The error was measuring `word_processor.ts` against the wrong sibling
files. `word_form_processor.ts`/`sense_processor.ts`/`coordination_processor.ts`/`domain_processor.ts`
are each a *leaf* entity's own processor -- WordForm/Sense/Coordination/Domain
have no subtypes of their own, so "Init type + create + copy +
graphUuid, nothing else" is genuinely their whole correct scope; there
is no such thing as "logic shared across WordForm's subtypes" because
WordForm has none. `Word` is not a leaf -- it is the one entity in this
codebase with a real subtype family (Noun/Verb/Adjective/Adverb/... ,
each with its own `role/processor/*_processor.ts`), and `word_processor.ts`'s
own docstring already said as much before any of this ("the base-class
counterpart to each POS subtype's own role/processor/*_processor.ts").
Holding logic reused *across that subtype family* is exactly what a
base-class processor is for -- the same reason an abstract base class
holds a method its subclasses would otherwise each reimplement -- and
that is precisely why the spelling primitives were there to begin with:
"lives here once rather than duplicated across those four files"
(noun.ts/verb.ts/adjective.ts/adverb.ts's own `generate<Class>Forms()`)
was never a convenience shortcut, it was the correct application of the
base-class convention, measured against the right yardstick. Applying
the leaf-entity convention to `Word` instead -- as the previous entry
did -- treated `Word` as symmetric with its four peer files when it
structurally isn't, and concluded from a `string`-in-`string`/`Text`-out
type signature alone that these belonged with `Text`, when what
actually determines the right home is *who reuses the function*, not
what type happens to pass through it. `Text` itself never generates a
comparative degree form, checks final-consonant doubling, or counts
syllables outside of an open-class POS subtype's own `generate<Class>Forms()`
context -- every real caller is one of those four generators, not a
generic `Text` operation.

The four code resolvers survive the correction because they fail that
same test the other way: no POS subtype processor ever called them --
only `word_seeder.ts`/`dictionary_hydrator.ts`, at ingestion time,
entirely outside the subtype-processor family `word_processor.ts`
exists to serve. They were never shared-across-subtypes logic to begin
with, just riding along in the same file for the same one-time-import
convenience the spelling primitives were mistakenly credited with too.

Mechanically the exact reverse of the move above: the "Regular English
suffix generation" section (all eight functions/consts, docstrings
carried over verbatim) removed from `text.ts` and reinstated in
`word_processor.ts`; `value_objects/index.ts`'s barrel drops the eight
re-exports, keeping only the four code resolvers; every real call site
(`noun_processor.ts`, `verb_processor.ts`, `adjective_processor.ts`,
`adverb_processor.ts`) reverted to importing them from `../word_processor`
again; the handful of doc-comment cross-references naming
`value_objects/data/text.ts`/`text.ts` (in `adjective_processor.ts`/`adverb_processor.ts`,
caught by the same grep discipline as the original move) restored to
name `word_processor.ts` instead. `word_processor.ts`'s own top-of-file
docstring rewritten a second time, this time to state the actual
governing principle directly (base-class-for-a-subtype-family vs.
leaf-entity-processor) rather than merely describing what stayed
and what left, so a future reader measuring this file against its
siblings doesn't repeat the same category error.

`npx tsc -b --force` clean, full `vitest run --no-file-parallelism`
187/187 -- both changed, both a pure relocation with no logic touched,
so behaviourally identical to before either move. No live Playwright
verification, same reasoning as both entries above.

## Move Word Form Matrix validation (`WordFormIssue`/`createFormatPatternRegExp()`/`recogniseFormTextIssue()`) from `role/word_processor.ts` to `role/word_form_processor.ts`

The correction above settled where the eight spelling primitives belong,
but left one open thread from the same file: `WordFormIssue`,
`createFormatPatternRegExp()`, and `recogniseFormTextIssue()` stayed in
`word_processor.ts`, on the sole grounds that every POS subtype's own
processor already imported `createWord` from that file, so importing
`recogniseFormTextIssue` from the same place too "added no new cross-file
dependency" -- that file's own former docstring, verbatim. Put under the
same scrutiny the spelling primitives just got, that reasoning doesn't
hold: proximity to an existing import is not the test. The test is who
actually reuses the function. Every real call site
(`recogniseAdjectiveFormIssues()`, `recogniseVerbFormIssues()`, and their siblings across every
`role/processor/*_processor.ts`) validates one `WordForm`'s own
`formType`/`text` pair -- e.g. `recogniseFormTextIssue(form.formType, form.text,
stringPatternsFor(...))` inside a loop over `wordForms.formsOf(word)` --
never anything about `Word` itself or shared across the POS subtype
family the way the spelling primitives genuinely are. This is `WordForm`'s
own behaviour, not a base-class-for-a-subtype-family concern, so it
belongs with `WordForm`, not with `Word`.

`WordForm` itself, unlike `Word`, has no subtype family of its own --
it's a leaf entity, a peer of `Sense`/`Coordination`/`Domain`, each with
its own single `role/<entity>_processor.ts` holding only construction/
copy/identity. That raised a genuine naming question before any code
moved: `role/processor/` is the folder that holds each of `Word`'s own
11 POS-subtype processors (`noun_processor.ts`, `verb_processor.ts`,
...), and creating a `role/processor/word_form_processor.ts` there would
collide in basename with the pre-existing top-level `role/word_form_processor.ts`
-- which explicitly documents itself as *not* belonging under
`role/processor/`, since `WordForm` has no subtype family the way `Word`
does. Rather than guess a third time after two consecutive
categorization corrections in this same area, this was put to the user
directly (`AskUserQuestion`): merge the three symbols into the existing
top-level `role/word_form_processor.ts`, or create a new file elsewhere.
The user chose the existing file.

Mechanically: `WordFormIssue`/`createFormatPatternRegExp()`/`recogniseFormTextIssue()`
(docstrings carried over verbatim, only the file-relative cross-references
inside them updated) moved from `word_processor.ts` into
`word_form_processor.ts`, appended after that file's existing
`graphUuid()`; the three new imports this required
(`Text`/`wordFormTypeLabel`/`WordFormType`) added to that file's import
list. `word_processor.ts` lost the "Word Form to Part of Speech Matrix
attribute validation" section entirely (including the trailing
`baseLemmaCanonicalForm` comment explaining why that one `*_Form` field
needs no separate validation function) and its now-unused
`wordFormTypeLabel`/`WordFormType` import; its top-of-file docstring
gained a paragraph documenting the move and explicitly rejecting the
"proximity to a one-time import" reasoning that had justified keeping
these three here, so a future reader doesn't reach for that argument
again. Every real call site (`noun_processor.ts`, `verb_processor.ts`,
`adjective_processor.ts`, `adverb_processor.ts`, `determiner_processor.ts`,
`auxiliary_processor.ts`, `pronoun_processor.ts`, plus `vocabulary.test.ts`)
split its combined `from "../word_processor"` (or `from "./role/word_processor"`)
import into two -- one for what's staying (`createWord`/`graphUuid`/the
spelling primitives, as applicable per file), one for `recogniseFormTextIssue`/
`WordFormIssue` from `../word_form_processor` (`./role/word_form_processor`
in the test file). The one stray doc-comment cross-reference in
`data/matrices/pos_vs_wordform_matrice.ts` naming `role/word_processor.ts's
recogniseFormTextIssue()` corrected to name `word_form_processor.ts` instead.

`npx tsc -b --force` clean, full `vitest run --no-file-parallelism`
187/187 -- a pure relocation, no logic touched, so behaviourally
identical to before the move. No live Playwright verification -- same
reasoning as every entry above: an internal module reorganization with
no UI-facing surface of its own.

## Move `role/word_processor.ts`, `role/sense_processor.ts`, `role/word_form_processor.ts` into `role/processor/`

Requested directly: move all three of Word/Sense/WordForm's own base-
or leaf-entity processors from top-level `role/` into `role/processor/`,
alongside the 11 POS-subtype processors that folder held exclusively
until now. This changes what `role/processor/` means going forward --
every entry above argued from "that folder holds each POS subtype's
own processor, and X is not one of them" as the reason `word_processor.ts`/
`sense_processor.ts`/`word_form_processor.ts` stayed at the top level.
That reasoning is now superseded by direct instruction, not re-derived
here: `role/processor/` holds every entity's own processor file, POS
subtype or not. `role/domain_processor.ts` and `role/coordination_processor.ts`
were not named in the request and were not moved -- they remain
top-level `role/` files, so `role/processor/` is not (yet) exhaustive
over every entity's processor, just these three plus the 11 POS
subtypes.

Mechanically: `git mv` for all three files into `role/processor/`. Each
moved file's own internal imports gained one extra `../` (they now sit
one directory deeper than before -- e.g. `word_processor.ts`'s own
`from "../../value_objects"` became `from "../../../value_objects"`).
Every real call site updated: the 12 POS-subtype/phrase processors
already living in `role/processor/` now import these three as true
siblings (`from "./word_processor"` etc., not `from "../word_processor"`);
every top-level `role/` file that imports one of the three
(`word_seeder.ts`, `dictionary_processor.ts`, `dictionary_hydrator.ts`,
`contraction_seeder.ts`, `relationship_seeder.ts`, `auxiliary_seeder.ts`,
`determiner_seeder.ts`, `preposition_sense_seeder.ts`) gained a
`processor/` path segment; so did every `data/` file that imports one
directly (`data/entities/phrase.ts`, `data/word_forms.ts`,
`data/senses.ts`, `data/dictionary.ts`), every `ui/server/*.ts` builder/
resolver file, `vocabulary/index.ts`'s own public barrel, both
`linguistics/`-layer files that reach into Vocabulary for `graphUuid`/
`createWord` (`linguistics_worker.ts`, `graph_processor.ts`), and
`vocabulary.test.ts`. Every doc-comment cross-reference naming one of
the three files by path (dozens, across `role/coordination_processor.ts`,
`role/domain_processor.ts`, `data/senses.ts`, `data/dictionary.ts`,
`data/entities/phrase.ts`, `data/definition_word_reference.ts`,
`data/matrices/pos_vs_wordform_matrice.ts`,
`data/matrices/word_form_part_of_speech_matrix.md`,
`value_objects/data/text.ts`, `linguistics/data/token_reading.ts`, and
the three moved files' own docstrings) updated to the new path;
historical entries earlier in this log were deliberately left
unchanged -- they describe a path that was accurate when written, not
a claim this log keeps in sync going forward.

Each moved file's own top-of-file docstring, and `role/domain_processor.ts`'s/
`role/coordination_processor.ts`'s, rewritten where they had asserted
"kept as a top-level role/ file rather than under role/processor/,
because that folder is POS-subtype-only" -- now false for the three
that moved, and now stated for `domain_processor.ts`/`coordination_processor.ts`
as "not part of this move," not as a standing rule the next reader
should expect to hold indefinitely.

`npx tsc -b --force` clean, full `vitest run --no-file-parallelism`
187/187 -- every changed line is an import path or a doc-comment cross-
reference, no logic touched, so behaviourally identical to before the
move. No live Playwright verification -- same reasoning as every entry
above: an internal module reorganization with no UI-facing surface of
its own.

## Rename every function across all 21 vocabulary-layer `*_processor.ts` files to a fixed six-verb vocabulary

Requested directly, following two design-only (no-code) review passes on
`phrase_processor.ts`'s own naming that arrived at the same conclusion:
function names across this codebase were inconsistent about whether they
led with a verb at all, and where they did, used a wide, ad hoc set of
verbs (`classify`/`resolve`/`find`/`build`/`register`/`generate`/
`validate`/`determine`/`queue`/`copy`/...). This pass fixes both
problems at once, across every `*_processor.ts` file under
`vocabulary/role/` (21 files; the 48 unrelated `linguistics/role/html/**/*_processor.ts`
files were explicitly scoped out -- a different concern, HTML element
processing, never part of this naming discussion).

Every function name was remapped onto exactly six verbs, chosen to be
mutually exclusive by return shape/effect rather than by feel:

- **Is** -- returns `boolean`.
- **Create** -- constructs a new domain object, or finds-or-creates one
  in a store (the old `register`/`build` family folds in here: from a
  caller's perspective, both are "give me an object for this input,"
  whether or not one already existed).
- **Update** -- mutates fields on an existing object in place, `void`
  return, side effect. Exactly one function in scope fits this:
  `linkPhraseWords()` -> `updatePhraseWordLinks()`.
- **Identify** -- a pure switch/map over an already-known enum value,
  with no token/array scanning involved (a deterministic lookup from a
  known list).
- **Recognise** -- scans a token array, homograph list, or index
  sequence to detect a position, span, candidate set, or category from
  real surface text (heuristic/convention-driven, the old
  `classify`/`validate`/`generate`-as-"detect an issue" family).
- **Delete** -- not used anywhere in this pass; nothing in these 21
  files deletes anything.

63 functions renamed across the 21 files (940 total text substitutions,
53 files touched once cross-file imports, call sites, and doc-comment
cross-references throughout the rest of the codebase -- `linguistics/`
included -- are counted). The full old-name -> new-name table isn't
reproduced here in full (see the commit diff); the noteworthy groups:

- The `validate<Class>()` family (`validateAdjective`, `validateAdverb`,
  `validateAuxiliary`, `validateDeterminer`, `validateNoun`,
  `validatePronoun`, `validateVerb`) -> `recognise<Class>FormIssues()`.
  Same for the shared low-level check they all call,
  `validateFormText()` -> `recogniseFormTextIssue()`.
- The `generate<Class>Forms()` family (Adjective/Adverb/Noun/Verb) ->
  `create<Class>Forms()`.
- The `copy<Entity>WithFreshUuid()` family (Word/Sense/WordForm/Domain/
  Coordination) -> `createFreshUuid<Entity>Copy()` -- "copy" moved from
  verb to noun position, `create` supplies the now-mandatory verb,
  "FreshUuid" kept as the adjective (word order matches the originally
  requested Verb+Adjective+Noun shape, not just a trailing qualifier).
- `phrase_processor.ts`'s own 26 renames, carried over unchanged from
  the two prior no-code review passes on this exact file (see those
  entries above) -- including the noun-clarity fixes that review
  surfaced, e.g. `extendRunBackward()`/`extendRunForward()` ->
  `recogniseBackwardRoleRunBoundary()`/`recogniseForwardRoleRunBoundary()`
  (the old noun didn't say *which* run -- it's role-generic, shared by
  MODIFIER and DETERMINER runs alike, not just Modifier runs the old
  name implied).

**`determineGradability()` needed special handling, not a blind
find-and-replace**: this exact name was independently declared in both
`adjective_processor.ts` and `adverb_processor.ts` -- two different
functions answering the same question for two different POS classes,
not one function reused. A global rename would have collided them under
one identical new name. Resolved per-file: `adjective_processor.ts`'s
own declaration became `isAdjectiveGradable()` -- already the exact
alias `adverb_processor.ts` used at its one real cross-file import
(`import { determineGradability as isAdjectiveGradable, ... }`), so this
makes an already-established de facto name canonical rather than
inventing a new one. `adverb_processor.ts`'s own declaration became
`isAdverbGradable()`, replacing a different ad hoc alias
(`determineGradability as determineAdverbGradability`) two call sites
(`word_seeder.ts`, `vocabulary.test.ts`) had been using -- `determine`
isn't in the six-verb set either, so that alias needed to change too,
not just the bare name.

**One deliberate, standing exception, not renamed**: the `graphUuid()`
family (`word_processor.ts`, `sense_processor.ts`,
`word_form_processor.ts`, `domain_processor.ts`,
`coordination_processor.ts`, plus `data/entities/phrase.ts`'s own) stays
a bare-noun accessor name, not verbed. This is a pre-existing,
deliberate, pervasive convention across six files (identically named in
each, several imported side-by-side under aliases like `wordGraphUuid`/
`phraseGraphUuid` in files that need more than one), documented in each
file's own docstring as the accessor for "this entity's own per-Domain
graph identity." Forcing it into the six-verb scheme inside this pass
alone (e.g. `identifyGraphUuid()`) would make it inconsistent with the
five siblings it's directly modeled on everywhere else it appears --
that's a decision about the `graphUuid` convention itself, flagged in
both prior no-code reviews, not something a processor-scoped renaming
pass should resolve unilaterally. `coordinateGraphUuid()`
(`phrase_processor.ts`, a local dispatcher choosing which of the five to
call) stays alongside it for the same reason.

The three relationship-processor classes (`LexicalRelationshipProcessor`,
`MorphologicalPointerRelationshipProcessor`,
`SemanticRelationshipProcessor`, each a thin class wrapping one
`create(options)` method) needed no renaming at all -- `create` already
complies, and the object each one creates is supplied by the class name
itself (`lexicalRelationshipProcessor.create(...)`), not by the method
name; repeating it there (`createLexicalRelationship()`) would be
redundant stutter, not clarity. `DictionaryProcessor`'s own three
methods did need renaming, since none of them had an enclosing type name
to lean on for real clarity: `phraseIdentifications()` (no verb at all)
-> `recognisePhraseIdentifications()`; `registerConflictingSense()`
(`register` isn't in the six-verb set) -> `createConflictingSenseWord()`;
`queueDefinitionHydration()` (`queue` isn't either) ->
`createDefinitionHydrationRequests()`.

`npx tsc -b --force` clean on the first attempt after the full pass
(word-boundary text substitution across every `.ts`/`.md` file under
`src/lira`, not just `vocabulary/`, so cross-layer references in
`linguistics/` and historical prose in both design-decision logs stayed
in sync too) -- every real import/call site was genuinely unique text,
confirmed by checking for new-name/old-name collisions across the full
63-entry rename table before running it, so one pass was safe. Full
`vitest run --no-file-parallelism` 187/187, unchanged -- a pure rename,
no logic touched anywhere. No live Playwright verification -- same
reasoning as every reorganization entry above: no UI-facing surface of
its own (this doesn't touch any UI-layer file's own exported names, only
internal `vocabulary/role/` ones and the cross-references to them).

## Change `Identifier.uuid` from `string` to `number`

Fixes a filed bug: `Identifier.uuid` (`value_objects/data/identifier.ts`)
was a v4 UUID string, generated by `crypto.randomUUID()`, purely to serve
as each entity's own per-Domain graph identity -- an internal identity
key, never shown to a user, never compared against anything outside this
codebase. `Identifier.value` already exists as the one field meant to
carry a real, portable, cross-Domain business identifier (a WordNet
synset id, a curated closed-class lemma, ...), so `.uuid` had no reason
to be string-typed at all; a `number` is smaller, sorts and hashes
without allocation, and is the natural type for a pure internal key.

Replaced `crypto.randomUUID()` with a new `randomGraphUuid()`
(`value_objects/data/identifier.ts`, exported from `value_objects/`'s
barrel): `crypto.getRandomValues(new Uint32Array(2))`, masked and
combined into one unsigned integer in `[0, 2^53)` (JavaScript's
`Number.MAX_SAFE_INTEGER` range). Deliberately not a monotonic counter,
even though a counter would be simpler and never collide within one
Domain -- every `graphUuid()` accessor's own docstring already documents
a hard requirement this fix must not break: two independently-seeded
Domains' identifiers must never collide when merged. A per-Domain
counter starting at 0 guarantees exactly that collision the moment two
Domains merge; a 53-bit uniformly random value keeps the same
birthday-bound collision safety a v4 UUID gave (at real scale -- the
~92,000-Word bundled Dictionary is nowhere near the ~10^8 draws needed
for a 53-bit space to see a meaningful collision risk), without the
string-typed overhead `crypto.randomUUID()` carried for no benefit.

**Scope, and why it grew far past the six stores the filed issue named.**
Every accessor in the `graphUuid()` family (`word_processor.ts`,
`sense_processor.ts`, `word_form_processor.ts`, `domain_processor.ts`,
`coordination_processor.ts`, `data/entities/phrase.ts` -- six identically
-shaped, independently declared functions, one per entity, per the
renaming-pass entry above) now returns `number`. So do the five
`createFreshUuidXCopy()`/`copyPhraseWithFreshUuid()` functions and
`toSyntheticWord()` that used to call `crypto.randomUUID()` to mint a
fresh `.uuid` for a copy. So do all six stores' `byUuid`-suffixed
internal `Map`s (`Dictionary.byUuid`, `Senses.byUuid`/
`synsetIdByUuid`/`membersBySenseId`, `WordForms.byUuid`/`formsByWordId`/
`synsetIdByUuid`, `Phrases.byUuid`/`partOfSpeechByUuid`/`synsetIdByUuid`,
`Domains.byUuid`, `Coordinations.byUuid`) and every store's
`findByUuid(id: number)` signature -- genuinely string-keyed maps
(`byText`, `bySynsetId`, `textIndex`) were left untouched, keyed on real
WordNet synset ids or spellings, unrelated to this fix.

That was the filed issue's own scope. What the issue's own count of "6
stores plus 8 more files" badly underestimated: `Identifier.value` and
`graphUuid()`'s old return type were both `string`, so throughout this
codebase a "reference pointer" field -- anywhere one entity points at
another's graph identity via an `Identifier`-shaped field, rather than
holding an embedded copy -- was built by stuffing a `graphUuid()` result
straight into a fresh `Identifier`'s own `.value` (`{ value:
graphUuid(target) }`), relying on both being the same primitive type.
That pattern turned out to be pervasive: `Phrase.headWord`/
`headWordForm`/`preModifier`/`postModifier`/`determiner`/`domainTag`/
`relatedDomainTags`, `Sense.domainTag`, `Word.domainTag`/
`relatedDomainTags`/`contractionOf`, `WordForm.contractionOf`,
`Coordination.coordinator`, every `*RelationshipProcessor.create()`'s
`source*Id`/`target*Id` fields, and the corresponding lookups against
every `findByUuid()`/`membersOf()`/`outgoing()`/`incoming()` call
consuming one of those pointers.

**The boundary decision.** Rather than widen every one of those pointer
fields to `number` (a materially larger, separate redesign of the
reference-pointer pattern itself, well past this bug's own scope) or
leave `Identifier.value` ambiguously either a real string business id or
a stringified number depending on field, `.value` keeps its existing,
unconditional `string` type and its existing role as the one universal
business-identifier field -- a reference pointer's `.value` now holds a
*stringified* graph uuid instead of a UUID string, but the field's own
contract (always `string`) is unchanged. Every construction site wraps
with `String(graphUuid(target))`; every consumption site wraps with
`Number(pointer.value)` before calling `findByUuid()`/`membersOf()`/
`outgoing()`/`incoming()`. UI-facing record fields (`SenseRecord.id`,
`PhraseRecord.id`, `CoordinationRecord.id`, `WordRecord`'s own
derivation-target `id`, `DefinitionSegment.word_id`,
`DictionaryView.searchWords()`'s `wordId` option, ...) keep the same
`string` wire-format contract they already had for JSON-serializability
and stayed unwidened, converting at their own construction/consumption
boundary the same way a reference-pointer `.value` does.

`npx tsc -b --force` clean; `npx vitest run --no-file-parallelism`
188/188 (`identifier.test.ts` gained one new test covering
`randomGraphUuid()`'s range and uniqueness). Several genuine `vitest`
failures surfaced only at runtime, not at compile time -- `expect().
toBe()`/`.toEqual()`/`.toContain()` are typed loosely enough that a
`string`-vs-`number` mismatch between an assertion's actual and expected
sides compiles cleanly, so a second pass driven by actually running the
suite (not just `tsc`) was needed to catch the last stragglers in
`vocabulary.test.ts`'s own assertions. No live Playwright verification --
this is an internal identity-key type change with no UI-facing contract
change (every record field touching JSON already stayed `string`).

**Left unimplemented, out of scope:** widening reference-pointer fields
themselves (`headWord`, `domainTag`, `coordinator`, ...) to `number`
directly, which would remove the `String()`/`Number()` conversion
boundary entirely -- a larger, independent redesign of the
reference-pointer `Identifier` pattern, not something this bug-fix scope
should decide unilaterally.
