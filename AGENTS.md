# Agent instructions for Nasaq

Nasaq is a static Vite + TypeScript app with no backend.

## Source of truth

- `docs/SPEC.md` is the product spec. It is **not yet in the repo**; the sprint plan says it should be added. Until it is, read `HANDOFF.md` Blockers.
- `docs/SPRINTS.md` is the sprint plan. It is **not yet in the repo**. Once it is, read it from the repo.
- From S1 on, read `HANDOFF.md` first.

## Rules

- Logic lives in `src/core/` as pure functions with no DOM access. UI lives in `src/ui/`.
- Size limits live only in `src/core/thresholds.ts`. Tests import limits from there and do not repeat numbers.
- No project text in code. Generated text comes from Markdown templates under `templates/`, using `{{placeholders}}` only.
- Templates and sample content must not contain client names or real project data.
- Dependencies: runtime `yaml` (and `jszip` when the ZIP sprint needs it); dev `vitest`, `typescript`, `vite`. Ask before adding anything else.
- Never weaken or delete a test to make it pass.
- Run `npm run typecheck`, `npm test`, and `npm run build` before reporting a milestone as done. Report the real results.
- Work on the session branch only. Do not merge or deploy.
- Follow each sprint's "Out of scope" list strictly.
- If the spec is unclear or wrong, stop that milestone and record the question under "Blockers" in `HANDOFF.md`.
