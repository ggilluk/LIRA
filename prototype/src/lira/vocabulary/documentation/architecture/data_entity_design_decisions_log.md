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

**`role/processor/phrase_processor.ts`'s `classifyModifierRoles()`** --
NounPhrase's own Head Identification Rule was `lastTargetPosBeforeFirstPreposition(possiblePos,
PartOfSpeech.NOUN)`, checking `PartOfSpeech.NOUN` alone. Fixed by giving
`lastTargetPosBeforeFirstPreposition()` an optional second target POS
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
`classifyPhraseType()` synsetMemberToPhrase() already uses for the
WordNet path, with `verbLemmas`/`nounLemmas` passed as empty `Set`s
(deliberately -- classifyPhraseType()'s own structural overrides for "to
"+verb and Determiner-Phrase-shaped ADJECTIVE/ADVERB lemmas only ever fire
for those other parts of speech, so an empty set changes nothing for the
PRONOUN case this call site actually reaches).

**`role/processor/phrase_processor.ts`'s `classifyPhraseType()` itself** --
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
*stored* value for one of these closed-class Phrases -- `linkPhraseWords()`
is still never called outside `seedWordNet()`, untouched by this fix, so
that half of `Phrase.headWord`'s own documented "undefined... or for a
Common Vocabulary Cache closed-class Phrase" case stays true. But the
Phrases tab's own detail panel doesn't read a stored value for any of
these fields at all -- `phraseWordSegments()`/`phraseModifierSegments()`
(`ui/server/builder_phrase.ts`) recompute `classifyModifierRoles()` fresh
at render time (this same log's own "`words`/`wordRoles`..." section, on
why) -- so fixing `phraseType` alone was enough to also unlock a correct,
live-computed Determiners row for these phrases in the UI, with no
`linkPhraseWords()` call needed.

Verified end-to-end against the real bundled Common Vocabulary Cache
(Playwright): "each other" and "no one" both now show a "Noun Phrase" tag
in both the Phrases tab's own table and detail panel (previously blank),
and "each other"'s own detail panel additionally now renders a correct,
live-computed "Determiners: #1 each #2 other" row it couldn't show at all
before (`classifyModifierRoles()` returns every role `undefined` outright
when `phraseType` itself is `undefined` -- the early-return guard at the
top of that function).

### Follow-up: a PRONOUN-headed closed-class Phrase's own `headWord` still wasn't attached

Immediate follow-up bug report on the fix above, confirmed the same way:
the Phrases tab's own detail panel showed "Noun Phrase" and a correct,
live-computed "Determiners" row for "no one" -- but no "Head Word: one"
row at all, even though "one" is a real Word (both NOUN, from WordNet, and
PRONOUN, from pronouns.json) that `classifyModifierRoles()`'s own
NounPhrase Head Identification Rule (fixed in the section above) can
already resolve.

Root cause: `ui/server/builder_phrase.ts`'s `phraseHeadWordSegment()` --
unlike `phraseModifierSegments()` right next to it, which deliberately
recomputes `classifyModifierRoles()` fresh at render time -- reads
`phrase.headWord`/`phrase.headWordForm` as *stored* fields directly
(`if (phrase.headWordForm === undefined) return undefined; ...`). Those
two fields are only ever written by `linkPhraseWords()`
(role/processor/phrase_processor.ts), and `linkPhraseWords()` was only
ever called from `seedWordNet()` -- never from `seedClosedClassWords()`'s
own Phrase loop. So even with `phraseType` and the live-recomputed
Modifiers/Determiners rows both correctly fixed, `headWord`/`headWordForm`
themselves stayed permanently unset for every closed-class Phrase,
Pronoun-headed ones included -- a second, independent gap behind the same
user-visible symptom ("pronouns are not being attached to the head"),
not something the first fix could reach on its own.

Fixed by calling `linkPhraseWords(phraseCopy, dictionary, wordForms)`
inside `seedClosedClassWords()`'s own Phrase loop (`role/word_seeder.ts`),
`seedWordNet()`'s own call site's exact counterpart. Safe unconditionally:
`dictionary` already carries every closed-class Word this same seeding
pass inserted moments earlier (the Word loop always runs before the
Phrase loop within one `seedClosedClassWords()` call), and for a Phrase
whose own `phraseType` stays `undefined` (every CONJUNCTION-tagged one,
subordinating_conjunctions.json -- PhraseType has no CONJUNCTION shape)
`classifyModifierRoles()`'s own early-return guard leaves every field
`linkPhraseWords()` sets at its own harmless empty/undefined default,
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
`linkPhraseWords(phraseCopy, dictionary, wordForms)` call inside
`seedClosedClassWords()`'s own Phrase loop -- but that loop runs once, at
Common Vocabulary Cache seeding time, before `seedWordNet()` has added
anything to `dictionary` at all. For "few" specifically this matters more
than for "one" ("no one"'s Head): at closed-class-seeding time, `dictionary.lookup("few")`
resolves to only one homograph -- `role/determiner_seeder.ts`'s own
`DETERMINER_LEMMAS` entry for "few" ("a small number of, used
attributively") -- since pronouns.json's own "few" entry (added in fix #3
below) doesn't exist in the seeded Dictionary until `seedWordNet()` runs
its own closed-class pass moments later in the real seeding pipeline order,
and even then `linkPhraseWords()` was never called again afterward to
pick it up. Confirmed directly: a diagnostic test read `dictionary.lookupAll("few").map(w
=> w.partOfSpeech)` before/after `seedWordNet()` and saw `[DETERMINER]`
then `[DETERMINER, PRONOUN, NOUN, ADJECTIVE]` -- the PRONOUN sense
straightforwardly did not exist yet at the moment "a few"'s own `headWord`
got resolved and permanently stored.

Fixed in `role/word_seeder.ts`'s `seedWordNet()`: its own linking pass
used to loop only `newPhrases` (Phrases created by *this* WordNet-seeding
call). Changed to loop `phraseBook.all()` instead -- re-running
`linkPhraseWords()` against every Phrase already in `phraseBook`,
including every closed-class one `seedClosedClassWords()` seeded earlier,
now that `dictionary` carries WordNet's full homograph set too. The
now-fully-dead `newPhrases` array (and its one push site) was removed
outright rather than left as an unused intermediate.

**2. Wrong-homograph resolution -- the deeper, structural bug.** Fixing
(1) alone was not enough: even re-run after WordNet loads, "a few"'s own
`headWord` still resolved to the *Determiner* "few", not the Pronoun one.
`classifyModifierRoles()` already had the discipline to check every
possible part of speech per token rather than one arbitrary pick (its own
docstring's "give" example, and this log's own first section above) -- but
`linkPhraseWords()`'s *own* `words[]` construction never inherited that
discipline. It resolved every token, Head included, via plain
`dictionary.lookup(token)` -- first-seeded-homograph-wins, completely
disconnected from which homograph `classifyModifierRoles()` had actually
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

- `headTargetPartsOfSpeech(phraseType)` -- returns the `ReadonlySet<PartOfSpeech>`
  a given PhraseType's own Head Identification Rule targets (NounPhrase:
  Noun/Pronoun; AdjectivePhrase: Adjective; AdverbPhrase: Adverb;
  VerbPhrase/InfinitivePhrase: Verb; PrepositionalPhrase: Preposition) --
  extracted from `classifyModifierRoles()`'s own switch (which already
  computed this per-branch inline) so both that switch and the new
  resolution step below share one definition and can never drift apart.
- `resolvedWordFor(token, targetPos, dictionary)` -- searches every
  homograph `dictionary.lookupAll(token)` returns for one whose own
  `partOfSpeech` is in `targetPos`, falling back to the old
  `dictionary.lookup(token)` first-seeded pick only when no homograph
  matches (the correct behaviour for every non-Head position, and for a
  Head with no matching homograph at all -- unchanged from before).

`linkPhraseWords()` now computes `wordRoles`/`headIndex` first, then
resolves only the Head token through `resolvedWordFor()` (using
`headTargetPartsOfSpeech(phrase.phraseType)`); every other position keeps
resolving via plain `dictionary.lookup()`, matching this codebase's
existing, otherwise-accepted arbitrary-but-deterministic convention for
non-Head positions (`definitionWords()`, `word_processor.ts`).

The two pre-existing tests documenting "give up"/"look up to"'s NOUN
mis-resolution and "to be sure"/"long ago"'s wrong-homograph resolution as
correct were rewritten to assert the new, actually-correct VERB/ADVERB
resolutions instead, with comments explaining why the change is a fix, not
a regression.

**3. "few" itself needed its own PRONOUN sense.** Fixing (1) and (2) still
left one gap specific to "few": once `resolvedWordFor()` correctly prefers
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
`copyCoordinationWithFreshUuid`, `graphUuid`) -- `sense_processor.ts`'s
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
`copyCoordinationWithFreshUuid()`/`graphUuid()` against a synthetic
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
`resolvedWordFor()` -- that function always returns *some* Word (a Head
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
unset, fixed up later by `copyWordWithFreshUuid()`/
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
"as long as", the same text `linkPhraseWords()` itself split it from),
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
`copyCoordinationWithFreshUuid()` (`role/coordination_processor.ts`)
both already build/copy a `Coordination` generically (`Partial<Omit<...>>`
spread and a full object spread, respectively), so neither needed a
change to carry the new optional field. No seeder populates it yet --
`word_coordinations.json`'s own schema has no `correlative` key today,
so every existing and future entry seeds `correlative: undefined` until
a producer is written for it, the same "documented ahead of a real
producer" state `coordinator` itself started in before
`WordCoordinationSeeder` existed.

## `Phrase.complements`: real constituency parsing for the one gap `linkPhraseWords()` always had

### The reported bug: "abatement of a nuisance" silently dropped its own "of a nuisance"

"abatement of a nuisance" (00362285-n, dict/data.noun, synonymous with
"nuisance_abatement") seeds as a real NounPhrase, head "abatement" --
but its own trailing "of a nuisance" span went nowhere at all.
`classifyModifierRoles()`'s own NounPhrase branch only ever assigns
MODIFIER *before* the Head; nothing assigns any role to a token after
it. `ModifierRole.COMPLEMENT` existed in the enum and NounPhrase's own
COMPLEMENT allowed-types row already named `PrepositionalPhrase`/`Clause`
as valid fillers (`PHRASE_TYPE_DETAILS[PhraseType.NOUN_PHRASE].allowedTypes`,
data/enums/phrase_type.ts) -- but nothing in the codebase ever assigned
that role or built such a Phrase (`data/enums/modifier_role.ts`'s own
former docstring said so outright). `linkPhraseWords()`'s own former
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

### `complementStartIndex()`/`classifyComplementPhraseType()`: deciding whether a Complement span exists, and what shape it takes

Added to `role/processor/phrase_processor.ts`, alongside
`classifyModifierRoles()`'s existing Head-finding helpers, for the
three PhraseTypes that actually declare a COMPLEMENT row in their own
`PHRASE_TYPE_DETAILS[...].allowedTypes` -- NounPhrase, AdjectivePhrase,
PrepositionalPhrase (VerbPhrase/AdverbPhrase/InfinitivePhrase declare
none, so `complementStartIndex()` always returns `undefined` for them,
unchanged):

- NounPhrase/AdjectivePhrase: the first post-Head token capable of
  reading as a Preposition (`PHRASE_TYPE_PREPOSITIONS`'s own closed
  set, the same membership `classifyPhraseType()` itself already checks
  one Phrase-structure level up) starts the Complement, running to the
  end of the token list. `undefined` when no such token exists -- the
  overwhelmingly common case ("toy poodle", "highly reliable").
- PrepositionalPhrase: always `headIndex + 1`, unconditionally, when
  any token follows the Head -- PrepositionalPhrase's own structure
  ("Preposition + Noun phrase/complement + (Modifiers)") places its
  Complement immediately after its own Preposition Head, every time.
  This makes the post-Head Modifier rule `nonHeadModifierRole()` still
  carries for PrepositionalPhrase permanently unreachable in practice
  (verified: no real bundled-data test ever exercised it, only
  `postModifiers.toEqual([])` assertions) -- left in place rather than
  deleted, matching this module's own existing "kept for a case the
  real data never exercises" precedent for a couple of its other
  fallback branches.

`classifyComplementPhraseType()` decides the nested shape structurally,
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
`linkPhraseWords()` genuinely builds a real nested Phrase for, not just
an `Identifier` or a left-out gap: when `classifyModifierRoles()` finds
a COMPLEMENT position, every token from there to the end is re-joined
into text and recursively linked into a brand-new Phrase
(`buildComplementPhrase()`) via a recursive `linkPhraseWords()` call --
complete with its own `headWord`/`preModifiers`/`postModifiers`/
`determiners`/`complements`, so a span nested two Prepositions deep
resolves correctly with no separate recursion limit needed. Every token
at or past the Complement's own start index is excluded from the outer
Phrase's flat `preModifiers`/`postModifiers`/`determiners` loop --
already true for free, since none of those tokens carry MODIFIER/
DETERMINER roles any more once `classifyModifierRoles()` marks them
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
`classifyModifierRoles()` assertions updated for the same underlying
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

**Registration** (`role/processor/phrase_processor.ts`): `linkPhraseWords()`/
`buildComplementPhrase()` both take a new optional `phrases: Phrases`
parameter -- the same optional-store convention `wordForms` already
has. When supplied, `registerComplementPhrase()` finds-or-creates the
Complement directly *in* that store (`Phrases.append()`, tagged with a
new synthetic `partOfSpeech`: NOUN for a NounPhrase complement, matching
`classifyPhraseType()`'s own NOUN -> NOUN_PHRASE default; PREPOSITION
for a PrepositionalPhrase one -- genuinely used for once, since no real
WordNet-tagged Phrase is ever PREPOSITION-tagged). Dedup key: (`text`,
`phraseType`, that synthetic `partOfSpeech`) -- the identical (text, tag)
shape `word_seeder.ts`'s own WordNet Phrase append site already uses.

This dedup is what keeps the whole feature idempotent, and it had to
be: `linkPhraseWords()` already runs more than once over the same real
Phrase within a single `seedWordNet()` call (the closed-class-then-
WordNet re-link pass, this log's own earlier section on it) and again
on every repeat `seedWordNet()` call -- without reuse, each of those
would have appended its own fresh duplicate "of a nuisance" every
single time. `word_seeder.ts`'s own two real `linkPhraseWords()` call
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
runtime `nonHeadModifierRole()` ADJECTIVE_PHRASE branch (which already
treated an ADJECTIVE-capable pre-Head token as a genuine Modifier too,
"bone dry" -- degree-modifier-less compounding). `complements` is
untouched -- it stays an array, `Phrase.complements`'s own docstring on
why a Complement span never has more than one constituent in practice
even though the field's own shape doesn't structurally forbid it.

### Run-collapsing algorithm (`role/processor/phrase_processor.ts`)

`preHeadModifierRun()`/`postHeadModifierRun()`/`determinerRun()` find
the maximal contiguous same-role token span adjacent to (or, for
`determinerRun()`, anywhere in) `wordRoles` -- `[start, end)` indices,
`undefined` when no run exists. `buildModifierUnit()` resolves one such
span: length 1 -> `singleTokenModifierId()` (unchanged, the pre-existing
per-token WordForm-reference resolution `linkPhraseWords()`'s own local
`matchingFormId()` closure already did, pulled out standalone since this
function now operates on an arbitrary token sub-span, not a whole-phrase
index); length 2+ -> `coordinatingConjunctionIndex()` first (below),
falling back to `classifyModifierPhraseType()` + `buildNestedPhrase()`
(one flat nested Phrase for the whole run, `registerNestedPhrase()`'s
own find-or-create dedup against `phrases` when supplied -- the exact
mechanism `Phrase.complements`'s own `registerComplementPhrase()`
already established one section up, generalised here beyond just
Complements and renamed to match: `partOfSpeechForComplementPhraseType()`
-> `partOfSpeechForPhraseType()`, `registerComplementPhrase()`/
`buildComplementPhrase()` -> `registerNestedPhrase()`/`buildNestedPhrase()`).
`classifyModifierPhraseType()` picks the new nested Phrase's own
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
forever). `linkPhraseWords()` checks for this one case explicitly
(`detRun[0] === 0 && detRun[1] === tokens.length`) and falls back to the
run's own first token alone via `singleTokenModifierId()` instead of
collapsing -- a narrow, deliberate compromise scoped to this one real
idiom shape, not a general non-collapsing rule (verified: "each other"
own updated test now asserts `determiner` resolves "each" alone, not a
nested "each other" Phrase).

### Coordination detection: `coordinatingConjunctionIndex()`, and why it needed run-detection changes of its own

`coordinatingConjunctionIndex()` finds the one token index (strictly
between a run's own first and last position) whose own
`dictionary.lookupAll(token)` includes a real `Conjunction` Word with
`conjunctionType === ConjunctionType.COORDINATING` (`isConjunction()`,
role/processor/conjunction_processor.ts) -- `WordCoordinationSeeder`'s
own identical resolution pattern, reused rather than reinvented. Binary
split only ("X and Y") -- no comma-aware N-ary coordination, matching
the scope of the one real precedent this mirrors (`WordCoordinationSeeder`
handles N-ary via structured JSON `coordinates`, not free-text parsing).
Found -> split the run around it, resolve each side
(`resolveCoordinateSide()`: length 1 -> `resolvedWordFor()` against the
run's own target POS below; length 2+ -> one further nested Phrase, one
level only -- a coordinate side is never itself searched for a second,
nested coordination), `registerModifierCoordination(coordinations,
coordinates, coordinator)` finds-or-creates the `Coordination` in the
supplied `Coordinations` store (a linear scan over `coordinations.all()`
comparing each coordinate's own `entryId.uuid` in order plus
`coordinator?.value` -- `Coordinations` has no text index of its own to
do better with, `data/coordinations.ts`'s own documented design choice)
or builds a bare, unregistered one via `createCoordination()` when
`coordinations` is omitted, the same "optional store" convention
`wordForms`/`phrases` already have.

Getting the run itself to include the embedded coordinator at all needed
its own fix. `classifyModifierRoles()` never assigns MODIFIER or
DETERMINER to a Conjunction-only token ("and"/"or"/... resolve to
CONJUNCTION alone, never alongside NOUN/ADJECTIVE/ADVERB/DETERMINER), so
a naive contiguous-role scan stops dead at the coordinator -- "big and
red" would scan as one lone MODIFIER ("red") immediately before the
Head, with "big" and "and" left outside the run entirely, coordination
detection never even reached. `extendRunBackward()`/`extendRunForward()`
(shared by all three run-finding functions) bridge exactly one such gap:
after an ordinary same-role token, also accept a real coordinating
conjunction (`isCoordinatingConjunctionToken()`, the membership check
`coordinatingConjunctionIndex()` itself already made, pulled out so both
call sites share it) immediately followed by one more same-role token
beyond it -- one bridge deep on either side, matching
`coordinatingConjunctionIndex()`'s own binary-split-only scope.

**Coordinate resolution needed its own target-POS fix, not
`classifyModifierPhraseType()`'s.** The first working version resolved
each coordinate side against `headTargetPartsOfSpeech(classifyModifierPhraseType(tokens))`
-- reusing the same heuristic `buildNestedPhrase()`'s own non-coordination
branch already uses to pick a brand new nested Phrase's own `phraseType`.
That's the wrong POS source for a coordinate Word specifically: a
coordinate's own correct POS is already pinned down by the *role* this
run is playing in its parent Phrase (e.g. ADVERB, for a VERB_PHRASE
post-Head Modifier run), not by re-guessing from the coordinate tokens'
own ambiguous homograph set -- and the two disagree often enough to
matter. Caught live against the real bundled data: `move_back_and_forth`
(01880523-v) is a real four-token VerbPhrase ("move" Head, "back and
forth" one post-Head Modifier run); `classifyModifierPhraseType(["back",
"forth"])` picked NOUN_PHRASE (both tokens are *also* real NOUN
homographs -- "forth" names a river, capitalized "Forth"), so the
coordinate resolution searched for a NOUN "forth" and silently returned
the wrong homograph -- a Scottish river standing in for the adverb.
Fixed by adding `modifierRunTargetPos(phraseType, role, isPreHead?)`,
`nonHeadModifierRole()`'s own per-`phraseType` MODIFIER/DETERMINER
switch re-expressed as an allowed-POS *set* instead of a per-token role
decision (NOUN_PHRASE -> `{NOUN, ADJECTIVE, ADVERB}`; VERB_PHRASE/
ADVERB_PHRASE -> `{ADVERB}`; ADJECTIVE_PHRASE -> `{ADVERB, ADJECTIVE}`;
PREPOSITIONAL_PHRASE -> `{ADVERB}` pre-Head / `{ADJECTIVE}` post-Head;
DETERMINER role, any `phraseType` -> `{DETERMINER}`), computed once in
`linkPhraseWords()` from the enclosing Phrase's own `phraseType` and
passed into `buildModifierUnit()`/`resolveCoordinateSide()` directly --
`classifyModifierPhraseType()` stays exactly as it was, still used
(correctly) for the non-coordination nested-Phrase-`phraseType` decision
one branch over, since that nested Phrase gets its own full recursive
`linkPhraseWords()` pass afterward to self-correct any imprecision there,
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
through every `linkPhraseWords()` call
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
fresh `classifyModifierRoles()` pass the way its array-shaped
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
`registerNestedPhrase()`'s own dedup working end to end against real
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
label text, per above); `validateFormText()`/`role/word_processor.ts`
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
`validateDeterminer()`'s own docstring (`role/processor/determiner_processor.ts`)
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
first form registered, that `validateDeterminer()` still reports no
issues, and that "a"'s own Base Lemma Canonical Form is "a" rather than
"an").
