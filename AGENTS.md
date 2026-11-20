# Agent instructions

Project: Project Flow System (static Vite + TypeScript app, no backend).

## Rules

- Logic lives in `src/core/` as pure functions with no DOM access. UI lives in `src/ui/`.
- No project text in code. Generated text comes from Markdown templates under `templates/`, using `{{placeholders}}` only.
- Templates and sample content must not contain client names or real project data.
- Dependencies: only `yaml` and `jszip` at runtime; `vitest`, `typescript`, `vite` for dev. Ask before adding anything else.
- Never weaken or delete a test to make it pass.
- Run `npm run typecheck`, `npm test`, and `npm run build` before reporting a milestone as done, and report the real results.
- Work on the branch assigned for the session. Do not merge or deploy.
- Follow the sprint's "Out of scope" list strictly.
- If the spec is unclear or wrong, stop that milestone and record the question under "Blockers" in `HANDOFF.md`.
- Read `HANDOFF.md` first (from S1 on).
