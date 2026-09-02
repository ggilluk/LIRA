# Linguistics Layer -- Data Entity Design Decisions Log

This is the Linguistics Layer's own counterpart to Vocabulary's
`data_entity_design_decisions_log.md` (`vocabulary/documentation/architecture/`)
-- a running record of real shape/behaviour decisions made about this
layer's own data entities, in the same prose style, kept alongside the
code rather than in a separate planning document.

## `Clause`: split into `MainClause`/`SubordinateClause`

Requested directly: "A Clause should have two types MainClause and
SubordinateClause." Asked how these should be structured given
`Clause` already carries a 4-value `ClauseType` (`INDEPENDENT`/
`DEPENDENT`/`RELATIVE`/`COORDINATED`, `data/clause_type.ts`) with only
`INDEPENDENT` actually implemented (`ClauseReader` has no clause-level
recursion yet for the other three -- that enum's own docstring): **real
subtypes narrowing `Clause` by `clauseType`**, mirroring the pattern
Vocabulary's `Phrase`/`NounPhrase`/`VerbPhrase`/... already established
(`vocabulary/data/entities/noun_phrase.ts`) rather than collapsing
`ClauseType`'s own four values down to two or adding a second,
independent classification axis alongside it.

**Mapping, also asked directly**: `ClauseType.INDEPENDENT` alone maps to
`MainClause`; `DEPENDENT`/`RELATIVE`/`COORDINATED` together map to
`SubordinateClause`. This is a deliberately simpler binary split than
the alternative offered (`INDEPENDENT` + `COORDINATED` -> Main, since a
coordinated clause is grammatically still built from two independent
clauses joined by a conjunction) -- keyed on "is this the one
`ClauseType` a real `ClauseReader.read()` call actually produces today,"
not a finer-grained grammatical-independence judgment that would
pre-empt how Phase 2's own clause-level recursion (which will actually
construct a `COORDINATED` clause) eventually gets designed.

**Two new files, `linguistics/data/main_clause.ts` and
`subordinate_clause.ts`**, placed directly in `data/` alongside
`clause.ts`/`phrase.ts` (this layer has no `data/entities/` subdirectory
the way Vocabulary's does -- `phrase.ts` itself already lives flat
here). Each narrows `Clause.clauseType` to a literal type
(`ClauseType.INDEPENDENT` for `MainClause`; the 3-member literal union
`SubordinateClauseType = ClauseType.DEPENDENT | ClauseType.RELATIVE |
ClauseType.COORDINATED` for `SubordinateClause`), with matching
`createMainClause()`/`createSubordinateClause()` constructors (thin
wrappers over the base `createClause()`, `createNounPhrase()`'s own
identical shape) and `isMainClause()`/`isSubordinateClause()` type
guards (`isNounPhrase()`'s own identical shape). `Clause` itself keeps
its own optional, unnarrowed `clauseType?: ClauseType` -- it stays the
general base type every existing consumer (`Sentence.clauses`,
`GrammarConfigurator`, `SequenceEngine`, the web worker + its protocol,
...) already types against, rather than becoming a literal union that
would force every one of those call sites to narrow; only code that
specifically wants a resolved main/subordinate clause reaches for the
new subtypes. `createClause()`'s own init parameter got a proper
exported `ClauseInit` type (`Pick<Clause, "text"> & Partial<Clause>`,
previously inlined) so the two new files' own `MainClauseInit`/
`SubordinateClauseInit` types could build on it rather than
re-declaring the same shape, `vocabulary/data/entities/phrase.ts`'s own
exported `PhraseInit` being the precedent for naming it at all.

**`role/clause_reader.ts`'s one real construction site** (`ClauseReader.read()`'s
successful path -- the only place in this codebase that ever resolves a
`ClauseType` at all) now calls `createMainClause()` instead of
`createClause({..., clauseType: ClauseType.INDEPENDENT})` directly --
this is a real, not merely declared-ahead-of-a-seeder, change: every
clause a real sentence reading resolves in this phase now genuinely
*is* a `MainClause`, checkable with `isMainClause()`. `SubordinateClause`
stays declared-ahead-of-its-own-seeder for now, the same state several
Vocabulary `Phrase` subtypes started in (`noun_phrase.ts`'s own
docstring on that distinction) -- `ClauseReader.read()`'s own
`emptyClause()` fallback (no valid clause template/sequence found)
still returns a plain, unresolved `Clause` with `clauseType: undefined`,
never guessed into either subtype, `clause_type.ts`'s own long-standing
"never guessed into INDEPENDENT" rule extended to cover this split too.

No behaviour change for any existing reading: `MainClause`'s own
`clauseType` value is still plain `ClauseType.INDEPENDENT`, so every
already-passing assertion against `clause.clauseType` keeps working
unmodified. `npx tsc -b --force` clean. Full `vitest run
--no-file-parallelism`: 170/170 (169 prior + one new test), including a
new `isMainClause`/`isSubordinateClause` assertion added to the existing
"reads a well-formed declarative sentence" test (confirming a real
seeded reading resolves to a genuine `MainClause`) and one new synthetic
test -- hand-built `SubordinateClause` values via `createSubordinateClause()`
for all three of `DEPENDENT`/`RELATIVE`/`COORDINATED`, since no real
`ClauseReader.read()` call produces one yet (this layer's own equivalent
of Vocabulary's synthetic-only Coordination tests, used for the identical
reason: no real code path exists to seed the case from).

## `MainClause`: split further into `DeclarativeMainClause`/`InterrogativeMainClause`/`ImperativeMainClause`/`ExclamativeMainClause`

Requested directly, with all four examples given: "She opened the door."
(declarative), "Did she open the door?" (interrogative), "Open the
door." (imperative), "What a beautiful day it is!" (exclamative).
`MainClause` narrows further into these four, one per communicative-act
mood, the identical narrowing pattern its own split from `Clause` just
established (`main_clause.ts`'s own docstring) -- each new subtype
narrows a new `mood` field down to one literal value.

**`mood` reuses `SentenceType` (`data/sentence_type.ts`) rather than a
new enum.** `SentenceType`'s own four values -- `DECLARATIVE`/
`INTERROGATIVE`/`IMPERATIVE`/`EXCLAMATORY` -- already name exactly this
same communicative-act classification, and its own docstring already
frames the sentence-level version as a stand-in for a genuine
clause-level judgment it doesn't make yet ("distinguished purely by
terminal punctuation... none of them enforce distinct word-order
grammar"). Introducing a second, near-identical 4-value enum inside the
same layer purely to rename `EXCLAMATORY` to the requested class name's
own "Exclamative" would have duplicated one taxonomy for no real gain --
"exclamative" and "exclamatory" name the identical grammatical mood, so
`ExclamativeMainClause` (the requested class name, kept verbatim) narrows
`SentenceType.EXCLAMATORY` (the existing value, kept verbatim) rather
than inventing `ClauseMood.EXCLAMATIVE` alongside it. This also leaves
the door open for the natural future fix `SentenceType`'s own docstring
already gestures at -- deriving `Sentence.sentenceType` from its own
`MainClause.mood` once real mood-classifying grammar exists, instead of
purely from terminal punctuation -- without a second enum standing in
the way.

**`mood?: SentenceType` lives on base `Clause`, not only on `MainClause`**,
the identical precedent `Phrase.complements` already set in Vocabulary
(declared on base `Phrase` even though only three of its six subtypes
ever populate it, `noun_phrase.ts`'s own docstring) -- documented as
only ever meaningful for a `MainClause` (an embedded `SubordinateClause`
carries no independent illocutionary force of its own the same way).

**Four new files** (`declarative_main_clause.ts`/`interrogative_main_clause.ts`/
`imperative_main_clause.ts`/`exclamative_main_clause.ts`), each the
identical shape: an interface narrowing `mood` to one `SentenceType`
literal, a `create*()` constructor, and an `is*()` type guard checking
both `clauseType === INDEPENDENT` and the specific `mood` value (so a
`SubordinateClause` can never accidentally satisfy one of these, even
though `mood` is typed on base `Clause`).

**Declared ahead of their own detector**, the identical state
`SubordinateClause` started in one section up: `ClauseReader` has no
mood-classifying grammar at all yet -- subject-absence detection for
`IMPERATIVE`, subject-auxiliary inversion for `INTERROGATIVE`, wh-fronting
for `EXCLAMATIVE` are all real, unimplemented Phase 2 work (`SentenceType`'s
own docstring already names exactly this gap for the sentence-level
version). No `ClauseReader.read()` call sets `mood` today, so it stays
`undefined` on every real `MainClause`; only a hand-built value via one
of the four new `create*()` functions is ever one of these subtypes right
now. `ImperativeMainClause`'s own docstring separately notes that once a
real one IS built, it will correctly have no `subject` at all
(`SentenceType`'s own docstring on why `IMPERATIVE` needs its own
`ClauseTemplate` with `subjectRequired=false`), unlike the other three.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
171/171 (170 prior + one new test) -- one new synthetic test hand-building
all four subtypes via their own constructors and checking every `is*()`
guard against every sibling mood, not just its own, mirroring the
`SubordinateClause` synthetic test's own reasoning: no real reading
exercises this yet, so the coverage has to be built by hand.

## `subject`/`predicate`: narrowed per `MainClause` mood subtype

Requested directly, as an exact table: for `DeclarativeMainClause`/
`InterrogativeMainClause`/`ExclamativeMainClause`, `subject` permits
`NounPhrase, PrepositionPhrase, Clause` and `predicate` permits only
`VerbPhrase`; for `ImperativeMainClause`, `subject` permits `null,
NounPhrase` (`null` read as "absent" -- this codebase represents
"no value" as `undefined` via an optional field everywhere, `Clause`'s
own `?:` fields, never a literal `null` type) and `predicate` still
permits only `VerbPhrase`.

**A real gap this surfaced: this layer had no `NounPhrase`/`VerbPhrase`/
`PrepositionalPhrase` subtypes of its own to narrow onto at all.**
Vocabulary has `NounPhrase`/`VerbPhrase`/`PrepositionalPhrase`
(`vocabulary/data/entities/*.ts`), but those narrow a *stored lexicon
entry* -- structurally incompatible with this layer's own `Clause.subject`/
`predicate`, which `ClauseReader.assignRoles()` only ever assigns from
this layer's *own* `Phrase` (`data/phrase.ts`, a live parse-search
result -- `words`, `nestedPhrases`, `validation`, `confidence`, ... none
of which a Vocabulary `Phrase` carries; this exact Linguistics-Phrase-
vs-Vocabulary-Phrase split was walked through in detail in an earlier,
plan-only conversation this session). Reusing Vocabulary's types here
would have been a straight type error against what `ClauseReader`
actually builds, so three new files -- `data/noun_phrase.ts`/
`verb_phrase.ts`/`prepositional_phrase.ts` -- add this layer's *own*
`NounPhrase`/`VerbPhrase`/`PrepositionalPhrase`, narrowing this layer's
own `Phrase` by `phraseType` the identical way `MainClause`/
`SubordinateClause` narrow `Clause` by `clauseType`. No `create*()`
constructor in any of the three (unlike Vocabulary's own subtype files,
each of which has one): nothing in this layer ever constructs a Phrase
for one specific `PhraseType` directly -- `PhraseReader.buildPhrase()`
is the one real construction site, and it assigns `phraseType`
generically from whichever `SequencePath` won, never through a
per-PhraseType constructor, so a same-shaped constructor here would
have no caller. Only the AdjectivePhrase/AdverbPhrase/InfinitivePhrase
three of `PhraseType`'s own six values were left unmirrored -- nothing
in the requested table needs them yet, and adding all six now would
have been unused scaffolding beyond what was asked.

**Base `Clause.subject` widened to `Phrase | Clause`** (self-referential,
`nestedClauses`'s own precedent already on `Clause`) so that a mood
subtype's own narrowed union (which includes `Clause`, for a nominal
clause subject like "The fact that she left surprised me.") stays a
legal, covariant narrowing of its base type -- TypeScript requires this:
a subtype's own field type must remain assignable to what its base
interface declares, and `Clause` itself is not a `Phrase` (no `words`/
`nestedPhrases`/... of its own), so the un-widened base type would have
made every one of the four subtypes' own `subject` narrowing a compile
error. `predicate` needed no equivalent widening -- every one of the
four moods' own table row permits only `VerbPhrase`, itself already a
`Phrase`.

**Per-subtype narrowing, exactly the table**:
`DeclarativeMainClause`/`InterrogativeMainClause`/`ExclamativeMainClause`
(`declarative_main_clause.ts`/`interrogative_main_clause.ts`/
`exclamative_main_clause.ts`) all narrow identically -- `subject?:
NounPhrase | PrepositionalPhrase | Clause; predicate?: VerbPhrase` --
repeated three times rather than factored into one shared named type:
the three files' own interfaces are otherwise independent (each its own
mood), and a shared alias would have had no sensible name that also
covered `ImperativeMainClause`'s own different union, so this stayed
three short, plain repetitions rather than a forced abstraction.
`ImperativeMainClause` (`imperative_main_clause.ts`) narrows to just
`subject?: NounPhrase; predicate?: VerbPhrase` -- the requested table's
own narrower row, covering the rarer explicit-subject/vocative
imperative ("You open the door.") without ever admitting a
PrepositionalPhrase or embedded Clause subject, neither of which is a
grammatical imperative subject shape. Each subtype's own `*Init` type
(`DeclarativeMainClauseInit`, etc.) was narrowed the identical way,
mirroring Vocabulary's own `NounPhraseInit`'s precedent of narrowing the
constructor's own init shape too, not just the resulting interface --
otherwise a caller could still pass a disallowed value through
`create*()` and only find out from a wider, unhelpful `Phrase` type.

**Two real downstream consumers needed a narrow, not a rewrite**, once
`Clause.subject` admitted `Clause` as well as `Phrase`:
`role/web_worker/linguistics_worker.ts`'s `clauseToJson()` (`clause.subject`
now needs distinguishing before it can be handed to `phraseToJson()`,
which only knows how to serialize a `Phrase` -- no JSON shape exists yet
for an embedded Clause subject, Phase 2 clause-embedding work, so this
reports `null` for that case exactly the way `phraseToJson(undefined)`
already does) and one existing `linguistics.test.ts` assertion reading
`clause.subject?.phraseType` off a real `ClauseReader.read()` result
(cast, since a real reading only ever assigns a `Phrase` there today --
no clause-embedding grammar exists to ever produce the `Clause` half of
the union). Both use the identical `"words" in ...`/cast-based
distinction: a real `Phrase` always carries a `words` field, a `Clause`
never does (it carries `tokens` instead), so this cheaply tells the two
apart without a third, dedicated discriminant field.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
173/173 (171 prior + two new tests) -- one hand-building a `NounPhrase`/
`PrepositionalPhrase`/`VerbPhrase`/embedded `Clause` and confirming each
constructs into `DeclarativeMainClause.subject`/`.predicate` correctly,
one confirming `ImperativeMainClause` accepts a `NounPhrase` subject or
none at all. No real `ClauseReader.read()` call exercises any of this
narrowing yet (same "declared ahead of its own detector" state the mood
subtypes themselves are already in), so, like those, this is
synthetic-only coverage.
