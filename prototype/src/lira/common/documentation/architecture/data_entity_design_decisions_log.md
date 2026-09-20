# Common Layer -- Data Entity Design Decisions Log

This is the Common Layer's own counterpart to Vocabulary's and
Linguistics's `data_entity_design_decisions_log.md` (`vocabulary/`/
`linguistics/documentation/architecture/`) -- a running record of real
shape/behaviour decisions made about this layer's own data entities, in
the same prose style, kept alongside the code rather than in a separate
planning document.

## Move `PortalShell`/`ServiceStatusView`/`LoadingScreen`/`PortalDomain`/`ServiceStatusBoard` from Knowledge to Common

Requested directly: "move the common classes for the ui portal to the
common folders." `vocabulary/ui/` and `knowledge/ui/` were inspected
first -- every file under `vocabulary/ui/` turned out to be a verbatim
slice of one monolithic ported page (`dictionary_view.py`), with
Vocabulary-specific content (hardcoded WordForm columns, `WORDS`/
`PHRASES`/`SENSES` data bindings, tab names) mixed into the same files
as anything more generic, so nothing there was a clean move without a
deeper split. `knowledge/ui/`, by contrast, already was the generic
piece: `portal_shell.ts`, `service_status_view.ts`, and
`loading_screen.ts` (plus their own supporting data,
`knowledge/data/portal_domain.ts`/`service_status.ts`) only ever host
and compose *other* layers' views -- they carry no Knowledge-domain
business logic of their own. Their own docstrings already said so
directly: `ServiceStatusAction`'s own comment reads "Generic (Knowledge
doesn't know what WordNet is)", and `ServiceStatus`'s own docstring
explained it "Lives in Knowledge... alongside PortalShell/LoadingScreen/
ServiceStatusView" only because "Knowledge is already where cross-layer
composition UI lives" -- a parking-spot justification, not a real
conceptual home. `PortalDomain`'s own docstring goes further, calling
itself "deliberately NOT a port of the real `Domain`
(knowledge/data/domain.py)" -- a stand-in for the day the real
Knowledge-layer `Domain`/`HostedDomains` concepts get ported, at which
point `PortalDomain` should be replaced, not extended.

Moved all five, preserving their relative layout (`common/ui/
portal_shell.ts`, `service_status_view.ts`, `loading_screen.ts`;
`common/data/portal_domain.ts`, `service_status.ts`) so every internal
relative import (`../data/service_status`, `./service_status_view`)
kept working unchanged -- the only real edits were `src/main.ts`'s own
four top-level `lira/knowledge/...` imports (now `lira/common/...`) and
a handful of docstring path references elsewhere in the codebase
(`vocabulary/data/entities/domain.ts`, `vocabulary/role/web_worker/
vocabulary_worker_protocol.ts`, `linguistics/ui/sentence_reader_view.ts`,
`linguistics/role/web_worker/linguistics_worker_protocol.ts`) that named
the old `knowledge/ui/portal_shell.ts`/`knowledge/data/*.ts` paths in
prose. `ServiceStatus`'s own "Lives in Knowledge... since Vocabulary must
not depend on Knowledge" sentence was reworded to "Lives in Common...
since Vocabulary must not depend on Common" -- the same layering
constraint, under its new name.

Left behind, deliberately: every reference to the real Knowledge
*domain* concept (`ComponentId`'s own `"knowledge"` tab,
`knowledge/data/domain.py`/`hosted_documents.py` in `PortalDomain`'s own
docstring, the "Vocabulary / Linguistics / Knowledge" component switcher
itself) -- those describe the actual, still-unported Knowledge
Architectural Layer, not this shell's own former file location, and stay
exactly as they were. `knowledge/ui/` and `knowledge/data/` are now
empty (each gets a `.gitkeep`, matching every other currently-empty
layer subfolder's own convention) -- ready for the real Knowledge-layer
port (`Domain`/`HostedDomains`) whenever that happens, not deleted.

`npx tsc -b --force` clean; `npx vitest run --no-file-parallelism`
188/188, unchanged (a pure move plus import-path edits, no logic
touched). Live Playwright verification (a temporary `--no-save`
`playwright` install against this environment's pre-installed Chromium,
removed again afterward): the real `npm run dev` page loads, the
`PortalShell` mounts with its tree/component-switcher/service-status/
vocab-toolbar all present, and switching to the Linguistics tab mounts
`SentenceReaderView` correctly too -- confirming the cross-file relative
imports and `main.ts`'s own updated import paths all resolve correctly
at runtime, not just under `tsc`.

## Add `Logger`/`LogEventBoard` and an Event Log viewer in `ServiceStatusView`

Requested directly: "Update the service status to including a log event
viewer. Create logger.ts role in common. Update seeder to log events."
`common/data/log_event.ts` adds `LogEvent`/`LogEventBoard` --
`ServiceStatusBoard`'s own observable-store shape (`append`/`all`/
`subscribe`), one level more detailed: many timestamped `LogEvent` rows
accumulate over a session (capped at 300, oldest dropped) instead of one
`ServiceStatus` row being overwritten in place.
`common/role/logger.ts` adds `Logger` -- the one place calling code
turns "something happened" into a real, timestamped event and hands it
to a `LogSink` (a plain callback, not a direct `LogEventBoard`
dependency) -- and `ServiceStatusView` (`common/ui/`) grew a second,
independently collapsible "Event Log" section beneath Background
Services, most-recent-event-first, rendering whatever `LogEventBoard` it
was constructed with (optional, same "caller just omits it" convention
`actions` already established).

**The layering question, asked directly rather than guessed**: `Logger`
lives in `common/role/`, but `WordSeeder` -- the thing actually asked to
"log events" -- lives in `vocabulary/role/`, running inside a Web
Worker (vocabulary_worker.ts), and this codebase already states
categorically, twice (`VocabularyServiceState`'s and
`VocabularyDomainSummary`'s own docstrings, vocabulary_worker_protocol.ts,
both predating this change), that Vocabulary must not depend on Common.
Chose to keep that rule intact rather than relax it for `Logger`
specifically: `WordSeeder.seedClosedClassWords()`/`seedDomain()`/
`seedWordNet()` each grew a trailing, optional `onLog?: (level, message)
=> void` parameter -- a plain callback, the exact same shape their
existing `onProgress?` parameter already uses, with zero import from
Common. `vocabulary_worker_protocol.ts` grew its own self-contained
`VocabularyLogLevel`/`LogMessage` (not importing `LogLevel`/`LogEvent`
from `common/data/log_event.ts`, the same `VocabularyServiceState`-vs-
`ServiceState` split already established) and a `postLog()` helper in
`vocabulary_worker.ts` that fills in `source`/`timestamp` and relays
each call out via the worker's own existing `post()` -- `StatusMessage`'s
own exact relay pattern, one level more detailed. `VocabularyWorkerClient`
grew a matching `onLog()` subscription (`onStatus()`'s own exact
counterpart). Only `common/ui/portal_shell.ts` -- which already
legitimately imports from both Vocabulary and Common -- ever constructs
a real `Logger`: one cached instance per distinct `source` seen
(`loggerFor()`), feeding its own private `LogEventBoard`, which it hands
to its own `ServiceStatusView` construction. `Logger` itself is real,
generic infrastructure, exercised end-to-end today by exactly this one
composition point, ready for any future Service worker (Linguistics,
Knowledge) that wants the same relay without needing a second design.

WordSeeder logs at coarser granularity than its own `onProgress` --
start and finish of `seedClosedClassWords()`, and start/pass-1-done/
pass-2-done/finish of `seedWordNet()`, not once per
`PROGRESS_REPORT_INTERVAL` synset batch -- milestones for a history
viewer, not a second progress bar duplicating the one `onProgress`
already drives. Both worker-side `catch` blocks (`handleSeedCommonVocabulary`/
`handleSeedWordNet`) also emit an `"error"`-level log alongside the
`StatusMessage` they already posted, so a failed seed shows up in the
Event Log too, not only as a status-row detail string that disappears
once the row's state changes again.

`npx tsc -b --force` clean; `npx vitest run --no-file-parallelism`
188/188, unchanged (no existing test exercises the Worker-to-UI
plumbing this touches, and none needed updating). Live Playwright
verification (same temporary-install/pre-installed-Chromium approach as
the move above): clicked "Seed Vocabulary" in the real running Portal,
confirmed the Event Log panel filled with both the start
("Seeding closed-class vocabulary…") and finish ("Seeded 372 closed-class
entries.") events, each with the correct timestamp, "Info" level pill,
and "Vocabulary Service" source, newest first.

## Give the Event Log a visible scrollbar

Reported: "The event list needs a vertical scroll bar." `.service-log-rows`
already had `overflow-y: auto` over its own `max-height: 220px`, so
scrolling itself already worked once content overflowed -- the reported
gap was visibility, not behavior: platforms/browsers with an auto-hiding
overlay scrollbar (the default on e.g. macOS) give no visual cue a log
this short is even scrollable. Added an explicit, always-visible thin
scrollbar (`scrollbar-width: thin`/`scrollbar-color` for Firefox, the
matching `::-webkit-scrollbar*` pseudo-elements for Chromium/Safari),
styled from the same `--line-strong`/`--ink-faint` tokens every other
control in this file already uses, so it reads as part of the same
design system rather than a bare native scrollbar.

Verified live, not just read from CSS: seeded past enough Event Log
rows (`Seed Vocabulary` then `Load WordNet` twice) to genuinely exceed
220px (10 rows, 241px measured `scrollHeight` against a 220px
`clientHeight`) and confirmed `scrollHeight > clientHeight` plus a
visible scrollbar in a real Chromium screenshot -- not just that the CSS
property was present. `npx tsc -b --force` clean; `npx vitest run
--no-file-parallelism` 188/188 (a pure CSS change, nothing under test
coverage).

## Add Save/Load buttons for the Vocabulary stores, next to the seed buttons

Requested: "Save" and "Load from File" buttons in `vocabToolbarInner()`,
right next to the existing "Seed Vocabulary"/"Load WordNet" pair, so a
seeded (or since-edited) Domain's Dictionary/Phrases/WordForms/Senses/
Coordinations can be persisted to JSON files and brought back later
without re-seeding from scratch. Each store's own `saveToFile()`/
`loadFromFile()` pair (the native-entity-shape design, three-way entity/
private-index/derived-index split, and `relinkAfterLoad()`'s own
reasoning) is `vocabulary/`'s own concern -- see that layer's design
log for the store-level half. This entry covers the Worker protocol and
UI wiring on top of it.

**Worker protocol** (`vocabulary_worker_protocol.ts`): new
`ExportDomainRequest`/`ImportDomainRequest` request types and
`ExportedDomainMessage`/`ImportedDomainMessage` (+ their own error
variants) response types, following `renderDomain()`'s own
`requestId` + pending-`Map` + resolve/reject shape -- Save/Load are each
one bounded computation producing one result, not an open-ended
progress job the way `seedWordNet()` is. `ExportedDomainMessage` carries
each of the five stores' own `saveToFile()` output pre-`JSON.stringify()`'d
into a plain string (`words`/`phrases`/`wordForms`/`senses`/
`coordinations`), not the live objects -- a Worker message already has
to structured-clone everything it posts, so stringifying once in the
Worker and parsing once in the UI is no more work than letting
`postMessage()` clone the same data, and it hands the UI exactly the
bytes it's about to write to a file with no separate re-serialization
step of its own. `ImportDomainRequest` accepts any subset of the five
fields (a partial load leaves the rest of that Domain's data as-is) --
`Load from File`'s own file-matching below is what actually determines
which subset gets sent on any real click, but the protocol itself
doesn't require all five. Every new type is self-contained, importing
nothing from `common/` -- the same "Vocabulary must not depend on
Common" layering rule this file's own docstring already states for
`VocabularyServiceState`/`VocabularyDomainSummary`.

`vocabulary_worker.ts`'s new `handleExportDomain()`/`handleImportDomain()`
mirror `handleRender()`'s own try/catch-and-post-an-error-message shape,
`postLog(...)` on both success and failure (the Event Log work's own
helper). Import also calls `relinkAfterLoad()` once every provided
store has been loaded, invalidates `renderCache` for that Domain (every
other state-changing handler already does this), and posts the existing
`domain-updated` message so `PortalShell`'s already-wired
`onDomainUpdated` -> `this.render()` path picks up the new counts with
no new client-side re-render logic needed.

**UI** (`portal_shell.ts`): `vocabToolbarInner()` gained two buttons,
`data-action="save-vocabulary"`/`data-action="load-vocabulary"`, plus a
hidden `<input type="file" multiple accept=".json" class="portal-vocab-file-input">` --
both target `SEED_TARGET_DOMAIN` ("Common"), same as the existing pair.
**Save** (`saveVocabulary()`) calls `vocabularyClient.exportDomain()`
then downloads each of the five returned JSON strings as its own file
via a new `downloadJsonFile()` helper -- `Blob` + `URL.createObjectURL`
+ `<a download>` + `.click()` + `URL.revokeObjectURL`, adapted from
`DictionaryView.downloadAsFile()`'s own identical mechanics
(`vocabulary/ui/server/dictionary_controller.ts`) with `type:
"application/json"` in place of `"text/html"` -- this has to run here,
on the main thread, since Worker code has no `document`/`Blob` to reach
for at all. **Load** proxies the "Load from File" button's click to the
hidden file input, then `handleFileInputChange()` reads every selected
`File`, matches each one's name against the five store keys via a new
`matchVocabFileKey()` (case-insensitive substring match against
"words"/"phrases"/"word_forms"/"senses"/"coordinations", tolerant of
the `${domain}-` filename prefix `saveVocabulary()` adds -- so a user
can select every file Save produced at once, in any order, without
renaming any of them; a file matching none of the five is silently
skipped), and calls `importDomain()` once with everything that resolved
-- not once per file, which would each separately trigger
`relinkAfterLoad()` and a redundant re-render. No confirmation dialog on
either button, matching this toolbar's existing "click and it just
runs" convention (neither seed button confirms either).

`npx tsc -b --force` clean; `npx vitest run --no-file-parallelism`
194/194 (the 6 new store-level/`relinkAfterLoad()` tests live in
`vocabulary/vocabulary.test.ts`, this UI/protocol half added no new
Worker-plumbing tests of its own, same as the Event Log work above).
Live Playwright verification against the real bundled Common Vocabulary
Cache: seeded Common (400 words, 36 phrases, 646 word forms, 632
senses), clicked Save and captured all 5 downloads
(`common-words.json` 400 entries, `common-phrases.json` 36,
`common-word_forms.json` 646, `common-senses.json` 632,
`common-coordinations.json` 0 -- Common seeds no Coordinations today),
re-selected those same 5 files via the file input and clicked Load,
confirmed the Domain summary panel and every store tab still reported
the identical counts afterward, and the Event Log recorded both
"Exported Common — ..." and "Loaded Common from file — ..." entries
with matching counts.

## Extend the Save/Load toolbar to the two new relationship files

Follow-up to the entry above: Save/Load now also covers
`SemanticRelationshipStore`/`LexicalRelationshipStore` -- the store-level
half (native-entity-shape design, the `SystemPropertiesRef`/tensor-row
wrinkle, why `MorphologicalPointerRelationshipStore` is excluded) is
`vocabulary/`'s own concern; this entry covers only the toolbar's own
two extra files.

`saveVocabulary()` downloads two more: `${prefix}-semantic-relationships.json`,
`${prefix}-lexical-relationships.json`, alongside the existing five.
`matchVocabFileKey()` gained two more substring matches, `"semantic"`/
`"lexical"` -- both checked without needing to worry about ordering
against the existing five keys (unlike `"word_forms"` vs `"words"`,
neither new substring is a substring of, or contains, any of the
others' filenames), so a user can still select every file Save produced
in one go, in any order, without renaming any of them.

No new buttons, no new UI surface at all -- the same single Save/Load
pair now just round-trips seven files under the hood instead of five.

`npx tsc -b --force` clean; `npx vitest run --no-file-parallelism`
196/196 (the 2 new relationship round-trip tests live in
`vocabulary/vocabulary.test.ts`, same split as before). Live Playwright
verification: seeded Common, clicked Save and confirmed all 7 files
downloaded (the two new ones at 110 and 76 entries respectively,
matching the Domain's own real seeded relationship counts), re-selected
all 7 and clicked Load, confirmed the Event Log's "Loaded Common from
file — ..." line reported the identical semantic/lexical counts back.
