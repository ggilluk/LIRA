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
  single-threaded JS doesn't need the thread.
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
domain-position math). They carry only a name, an optional parent, and a
`VocabularyLayer` -- enough to draw a tree and mount a view. When
`Domain`/`HostedDomains` are ported, this type should be replaced by
them, not extended to fake the parts it's missing.

Selecting a Domain mounts a fresh `DictionaryView.render()` for it in an
`<iframe srcdoc>` (same reasoning as `main.ts`'s own iframe use above),
cached per Domain so switching back and forth doesn't re-render. A
Domain with more than one ported layer would get its own tabs inside
that pane, the same way `DictionaryView` already has Words/Relationships/
Hierarchy/Cyclic tabs -- the shell mounts one component per Domain, it
doesn't know or care how many views that component itself exposes.

Try it: `npm run dev` opens directly into the shell -- click between
Common and Physics in the tree (or the mode pill to see the mobile
drill-down), no separate route needed.

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
