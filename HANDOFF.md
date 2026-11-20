# HANDOFF

## Sprint

S0 — Scaffold and core engine (no UI).

## Done

- Scaffold: `package.json`, `tsconfig.json` (strict), `vite.config.ts`, `index.html`, `src/main.ts` (placeholder only), `.gitignore`.
- `src/core/types.ts`: `Track`, `Size`, `Item`, `Phase`, `ChangeRecord`, `Project`.
- `src/core/plan.ts`: `filePlan(track, size)`.
- `src/core/projectYaml.ts`: `toYaml(project)`, `fromYaml(text)` with validation (`ProjectYamlError`).
- Tests: `src/core/plan.test.ts` (9 combinations plus invariants), `src/core/projectYaml.test.ts` (round-trip, unknown track, unknown size, missing name).
- Docs: `README.md`, `AGENTS.md`, this file.

Milestone status:

- [x] M0.1 Project scaffold builds
- [x] M0.2 `types.ts` (acceptance: typecheck passes)
- [ ] M0.3 `suggestSize(answers)` — **BLOCKED**, not implemented (see Blockers)
- [x] M0.4 `filePlan(track, size)` with 9-combination test
- [x] M0.5 `toYaml` / `fromYaml` round-trip and three rejection tests

## Current state

- `src/core/size.ts` does **not** exist. M0.3 was not started because the sizing thresholds (spec §4) are not available.
- `filePlan` assumes that L-size plans contain the entry file, `project.yml`, and the four track files only (no `PROJECT.md` / `PLAN.md`). See Blockers.
- `Item.status` is one of `todo | doing | done`; `Item.priority` is `must | nice`. Phases have no status of their own.
- `deadline` is stored as a `YYYY-MM-DD` string or `null`. The parser does not check the date format yet.
- No UI, no templates, no ZIP output (all out of scope for S0).

## Checks run

Run on branch `arena/b062b4d0-nasaq` (commit listed in the PR), Node v22.22.3, npm 10.9.8.

| Command | Result |
| --- | --- |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0 (typecheck + `vite build`, output `dist/`) |
| `npm test` | exit 0 — 2 test files, 17 tests passed |

Not run: none of the checks above were skipped. Browser checks were not run (no UI in S0).

## Blockers

1. **Spec not available in the workspace.** The sprint refers to "the attached spec (sections 3 to 6 and 8)" and to "spec §4". Neither the spec file nor the §4 table is in the repository or the message. The repo contained only a one-line `README.md`. Please attach the spec or paste §4.
2. **M0.3 (`suggestSize`) is blocked by (1).** It needs the §4 table: the threshold for each of the five answers (duration, deliverables, approvers, risk, unknowns) and which size each one maps to. I did not invent thresholds. Once the table is provided, M0.3 can be implemented in `src/core/size.ts` with tests for all-S, all-L, and one lift test per column.
3. **Branch name.** Rule 5 asks for `sprint/s0-{slug}`, but this session is fixed to `arena/b062b4d0-nasaq`. The work is on the session branch and the PR is from that branch. Please confirm this is acceptable or tell me how to proceed.
4. **L-size file list.** The sprint says "L → the four files for that track". I read this literally, so L does not include `PROJECT.md` or `PLAN.md`. Please confirm, since the spec sections that would settle this are missing.
5. **Item and phase fields.** The sprint says each phase has "items marked `must` or `nice` and a status." I put the status on each item (`todo | doing | done`) and not on the phase. Please confirm the status values and where the status lives.

## Next

- Resolve Blockers 1–2, then finish M0.3 in this sprint.
- Resolve Blockers 3–5 before S1.
- Do not start S1 until S0 is reviewed.
