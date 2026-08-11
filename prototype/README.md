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
of `.py`. The Vocabulary Layer is ported (see below); Knowledge carries
only the Portal shell so far (also below) -- its `data/domain.py`,
`hosted_domains.py`, and tensor graph are not ported. Linguistics and
the rest of Value Objects (beyond the four CCTS types Vocabulary needs)
remain empty placeholders (`.gitkeep`).

```
prototype/
├── index.html            Vite entry point
├── src/
│   ├── main.ts            app entry point (mounts into index.html's #app)
│   ├── vite-env.d.ts       Vite ambient types (import.meta.glob, etc.)
│   └── lira/
│       ├── vocabulary/     ported -- see below
│       ├── linguistics/{documentation,data,agents,role,api,ui,assets}/
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

### Portal shell (knowledge/ui/portal_shell.ts)

The app shell around `DictionaryView` -- a Windows-Explorer-style desktop
layout (persistent folder tree + view pane) that switches to a
drill-down mobile portal via a real toggle in its own title bar, not
just a `@media` breakpoint. The folder tree *is* the Domain hierarchy:
root is "All Domains", and nesting follows each Domain's real parent --
`main.ts` registers "Physics" under "Common" and bootstraps it with
`Dictionary.seedFrom(common)`, the actual mechanism a freshly created
Domain uses to inherit Common's vocabulary (vocabulary/data/dictionary.py),
so Physics's 3,093 words in the running app are genuinely inherited, not
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
will have) a UI component. Only Vocabulary is enabled; Linguistics and
Knowledge render as visibly disabled tabs ("Not ported yet") rather than
being hidden, so the shell's own shape doesn't imply LIRA only ever has
one layer. Selecting a Domain asks the Vocabulary Service (below) to
render it and mounts the result *directly into the shell's own DOM* --
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
  Initialising" box, mounted immediately and shown until the Vocabulary
  Service reports `"done"`. Since it's driven by the same board the
  worker updates via `VocabularyWorkerClient.onStatus`, its checklist
  reflects genuine seeding progress ("Seeded 3093 words — seeding
  relationships…"), not a fake timer.
- `ServiceStatusView` (knowledge/ui/service_status_view.ts) -- the
  persistent "Background Services" panel under the component switcher
  in `PortalShell`, showing the same rows on an ongoing basis. The
  Vocabulary Service's `"done"` state displays as "Running", not
  "Ready"/finished -- the worker itself stays alive and keeps handling
  `renderDomain` requests, it's a live process, not a one-shot script
  that exits once seeding completes.

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
