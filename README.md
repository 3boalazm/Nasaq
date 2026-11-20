# Project Flow System

A small static web app that sets up and maintains a project folder for three kinds of work: brand identity, UI/UX, and development. Input is a short form; output is a ZIP of Markdown files plus one `project.yml`, built in the browser.

No backend, no accounts, no database, no analytics, no network calls at runtime.

## Stack

- Vite + TypeScript (strict), plain CSS, no UI framework
- Runtime dependency: `yaml`
- Dev: `typescript`, `vite`, `vitest`
- Core logic in `src/core/` (pure functions, no DOM); UI in `src/ui/`
- Templates (Markdown with `{{placeholders}}`) under `templates/{track}/{size}/`

## Commands

```sh
npm install
npm run dev        # local dev server
npm run typecheck  # tsc --noEmit
npm test           # vitest run
npm run build      # typecheck + vite build
```

## Status

Sprint S0 (scaffold and core engine) — see `HANDOFF.md`.
