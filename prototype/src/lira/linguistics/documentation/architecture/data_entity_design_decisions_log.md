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

## The Linguistic Service worker no longer maintains its own copy of the Dictionary

Reported directly, with a real paragraph: ordinary open-class words like
"house" and "old" showed UNRESOLVED in the Sentence Reader UI. Traced to
`linguistics_worker.ts`'s own long-standing, explicitly documented
design: it "seeds its own Dictionary from the same Common Vocabulary
Cache the Vocabulary Service seeds -- it cannot reach across the
Vocabulary worker's own thread boundary to share that one's in-memory
Dictionary, so it builds a second, independent copy inside this
worker's own global scope" -- a `WordSeeder.seedClosedClassWords()`
pass at boot, capped at the ~3,000-word closed-class cache and
permanently blind to WordNet, no matter how much WordNet the Vocabulary
tab's own "Load WordNet" button had loaded on the *other* worker.
"house"/"old" (and virtually every open-class content word) could never
resolve there, by design, regardless of sentence complexity.

**Fix, per direct instruction: "Linguistics Worker needs to use the
Vocabulary Worker for the dictionary and not maintain its own copy" --
worker-to-worker, not relayed through the main thread.** Two follow-up
decisions, both asked directly rather than guessed:

1. *Sharing model.* `PhraseReader`/`ClauseReader`/`SentenceReader`/
   `DocumentReader` never touch the Dictionary at all -- every real
   lookup funnels through exactly one place, `GraphProcessor.processTokenCandidates()`/
   `processPhraseCandidates()`, called once per raw token before any
   phrase/clause search runs (`role/token_resolver.ts`'s own docstring
   on why). Chose **batched per-request prefetch** over true per-token
   live queries: before a read runs, the Linguistic Service asks the
   Vocabulary Service once for every candidate span the read is about
   to check, then runs the entire existing, unmodified synchronous
   reading pipeline against a small local cache built from the answer.
   The alternative -- every `dictionary.lookupAll()`-shaped call
   becoming its own async round trip, right where it happens today --
   would have rippled through `PartOfSpeechIdentifier`,
   `DictionaryProcessor.identifyWord`/`identifyPhrase`, `GraphProcessor`,
   `TokenResolver`, and `LinguisticController`, converting the whole
   read *and* write path from synchronous to async for a search that
   already tries every `PhraseType` at every token position -- far
   larger and slower for no behavioural gain, once the "everything
   funnels through one place" fact was actually confirmed.
2. *Transport.* A direct `MessageChannel` between the two workers
   (`main.ts` creates one `MessageChannel`, transfers `port1` to the
   Vocabulary worker and `port2` to the Linguistic worker, once, right
   after constructing both), not relayed through the main thread for
   every query -- matching "worker to worker not via main" exactly.

**New shared protocol**: `vocabulary/role/web_worker/dictionary_query_protocol.ts`
(imported by both workers -- the one exception to `linguistics_worker_protocol.ts`'s
own "nothing here imports from Vocabulary's worker plumbing" rule,
which governs the *client-facing* protocol file, not the worker
implementation itself, which already imports plenty from Vocabulary's
data/role layers). `LookupWordsRequest` carries `texts: string[]` --
every distinct (lowercased) whitespace-joined span
`DictionaryProcessor.identifyPhrase()`'s own longest-match search could
try, computed once per read by a new `prefetchTextsFor()` (this
worker's own `LinguisticLexer.extractTokens()` plus a generous
hardcoded `MAX_PREFETCH_SPAN` -- this worker has no independently-seeded
Dictionary of its own left to read a real span bound off of ahead of
asking, so a few harmless empty-result over-fetches beat ever
under-fetching a real multi-word match). `LookupWordsResult` carries
real `Word`/`WordForm`/`Phrase` entity objects directly -- all three are
plain data interfaces with no class instances or functions on them, so
they cross the `MessagePort`'s structured-clone transfer with no custom
serialisation at all, the requester reconstructing its own local
`Dictionary`/`WordForms`/`Phrases` by inserting them (`Phrases.append()`'s
own `partOfSpeech` parameter included in the DTO, since `Phrases` keeps
that in a private side index rather than on `Phrase` itself).

**`vocabulary_worker.ts`** answers `lookup-words` by running
`dictionary.lookupAll()`/`wordForms.lookupByText()`/`phrases.lookupAll()`
against the addressed Domain's own real seeded stores for every
requested text and posting back whatever matched -- no new matching
logic, this is the exact same read surface `DictionaryProcessor`
already exposes locally, just answered for a remote asker instead of an
in-process caller. Falls back to an all-empty result for an unseeded/
unknown Domain, the same honest "nothing yet" `identifyWord()` itself
already gives a genuinely-unseeded token.

**`linguistics_worker.ts`**: `WordSeeder`/its own seeding pass is gone
entirely. `handleInit()` now only builds an *empty*,
session-persistent `dictionary`/`phraseBook`/`wordForms` (never
rebuilt, only ever grown) and configures the grammar -- `controller`
itself is still built once, so `LexicalEvidenceStore`/`SequenceEngine`
learning state correctly persists across reads exactly as before; only
the Dictionary-backing objects underneath `DictionaryProcessor` change
shape. A new `prefetchWords()`, awaited at the top of `handleRead()`/
`handleReadDocument()` (both now `async`), does the query-and-insert
step -- idempotent by construction: `queriedTexts` skips a text already
asked for in this session, `insertedWordIds`/`insertedFormIds`/
`insertedPhraseIds` skip a real entity already inserted (the same real
Word can legitimately arrive via more than one queried text -- an exact
match and an inflected-form match both naming it, say -- and must only
ever be appended once). This also means a session that opens the
Sentence Reader before "Seed Vocabulary"/"Load WordNet" have ever been
clicked in the Vocabulary tab sees every prefetch come back empty and
every occurrence read UNRESOLVED -- correct, honest behaviour under the
new architecture (there is genuinely nothing to resolve against yet),
not a regression.

**One structural type-check needed real code, not just a story**:
`Clause.subject`'s own widened `Phrase | Clause` type (this log's own
immediately preceding section) meant `linguistics_worker.ts`'s existing
`clauseToJson()` already had to narrow it before calling `phraseToJson()`
-- untouched by this change, confirmed still correct against the new
data flow.

No test changes needed: `linguistics.test.ts` builds its own local
`Dictionary`/`DictionaryProcessor` directly, in-process, never through a
worker boundary, so none of this was reachable from the existing suite
at all -- verification for this change is necessarily live-only.
`npx tsc -b --force` clean; full `vitest run --no-file-parallelism`
173/173 unchanged (confirms this really did touch nothing the suite
exercises). Live Playwright, the real running app: seeded both
Vocabulary buttons, then read the reported paragraph in the Sentence
Reader tab -- "house" (NOUN, confidence 0.87), "old" (ADJECTIVE), "hill"
(NOUN) all now resolve with real seeded parts of speech, where every one
previously showed "Not found in the Common Vocabulary Cache". Separately
confirmed the multi-word closed-class Phrase path too ("They helped each
other." -- "each other" resolves as one PRONOUN-tagged span, not two
independent words), proving the `Phrases.append()` reconstruction side
works as well as the plain-Word side. (The paragraph's own
"stands"-as-NOUN-not-VERB misparse in that same live check is a
separate, pre-existing PhraseType-ranking ambiguity -- "stands" is a
genuine NOUN/VERB homograph and nothing in this change touches ranking
-- not a regression from this fix and out of this fix's own scope.)

## `ReadingScorer`: a genuinely ambiguous token now prefers its own VERB_PHRASE reading

The follow-up to the section above, requested directly: "look into that
suggest prioritising verbs." Traced to `ReadingScorer.rankKey()`
(`role/reading_scorer.ts`) -- the one shared ranking tuple every
candidate `SequencePath` `PhraseReader.read()` tries at a given start
position is sorted by. For "stands" in "The old house stands on the
hill.", the NOUN_PHRASE reading (plural of the furniture/vending sense
of "stand") and the VERB_PHRASE reading (third-person-singular of the
verb "stand") tie on every real correctness signal the tuple already
had -- both a bare single-token completion, both `VALID`, no open
obligations, identical `phraseCount`/`lexicalEvidenceSum` (no learned
evidence this session). The decision fell all the way through to
`candidateRankIndexSum`, which orders candidates by
`PartOfSpeechIdentifier.identifySeeded()`'s own returned order -- and
since `WordForms.lookupByText("stands")` returns whichever POS's own
`generateXForms()` happened to register that inflected spelling first
during seeding, this was an accidental tie-break, not a grammatical
judgment. Picking the noun reading here is far costlier than picking
the verb reading of a genuinely different ambiguous token would be:
`ClauseReader.assignRoles()` needs a real `VERB_PHRASE` among a
clause's own phrases to ever find a predicate at all, so the wrong
choice here doesn't just mis-tag one word -- it makes the *whole
clause* `MISSING_PREDICATE`/`INVALID`, exactly the live symptom
reported ("The old house stands on the hill." reading confidence 0.05,
INVALID).

**New `ScoringFactors.isVerbPhraseCandidate: 0 | 1`**, populated only by
`SequenceEngine.scoringFactors()` (the one call site that has a real
`SequencePath.phraseType` to read, set to `1` exactly when it's
`PhraseType.VERB_PHRASE`) -- `finiteVerbPhraseCount`'s own "only means
anything at one level" precedent one level down: `ClauseReader` builds
its own `ScoringFactors` directly via `createScoringFactors()` rather
than through `SequenceEngine.scoringFactors()`, so this field simply
never gets set away from its neutral `0` default there, contributing
nothing to a clause-level comparison (there's no single "PhraseType" a
whole clause reading has to read it from anyway). Slotted into
`rankKey()`'s tuple right after `undischargedObligationCount` --
deliberately *before* `phraseCount`/`lexicalEvidenceSum`/
`candidateRankIndexSum`, so a real correctness signal (validation, span,
obligations) still always wins outright, but this deliberate
grammatical preference now always outranks the softer/accidental
tie-breakers that used to decide ties like "stands" arbitrarily.
Negated in the tuple (`-factors.isVerbPhraseCandidate`) the same way
`phraseCount`/`lexicalEvidenceSum` already are, since `1` (is a verb
reading) needs to sort *before* `0`.

This is a tie-break, not an override: a genuinely worse VERB_PHRASE
candidate (lower validation, shorter span, more open obligations) still
correctly loses to a genuinely better non-VERB_PHRASE one -- covered by
its own dedicated test below.

`npx tsc -b --force` clean. Full `vitest run --no-file-parallelism`:
175/175 (173 prior + two new tests), both against `ReadingScorer`
directly rather than a real seeded sentence -- "stand" isn't in the
closed-class Common Vocabulary Cache `linguistics.test.ts`'s own
`seededController()` helper seeds (no WordNet), so a real end-to-end
repro would have needed this file's own first WordNet-scale fixture,
disproportionate for testing what is really just one tuple's own
ordering. One test hand-builds the exact tied scenario (both `VALID`,
identical otherwise) but deliberately gives the *noun* candidate the
*better* `candidateRankIndexSum`, to prove `isVerbPhraseCandidate`'s
own earlier tuple position genuinely outranks that later tie-break
rather than merely happening to agree with it; the other confirms a
`VALID` non-verb candidate still beats an `INVALID` verb one. Live
Playwright, the real running app, the exact reported sentence: "The old
house stands on the hill." now reads VALID (was INVALID, confidence
0.05 -> 1.00), "stands" tagged VERB/VERB_PHRASE and correctly assigned
as the clause's own PREDICATE (was NOUN/NOUN_PHRASE, MISSING_PREDICATE).
