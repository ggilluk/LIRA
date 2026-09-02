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
