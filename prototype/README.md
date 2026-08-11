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
of `.py`. Every layer subfolder is currently an empty placeholder
(`.gitkeep`) -- nothing has been ported yet.

```
prototype/
├── index.html            Vite entry point
├── src/
│   ├── main.ts            app entry point (mounts into index.html's #app)
│   └── lira/
│       ├── vocabulary/{documentation,data,agents,role,api,ui,assets}/
│       ├── linguistics/{documentation,data,agents,role,api,ui,assets}/
│       ├── value_objects/{documentation,data,agents,role,api,ui,assets}/
│       └── knowledge/{documentation,data,agents,role,api,ui,assets}/
├── examples/               (empty placeholder, mirrors the root examples/)
├── package.json / tsconfig.json / vite.config.ts
```

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
