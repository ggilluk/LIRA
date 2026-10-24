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

## Auto-populate a "Last seed snapshot" download row after Seed Vocabulary / Load WordNet

Requested: seeding shouldn't require a separate "Save" click to get a
downloadable copy of what was just seeded -- both seed actions should
save their own result, "available as blob objects". The Worker-side
half (`DomainSnapshotMessage`, `exportSnapshotFiles()`,
`postDomainSnapshot()`) is `vocabulary/`'s own concern; this entry
covers only what `portal_shell.ts` does with the seven strings it
receives.

**Blobs, not auto-downloads.** `handleDomainSnapshot()` (this class's
own new `vocabularyClient.onDomainSnapshot()` listener) builds a `Blob`
+`URL.createObjectURL()` per file -- `downloadJsonFile()`'s own first
half, minus the second half (`<a>`+`.click()`+`URL.revokeObjectURL()`).
A seed finishing is not itself a reason to push a file at the user
unprompted; these sit as real, clickable links (`snapshotLinksHtml()`,
a new trailing row in `vocabToolbarInner()`, "Last seed snapshot:" plus
one `<a href="blob:..." download="...">` per file) until the user
actually wants one.

**Each new snapshot revokes the last one for that Domain.** `domainSnapshots`
(a new `Map<domainName, {label, filename, url}[]>` field) holds exactly
one snapshot per Domain name at a time -- `handleDomainSnapshot()` calls
`URL.revokeObjectURL()` on every link already stored for that Domain
before building the new set. Without this, a session with several seed
runs (Seed Vocabulary, then Load WordNet, then Seed Vocabulary again on
a different Domain) would leak one full seven-file Blob set per run,
each potentially tens of megabytes at WordNet scale, for the rest of the
page's lifetime.

**A narrow refresh, not a full render().** `handleDomainSnapshot()` ends
by calling `updateVocabToolbar()` directly (this class's own established
"a status tick only touches the toolbar's own markup" precedent, its own
constructor comment on why) rather than `render()` -- a snapshot becoming
available is never itself a reason to remount the Vocabulary fragment.

`npx tsc -b --force` clean; `npx vitest run --no-file-parallelism`
196/196, unchanged (pure Worker-plumbing/UI wiring, no new tests of
their own -- see `vocabulary/`'s own design log for the Worker-side
half). Live Playwright verification against the real bundled Common
Vocabulary Cache and Princeton WordNet 3.1: confirmed zero snapshot
links before any seeding; clicked "Seed Vocabulary" alone (no Save
click) and confirmed all 7 links appeared immediately after, each with
the right filename/label, and fetched one Blob directly from the page
to confirm its own real content (400 words); then clicked "Load WordNet"
and confirmed the links refreshed to a second, much larger snapshot
(92,714 words) once the worker's own considerably heavier `JSON.stringify()`
pass finished, and that the *first* run's own Blob URLs were genuinely
revoked by then (a direct `fetch()` against the old URL failed).

## Add a terminal-styled Console above Background Services -- ConsoleView

Requested: a "user shell console" in the Vocabulary view pane, above
ServiceStatusView's own Background Services panel, with a real
shell-like feel. Clarified via two questions before building anything:
(1) scope -- a visual scaffold for now (real terminal chrome, history
navigation, `help`/`clear` wired up), not real app commands yet, since
"what should typing `seed` actually do" opens a much bigger design
question (confirm first before building the Dictionary/Senses/wherever
is live, or just proxy to the existing toolbar buttons? accept partial
matches? tab-complete?) than this request asked to settle; (2) placement
-- inside `renderViewPane()`, a new `.portal-console` mount point
directly above `.portal-service-status`, present in both of that
method's own branches (the "Select a Domain" empty state and the real
content state) the exact same way `.portal-service-status` itself
already is, rather than a bigger structural change to the shell's own
top-level layout.

**New file, `common/ui/console_view.ts`, `ServiceStatusView`'s own exact
shape** (`mount(container)`, `ensureStyles()` with an ID-guarded
`<style>` tag, instance-field state surviving PortalShell's own
"rebuild the DOM from scratch on every render()" habit, a collapsible
header with the same chevron/summary-when-collapsed convention) --
consistency with the panel it sits directly above mattered more here
than any novelty, since the two read as siblings in the UI. Takes no
constructor dependencies at all (no `VocabularyWorkerClient`, nothing)
-- the scaffold doesn't need one yet, and not taking one now means
wiring a real command in later is purely additive to `runCommand()`,
never a reshaping of how this class gets constructed or mounted.

**What actually gives it "shell feel", concretely**: the one real visual
departure from this codebase's own light theme -- `.console-body` is a
hardcoded dark panel (`#14171a`), not `var(--surface)`, with a
terminal-green prompt/caret color (`#5fe3b3`) picked as a brighter tint
of the app's own teal `--accent` rather than a generic "terminal green",
so it reads as *this app's* console, not a borrowed xterm skin. The
input itself has no visible border of its own (`background: transparent;
border: none`) and sits inline after a static `lira$ ` prompt span, so
typing feels like it's happening directly in the terminal body, not in
a separate form control bolted onto it.

**Real history navigation, kept deliberately cheap.** ArrowUp/ArrowDown
mutate the live `<input>` element's own `.value` directly
(`recall()`) rather than going through a full `paint()` -- a full
re-render would tear down and rebuild the input (losing focus
mid-recall, however briefly) for a change that's purely "what text sits
in one input box", nothing the scrollback above it needs to know about
at all. `paint()` itself only runs for state the *scrollback* actually
needs to reflect: mount, a submitted command (Enter), and the
collapse toggle -- never on ordinary keystrokes, which would otherwise
reset the native input's own cursor position on every character typed.

**`help`/`clear` handled directly in `runCommand()`, not through a
dispatch table.** A `Record<string, ConsoleCommand>` registry was the
first draft -- then `clear` turned out to need to reset `this.lines`,
an instance field a module-level table has no access to, and the
registry's own `run()` contract (return lines to *append*) had no way
to express "replace the whole scrollback instead" without a special
case anyway. Two real commands sharing one `if`/`else if` is the
honest shape for what this scaffold actually has today; `COMMAND_DESCRIPTIONS`
(a plain description map, not a dispatch table) exists only so `help`'s
own listing has one place to read each description from, not two.

`npx tsc -b --force` clean; `npx vitest run --no-file-parallelism`
208/208, unchanged (pure new UI component plus wiring, no existing
behaviour touched -- no new tests of its own, matching this file's own
established "UI/Worker-plumbing changes verified live, not unit-tested"
precedent for a PortalShell-level change). Live Playwright verification:
confirmed the console's own bounding box sits above Background
Services' own in the real rendered page; typed `help` and got the two-
command listing; typed an unmapped command and got the "not implemented
yet" message; ArrowUp twice recalled the two most recent commands in
reverse order, ArrowDown twice returned to the original (empty) draft;
`clear` emptied the scrollback to nothing; the header's own collapse
toggle hid the body and showed a "3 commands" summary, then restored it
on a second click.

## Split Console commands into their own files; add a 20MB bash-shaped virtual filesystem

Requested: every Console command in its own `.ts` file under `common/ui/`,
plus a 20MB "blob storage" and basic commands to use a filesystem
fashioned on bash/Linux. Two real pieces, in two different layers:
`common/data/virtual_file_system.ts` (the filesystem model itself --
`data/`, alongside `service_status.ts`/`log_event.ts`, since it's pure
state with no DOM of its own) and `common/ui/console_commands/*.ts`
(one file per bash-shaped command, the UI-facing half that was actually
asked to move).

**`VirtualFileSystem`: one method per bash utility, each throwing that
utility's own real error phrasing directly.** `mkdir`'s own
`"mkdir: cannot create directory 'x': File exists"`, `rm`'s own
`"rm: cannot remove 'x': Is a directory"`, and so on -- a generic
reason-code error type (`"not-found" | "exists" | ...`) that each
command translated into its own bash phrasing was the first draft, then
dropped: every `VirtualFileSystem` method already corresponds to
exactly one command file (`changeDirectory` only ever gets called from
`cd.ts`), so there's no reuse the indirection would actually buy, and
the whole point of "fashion it on bash" is that a bad command here
*reads* like a bad command in a real shell, not like a translated
error code. `touch` on an already-existing file is a deliberate no-op,
not an error -- this filesystem tracks no mtime for `touch` to
meaningfully bump, so matching real `touch`'s surface behaviour (file
still exists afterward) matters more than matching its full semantics.

**The 20MB cap is enforced against a *projected* total, not the new
content's own size in isolation.** `writeFile()` computes `usedBytes()
- (bytes the write replaces, if overwriting) + (the new content's own
bytes)` before accepting a write -- overwriting a 19MB file with a 1KB
one is never mistakenly rejected as "out of space" just because the
1KB write, considered alone, momentarily looks like it's being checked
against a nearly-full disk. Real UTF-8 byte length throughout
(`TextEncoder().encode(content).length`), not JS string `.length` --
the two diverge for any non-ASCII content (an `é` is one UTF-16 code
unit but two UTF-8 bytes), and "20MB" should mean 20 real megabytes of
storable content, not 20 million UTF-16 code units.

**"Blob storage" is literal, not just a capacity number's own name.**
`toBlob()` serialises the whole tree to one real `Blob`
(`application/json`) -- nothing inside this class calls it today, but
it exists so a future caller wanting to persist or download the virtual
disk can reuse the exact `Blob`/`URL.createObjectURL` pattern the
Vocabulary layer's own Save/Load feature already established
(`downloadJsonFile()`, `common/ui/portal_shell.ts`), rather than
inventing a second one. `capacityBytes` on its own would have made "20MB
blob storage" just a comment; a real, tested `toBlob()` makes it true.

**`console_commands/`: `ConsoleCommand.run()` returns lines, throws for
failure -- `console_view.ts`'s own `runCommand()` is the one and only
catch site.** Most commands never handle an exception themselves: every
`VirtualFileSystem` method already throws a ready-to-print bash message,
so a single-operand command (`cd`, `mv`, `cp`) just lets it propagate.
The four commands that take more than one path (`mkdir`/`touch`/`cat`/`rm`)
are the exception -- real bash doesn't abort `rm a b c` just because `a`
is missing, it prints that one operand's own error and still removes
`b`/`c` -- so those catch per-operand internally (`shared.ts`'s own
`forEachOperand()` for the three that only need the side effect;
`cat.ts` keeps its own loop since it alone needs each operand's own
*return value*, not just whether it succeeded, interleaved with any
error lines in argument order).

**`clear` is still the one command that can't just return lines.**
Clearing means resetting `ConsoleView`'s own `lines` field, which no
return value reaches -- `ConsoleCommandContext.clearScrollback()` is
`clear.ts`'s own escape hatch for exactly that, called directly rather
than expressed through `run()`'s return type. `help` needs the live
command registry, not a hand-maintained duplicate list -- it reads
`context.commands` (the same `CONSOLE_COMMANDS` `console_view.ts`
itself dispatches through), so adding a new command file plus one line
in `console_commands/index.ts` is the only step needed for `help`'s own
listing to pick it up too.

`npx tsc -b --force` clean; `npx vitest run --no-file-parallelism`
260/260 (52 new: `virtual_file_system.test.ts`'s own thorough coverage
of path resolution, every operation's own bash-phrased error, capacity
enforcement including the overwrite-doesn't-false-reject case, and
`toBlob()`'s own round-trip; `console_commands.test.ts` exercising every
command's own `run()` directly, including the multi-operand
keep-going behaviour and `echo`'s own `>`/`>>` redirection parsing --
`VirtualFileSystem`'s own test file had to work around this project's
jsdom test environment lacking `Blob.prototype.text()`/`.arrayBuffer()`,
reading the Blob back via `FileReader` instead, a test-environment gap,
not a `VirtualFileSystem` one). Live Playwright verification against
the real running Console: `mkdir`/`cd`/`echo >`/`cat`/`echo >>`/`cp`/`mv`/`rm`
walked through in sequence, each producing real bash-shaped output
(`ls` after `mkdir projects` showing `projects/`, `cat` after an
appended `echo >>` showing both lines, `rm` on a directory without `-r`
refusing with the real bash message, `rm -r` then succeeding); `cat` on
a missing file and `df` (reporting `20.0M`/`0B`/`20.0M`/`0%` on an
empty filesystem) both confirmed; `help` listed all 13 real commands,
alphabetically, each with its own description.

## Console: a boot banner, and a prompt that shows the working directory

Two small, real shell-fidelity gaps closed: a static `"LIRA Console —
type 'help' to get started."` first line read as placeholder text, not
a real terminal's own boot banner; a hardcoded `lira$ ` prompt never
reflected `cd`, so a scrollback full of `cd`/`ls` output gave no visual
cue which directory any of it actually ran against -- the one thing a
real shell prompt exists to answer at a glance.

**The banner is `BANNER_LINES`, `lines`' own initial value -- never
reprinted by `clear`.** A real terminal's own `clear` blanks the
screen; it doesn't re-run whatever printed the MOTD on first connect,
so `clear.ts`'s existing `clearScrollback()` (resetting `lines` to `[]`)
needed no change at all for this to already be correct -- the banner
only shows up once, at mount, the same as a real login banner.

**The prompt is `lira:<cwd>$ ` (`promptFor()`), not a constant --**
bash's own familiar `user@host:cwd$` shape, trimmed to what this toy
single-user Console actually has an identity for. The live prompt row
(beside the input) recomputes `promptFor(fs.pwd())` on every `paint()`,
so it's always current. The trickier half: a *past* command's own
echoed prompt has to freeze at the directory it actually ran from, not
retroactively follow wherever a later `cd` moves to -- exactly what a
real terminal's own scrollback does (your history doesn't rewrite
itself when you change directories). `ConsoleLine` became a
discriminated union over this: only `{ kind: "command" }` carries its
own `prompt: string`, captured once in `runCommand()` *before* the
command runs (so a `cd` command's own echoed line still shows the
directory it was typed from, not the one it just changed to -- a real
shell draws the prompt before reading input, not after running it), not
recomputed at render time the way the live input row's prompt is. The
union shape (not one interface with an optional `prompt?: string`) was
deliberate: it lets `renderLine()`'s own `line.kind === "command"`
check narrow `line.prompt` to a real, non-optional `string`, rather
than every other line kind having to carry a `string | undefined` it
never uses.

`npx tsc -b --force` clean; `npx vitest run --no-file-parallelism`
260/260, unchanged (pure UI/copy change, no new tests of its own).
Live Playwright verification: confirmed the banner's own two lines
render with `LIRA Operating System` present verbatim; the live prompt
read `lira:/$` at root and `lira:/projects$` once `cd projects` ran;
critically, after that `cd`, the *historical* `mkdir projects`/`cd
projects` command lines still both showed `lira:/$ ` (the directory
they actually ran from), not retroactively rewritten to `/projects` --
confirming the freeze-at-submission-time design actually holds, not
just the live prompt's own update.
