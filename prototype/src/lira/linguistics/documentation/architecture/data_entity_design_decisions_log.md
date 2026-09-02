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
