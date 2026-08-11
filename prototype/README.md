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
of `.py`. The Vocabulary Layer is ported (see below); Linguistics,
Value Objects (beyond the four CCTS types Vocabulary needs), and
Knowledge remain empty placeholders (`.gitkeep`).

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
│       └── knowledge/{documentation,data,agents,role,api,ui,assets}/
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

Try it: `npm run dev` seeds the bundled Common Vocabulary Cache into a
"Common" Domain and mounts the rendered `DictionaryView` in an iframe --
open the printed local URL. `npm test` seeds and validates the real
bundled assets (word counts, relationship counts, the manifest
checksum) as part of the suite, not just synthetic fixtures.

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
