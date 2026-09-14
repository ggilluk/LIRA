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
