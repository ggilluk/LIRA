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
