# LIRA (prototype)

A standalone, browser-only port of LIRA -- TypeScript instead of
Python, no server, no Python runtime. Independent project: its own
`package.json`/`tsconfig.json`/`node_modules`, no shared tooling with
the Python repository at the root of this repo.

See the repository root's [ARCHITECTURE.md](../ARCHITECTURE.md) for
the architecture this prototype is porting -- component tree, design
principles, and architecture rules. This folder does not fork or
restate that document; it is the one source of truth for both the
Python implementation and this prototype until/unless they diverge.

## Layout

Mirrors the main repository's own layout 1:1, `src/lira/` down --
same four Architectural Layers, same per-layer subfolders
(`documentation/`, `data/`, `agents/`, `role/`, `api/`, `ui/`,
`assets/`, per ARCHITECTURE.md's Repository Layout rule), `.ts` instead
of `.py`. Vocabulary and Linguistics are ported (see below); Knowledge
carries only the Portal shell so far (also below) -- its
`data/domain.py`, `hosted_domains.py`, and tensor graph are not
ported. The rest of Value Objects (beyond the four CCTS types
Vocabulary needs) remains an empty placeholder (`.gitkeep`).

```
prototype/
├── index.html            Vite entry point
├── src/
│   ├── main.ts            app entry point (mounts into index.html's #app)
│   ├── vite-env.d.ts       Vite ambient types (import.meta.glob, etc.)
│   └── lira/
│       ├── vocabulary/     ported -- see below
│       ├── linguistics/    Service ported and wired in (data/ + role/), plus a new
│       │                   Portal-native Sentence Reader UI -- see below
│       ├── value_objects/{documentation,data,agents,role,api,ui,assets}/
│       └── knowledge/
│           ├── data/portal_domain.ts    Portal-only Domain stand-in -- see below
│           ├── ui/portal_shell.ts       Explorer/Portal shell -- see below
│           └── {documentation,agents,role,api,assets}/  (empty placeholder)
├── examples/               (empty placeholder, mirrors the root examples/)
├── package.json / tsconfig.json / vite.config.ts
```

### Vocabulary Layer (ported)

Ported from `src/lira/vocabulary/` -- `data/`, `role/`, `agents/`,
and `ui/dictionary_view.py` (plus the four `value_objects` CCTS types
it needs -- `Code`/`Identifier`/`Number`/`Text` -- and a minimal
`LinguisticUnit` base for `Word`). `assets/common/en/` is copied
verbatim from the Python package (same JSON, same schema) and bundled
at build time via `import.meta.glob`, so the app runs fully offline --
no server, no fetch to anything external.

What's the same as the Python original: `Word`'s derived-property
queries (`synonyms`, `hypernyms`, `meronyms`, ...), `Dictionary`/
`LexicalRelationshipStore`'s lookup semantics, `WordSeeder`/
`RelationshipSeeder`'s validation and seeding logic (including
`RelationshipSeeder`'s SHA-256 manifest checksum, reproduced here with
the Web Crypto API), and `DictionaryView`'s entire rendered page --
its CSS/HTML/client-side JS is extracted from the Python source
character-for-character, since that layer was already implementation-
agnostic web tech, not Python.

What deliberately differs, and why:
- No filesystem: `WordSeeder.promoteWord`/`demoteWord` mutate an
  in-memory overlay instead of writing `promoted_words.json` back to
  disk; `validateAssets()` never self-heals a missing file the way
  Python's does.
- No background thread: `AsyncDictionaryHydrator` runs each external
  dictionary-API lookup as an async `fetch()` instead of a pooled
  worker thread reading off a queue -- same dedup/telemetry behaviour,
  single-threaded JS doesn't need the thread. (WordSeeder/
  RelationshipSeeder/DictionaryView themselves *do* run on a real
  background thread -- see the Vocabulary Service below, a browser Web
  Worker, not a Python `threading` port.)
- `RelationshipSeeder.validateAssets()`/`loadRelationshipSpecs()`/
  `seedDomain()` are `async` (checksum verification uses
  `crypto.subtle.digest`, which is promise-based); their Python
  equivalents are synchronous.
- `DictionaryView.save(path)` has no filesystem to write to; the port's
  `downloadAsFile()` triggers a browser download of the same HTML
  instead.

`promoted_words.json` includes two definition-gap batches on top of the
mandatory/supplementary closed-class + metalinguistic vocabulary: every
word some other Common word's own `definition` text depended on but
that wasn't itself seeded, found by scanning `Word.definitionWords()`
against the Dictionary and promoted the same way
`WordSeeder.promoteWord` promotes any open-class word (real, hand-
authored definitions, never fabricated) -- see
`src/lira/vocabulary/assets/common/en/missing_words.json` for the
current residual gap (definition-gap closure isn't a single fixed
point: new definitions reference some words of their own) and
`examples/common_definition_gap_vocabulary_2.py`/
`examples/common_definition_gap_vocabulary_seeding_2.py` in the Python
package for the second batch's data and seeding script.

#### Lemma grouping (prototype-only schema optimisation)

`pronouns.json`/`determiners.json`/`promoted_words.json` nest 1,286
inflected-form entries under their 680 base lemmas' own entries, as a
`forms` array (each nested entry a full `WordFileEntry` plus
`derivation_kinds`, matching `relationships/morphological_relationships.json`'s
own `relationship_kind` vocabulary -- more than one kind per form is
legitimate, e.g. "measured" is both `PAST_TENSE_FORM` and
`PAST_PARTICIPLE_FORM` of "measure"), instead of every surface form
living as an independent top-level entry linked only by a separate
relationship-file edge. This is a **prototype-only divergence** -- the
Python source's own `assets/common/en/` keeps the original flat schema
untouched; only this mirrored copy was restructured, and only for
lemma pairs that resolve unambiguously to the same file with no fan-in
or morphological chain (see `word_seeder.ts`'s own module docstring
for the exact safety rules the one-time migration applied).

`WordSeeder.loadCache()` flattens every nested form back into its own
top-level `Word` exactly as if it had never been nested -- the seeded
Dictionary ends up with the identical set of Words either way (4,036,
unchanged) -- while also wiring the grouping into a new
`Dictionary.linkForm`/`formsOf`/`lemmaOf` index (keyed by `Word.uuid`,
O(1), no scan over `LexicalRelationshipStore`), which `seedFrom`
replays onto Physics's own inherited copy too.
`relationships/morphological_relationships.json` itself is deliberately
left untouched: both representations agree, and nothing else
(`Word`'s own related-word derived properties, `RelationshipSeeder`'s
checksum) needed to change to add this index.

#### Phrase support (prototype-only reading-pipeline optimisation)

The Common Vocabulary Cache has always contained closed-class
multi-word entries -- `prepositions.json`'s "in spite of"/"according
to", `subordinating_conjunctions.json`'s "as long as"/"even though",
`pronouns.json`'s "each other"/"no one" -- each one already a single
`Word` (Design Principle 1: "each lexical form must be stored as a
separate `Word`" applies just as well to a multi-word lexical form as a
single-word one; nothing about `Dictionary`'s data model needed to
change to store them). What was missing was the *reading* side: the
tokenizer split raw text into one-token-at-a-time strings and looked
each one up individually, so "in spite of" could only ever be found by
looking up that exact three-word string directly -- during an ordinary
sentence read it fragmented into "in"/"spite"/"of" as three unrelated
single-word lookups instead.

`Dictionary.phraseSpanLimit` now tracks the longest whitespace-span any
appended `Word.text` has (1 when nothing multi-word has been seeded,
so a phrase-free Dictionary pays nothing extra). `DictionaryProcessor.identifyPhrase(rawTokens,
startIndex)` tries the longest matching span down to 2 tokens before
falling back to a plain single-token `identifyWord` (which alone still
queues external hydration -- an unmatched shorter span like "in spite"
is never mistaken for a candidate of its own just because the search
happened to probe it on the way to the real 3-token match).
`TokenReading` gained `tokenSpan` (1 for an ordinary word); both the
write path (`GraphProcessor.processSentence`, via the new
`processPhraseCandidates`) and the read path
(`role/token_resolver.ts`'s `TokenResolver.resolveSentence`) now walk
the raw token stream with a cursor that advances by `tokenSpan` rather
than by 1, so "in spite of" becomes one `TokenReading` -- and, once
materialised, one `Word` node in the `Clause`/`Sentence` tree -- the
same way it's already one `Word` in the Dictionary. `SequenceEngine`/
`PhraseReader`/`ClauseReader` needed no changes at all: they already
treat their `tokens` argument as an opaque ordered sequence indexed by
array position, never by raw-token offset, so a shorter, phrase-
collapsed array is simply a shorter sequence to search over.

This is a **prototype-only** capability, same divergence class as the
lemma grouping above -- Python's `role/token_resolver.py`/
`role/graph_processor.py` still resolve one raw token at a time, so a
multi-word Common Vocabulary Cache entry is reachable there only by
looking it up directly, not while reading a real sentence.

### Linguistics Layer (Service ported and wired in; new Portal UI)

Ported from `src/lira/linguistics/` -- `data/` and `role/` (the full
grammar/parsing engine: `GrammarConfigurator`'s phrase/clause/sentence
rule tables, `SequenceEngine`'s bounded beam search, `PhraseReader`/
`ClauseReader`/`SentenceReader`, `GraphProcessor`, `LinguisticController`)
plus `ui/user_prompt.ts` (a plain data type despite living in `ui/` in
the Python original -- see that file's own docstring). Deliberately
**not ported**: `sentence_reader_view.py`/`sentence_reader_server.py`
themselves -- this layer's UI is a new component built directly against
the Portal shell (`linguistics/ui/sentence_reader_view.ts`, see below),
not a port of those two files, though it draws its visual language from
them.

Verified against the real seeded Common Vocabulary Cache, not
synthetic fixtures: `readSentence("A meaning is a representation.")`
comes back `VALID` with a `NOUN_PHRASE` subject, a `VERB_PHRASE`
predicate, and (because "is" is a linking verb) a `NOUN_PHRASE`
**complement**, not an object; `readSentence("The fox over the dog.")`
-- spec 20's own worked example -- comes back `INVALID` with no
predicate found, even though both its `NOUN_PHRASE` and
`PREPOSITIONAL_PHRASE` are individually valid.

What deliberately differs from the Python original, and why:
- Python's module-scope deferred imports (`from lira.vocabulary import
  PartOfSpeech` inside a function body) exist purely to dodge a
  Python-level circular import within its own package. TypeScript's
  module graph has no equivalent cycle (`vocabulary/data/word.ts` only
  depends on the leaf `linguistics/data/linguistic_unit.ts`, never on
  anything in `linguistics/role/`), so `PartOfSpeech`/`Word`/
  `WordIdentification` are imported normally at the top of every file
  that needs them.
- Where Python instead left `ReadingContext`/`GrammarConfigurator`/
  `TokenReading` as bare string type hints in `data/phrase.py` etc.
  (needed only for static analysis, never imported), the TypeScript
  port uses real `import type` declarations for the same names --
  erased at compile time, so this still never becomes a runtime
  circular import, but it's now actually type-checked rather than
  merely hinted.
- `Phrase`/`Clause`/`Sentence`/etc. are plain data interfaces plus a
  `createX()` factory and a `readX()` free function (mirroring
  `vocabulary/data/word.ts`'s own derived-property pattern), not
  dataclasses with a `@classmethod read()` -- `readPhrase(tokens,
  context, options)` reads right-to-left instead of
  `Phrase.read(tokens, context=...)`, same delegation-only content.
- `GraphProcessor`'s short per-row id (Python: `uuid.uuid4().hex[:6]`)
  becomes `crypto.randomUUID().replace(/-/g, "").slice(0, 6)` --
  browser-native, same shape.

#### Linguistic Service (a real Web Worker)

`linguistics/role/linguistics_worker.ts` runs a `WordSeeder` +
`LinguisticController` inside its own browser Web Worker -- the same
"browser-tab stand-in for a server-side process" role
`vocabulary/role/vocabulary_worker.ts` plays for Vocabulary, given its
own message protocol (`linguistics_worker_protocol.ts`) and main-thread
client (`LinguisticsWorkerClient`) of the same shape (`init()`, an
`onStatus` listener fan-out, and here a `read(text)` call instead of
`renderDomain(name)`). It seeds its **own** copy of the Common
Vocabulary Cache inside its own worker -- it has no way to reach across
the Vocabulary worker's separate thread boundary to share that one's
in-memory `Dictionary` -- the same way two real backend services would
each hold their own working copy of shared reference data rather than
share a process. That does mean "known words" here is exactly the
Common Vocabulary Cache's closed-class + metalinguistic word list
(~4,036 words), not the full English language: typed text using
ordinary open-class vocabulary outside that list reads back
`UNRESOLVED`, honestly, the same as the Python original would against
the same cache slice.

`read(text)` returns `{predicted, trace}` -- a JSON-safe mirror of one
read `Sentence` (`JsonSentence`/`JsonClause`/`JsonPhrase`, camelCase
versions of `sentence_reader_server.py`'s own `_sentence_to_json`/
`_clause_to_json`/`_phrase_to_json`) plus the full per-token-position
search trace `role/phrase_reader.ts`'s `positionTrace()` already builds
(every phrase type tried, whether its start state matched, every
completion considered, which one won). Both worker chunks -- Vocabulary
(~5MB, its own Common Vocabulary Cache copy) and Linguistics (~2.8MB,
a second copy plus the whole grammar engine) -- load and seed in
parallel; `main.ts` gates the LoadingScreen on both before mounting the
real `PortalShell`.

#### Sentence Reader (linguistics/ui/sentence_reader_view.ts)

A new Portal-native UI component -- **not** a port of
`sentence_reader_view.py`/`sentence_reader_server.py` (see those files'
own docstrings: a full standalone page with its own masthead, its own
`:root` tokens, and a `fetch("/api/read")` call against a local Python
HTTP server). This component is built directly against the Portal
shell's own composition instead: it assumes the shell's `--ground`/
`--surface`/`--accent`/etc. tokens already exist on an ancestor element
rather than defining its own, it never renders a title of its own (the
Portal topbar's breadcrumb is the only title), it reflows via a CSS
grid with `auto-fit`/`minmax` columns rather than a viewport-width media
query (so it stacks correctly at the Portal pane's own, narrower-than-
viewport width), and "reading" a sentence calls
`LinguisticsWorkerClient.read()` directly instead of `fetch()`-ing a
local server -- there is no server anywhere in this port. What *is*
carried over from the old page, since it's what "look at the old UI for
inspiration" asked for, is the visual language: part-of-speech chip
colours, validation badge colours, and the position/attempt/completion
shape of the trace panel -- labelled "Full trace — word prediction"
here, since that's what the old trace panel actually *is*: not a
separate autocomplete feature, but the state machine's own per-token,
per-position record of which phrase types it predicted and tried before
settling on a winner.

Selectable from the Portal's component switcher (Vocabulary /
Linguistics / Knowledge) once both worker Services report ready; type or
paste any text, or pick one of five quick examples (the same worked
examples `sentence_reader_server.py`'s own `DEFAULT_QUICK_EXAMPLES`
ships, chosen there to exercise a spread of outcomes), and see the
predicted structure plus the full trace update live. A "Learning"
checkbox next to the Read button (on by default) controls whether that
read reinforces the state machine's own learned lexical evidence -- see
below.

#### Learned lexical transition evidence (spec 15-24)

`linguistics/documentation/sentence_reading_state_machine_specification.md`
describes a `[Proposed]` future phase -- persistent learned evidence
`w_ij` for one observed `(phraseType, fromState -> toState)` transition,
feeding the existing `ScoringFactors.lexicalEvidenceSum` field (declared
since the initial Linguistics Service port, but always `0` at phrase
level until this). `role/lexical_evidence_store.ts`'s `LexicalEvidenceStore`
is a first, deliberately scoped implementation of that design: an
in-memory `Map` (no cross-session persistence -- out of scope for what
this UI needs to demonstrate), positive-only evidence (spec 18's decay
is explicitly future "learning-policy", not this phase), one store per
`LinguisticController`, always constructed but functionally inert
(every `weightFor()` call returns `0`, identical to pre-learning
behaviour) until something actually calls `recordObservedReading()`.

`LinguisticController.recordObservedReading(sentence)` is gated on the
whole sentence's `ValidationOutcome.VALID` (spec 17: "Only validated
observations may reinforce lexical evidence") and walks every phrase's
materialised words, recording each real POS-to-POS transition. Reading
the same or a similarly-structured sentence again feeds those counts
into `SequenceEngine.scoringFactors()`'s own `lexicalEvidenceSum` for
every future candidate path with a matching transition -- a tie-break
signal only (`ReadingScorer.rankKey` still ranks `validation` first, so
learned evidence can never make an `INVALID` reading outrank a `VALID`
one, spec 15's own invariant), which is exactly what lets repetition
shift preference among candidates that stay grammatically admissible
without ever touching `GrammarConfigurator` itself.

The Sentence Reader UI's "Learning" checkbox (default on) is sent fresh
with every `read()` call (`ReadRequest.learningEnabled`); the worker
reports back real accumulated state (`ReadResult.learning` --
`totalObservations`, this read's own `recordedThisRead`) rather than
the UI just echoing the checkbox, so the panel's "Learning: N
observations" indicator reflects genuine state, not a decorative
toggle.

### Portal shell (knowledge/ui/portal_shell.ts)

The app shell around `DictionaryView` -- a Windows-Explorer-style desktop
layout (persistent folder tree + view pane) that switches to a
drill-down mobile portal via a real toggle in its own title bar, not
just a `@media` breakpoint. The folder tree *is* the Domain hierarchy:
root is "All Domains", and nesting follows each Domain's real parent --
`main.ts` registers "Physics" under "Common" and bootstraps it with
`Dictionary.seedFrom(common)`, the actual mechanism a freshly created
Domain uses to inherit Common's vocabulary (vocabulary/data/dictionary.py),
so Physics's 4,036 words in the running app are genuinely inherited, not
fabricated to make the tree look populated.

`PortalDomain`/`PortalDomainRegistry` (knowledge/data/portal_domain.ts)
are a deliberately minimal stand-in for the real `Domain`/`HostedDomains`
(knowledge/data/domain.py, hosted_domains.py) -- neither is ported yet
(both depend on Linguistics, the Knowledge tensor graph, and D5/D6
domain-position math). They carry only a name, an optional parent, and
the counts a tree row shows -- enough to draw a tree. When
`Domain`/`HostedDomains` are ported, this type should be replaced by
them, not extended to fake the parts it's missing.

Above the view pane sits a component switcher -- Vocabulary /
Linguistics / Knowledge, one button per Architectural Layer that has (or
will have) a UI component. Vocabulary and Linguistics are enabled;
Knowledge renders as a visibly disabled tab ("Not ported yet") rather
than being hidden, so the shell's own shape doesn't imply LIRA only ever
has these two layers. The Linguistics tab mounts a `SentenceReaderView`
(see above) -- unlike Vocabulary it isn't per-Domain data, so it renders
the same regardless of which Domain node is selected in the tree.
Selecting a Domain with Vocabulary active asks the Vocabulary Service
(below) to render it and mounts the result *directly into the shell's
own DOM* --
`DictionaryView.renderFragment()`'s style/body/script pieces, the same
composition Python's `LiraView` uses to combine views, not an `<iframe
srcdoc>` the way this shell's first version worked. That matters for two
things an iframe couldn't give it: the fragment's CSS inherits the
shell's own `--ground`/`--surface`/`--accent`/etc. tokens (defined once
in `portal_shell.ts`, copied verbatim from dictionary_view.py's own
`:root` block) instead of laying out for a full browser window, and
`DictionaryView`'s own masthead/title -- which `renderFragment()`
excludes by design -- is never in the picture; the Portal topbar's
breadcrumb is the *only* title the pane ever shows. The fragment's
`<script>` is injected via a real `<script>` element (`innerHTML` never
executes an injected script) wrapped in its own IIFE, so a second
Domain's fragment mounted later can't collide with the first's top-level
`const`s. The Service still caches each Domain's render itself, so
switching back and forth doesn't re-render.

Try it: `npm run dev` opens directly into the shell -- click between
Common and Physics in the tree (or the mode pill to see the mobile
drill-down), no separate route needed.

### Vocabulary Service (a real Web Worker)

`WordSeeder`/`RelationshipSeeder`/`DictionaryView` all run inside an
actual browser Web Worker (vocabulary/role/vocabulary_worker.ts), not on
the main thread -- the browser-tab stand-in for a server-side Vocabulary
process, and literally why the page stays responsive while ~3,100 words
and ~6,100 relationships get seeded and rendered. Nothing in that
pipeline touches the DOM (it's all pure data/string logic, same as the
Python originals), so it runs unmodified in the worker; only status
messages and rendered HTML strings cross back over `postMessage`.

`vocabulary_worker_protocol.ts` defines that message shape once, shared
by both sides. `VocabularyWorkerClient` (main thread) wraps it in two
promise-based calls -- `init()` (seed everything, resolve with a summary
per Domain) and `renderDomain(name)` (render-or-return-cached, resolve
with a `RenderedFragment` -- `{style, body, script}`, the same three
pieces `DictionaryView.renderFragment()` returns) -- and fans the
worker's status messages out to any number of listeners, so the
LoadingScreen and the persistent ServiceStatusView panel can both watch
the same live status without knowing about each other.

Splitting the worker into its own Vite chunk was a deliberate win, not
just an architectural one: the ~5MB bundled Common Vocabulary Cache now
loads in the worker's chunk, not the main thread's -- `npm run build`'s
main entry chunk dropped from ~5MB to ~23KB once the worker took over
seeding and rendering.

### Loading screen and Background Services panel

`knowledge/data/service_status.ts` (`ServiceStatusBoard`) is a small
observable status registry -- one row per Service (`"idle"` /
`"running"` / `"done"` / `"error"`, or the permanent `"not-ported"` for
a layer with no Service at all yet). `main.ts` registers three rows up
front (Vocabulary, Linguistic, Knowledge) before the worker has done any
work, so the very first paint already shows the full picture, not just
what's ready so far.

Two UI Components read the same board:
- `LoadingScreen` (knowledge/ui/loading_screen.ts) -- the "LIRA
  Initialising" box, mounted immediately and shown until **both** the
  Vocabulary and Linguistic Services report `"done"` (`main.ts` gates on
  `Promise.all([vocabularyClient.init(), linguisticsClient.init()])`).
  Since it's driven by the same board each worker updates via its own
  client's `onStatus`, its checklist reflects genuine progress from both
  ("Seeded 4036 words — seeding relationships…" for Vocabulary, "Seeded
  4036 words — configuring grammar…" for Linguistics), not a fake timer.
- `ServiceStatusView` (knowledge/ui/service_status_view.ts) -- the
  persistent "Background Services" panel under the component switcher
  in `PortalShell`, showing the same rows on an ongoing basis. Each
  Service's `"done"` state displays as "Running", not "Ready"/finished
  -- both workers stay alive and keep handling requests (`renderDomain`
  for Vocabulary, `read` for Linguistics), live processes, not one-shot
  scripts that exit once their initial work completes.

## Tooling

- **Vite** -- dev server and browser build.
- **TypeScript**, strict mode.
- **Vitest** -- test runner (`jsdom` environment).

## Install and run

```
npm install
npm run dev        # dev server with hot reload
npm run build      # type-check (tsc -b) + production build to dist/
npm run preview    # serve the production build locally
npm test           # run the Vitest suite once
npm run test:watch # Vitest in watch mode
```
