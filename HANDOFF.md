# HANDOFF

## Sprint

S0 — Scaffold and core engine (no UI). Branch: `arena/b062b4d0-nasaq` (session branch; the `sprint/` naming rule was waived in review). Status: PR #1 open, not merged, not deployed.

## Done

- Scaffold: `package.json` (name `nasaq`), `tsconfig.json` (strict), `vite.config.ts`, `index.html` (title `Nasaq`), `src/main.ts` (placeholder only), `.gitignore`.
- `src/core/types.ts`: `Track`, `Size`, `Item` (status `todo | doing | done | cut`), `Phase`, `ChangeRecord` (`date`, `fromSize`, `toSize`, `reason`, `approvedBy`, `itemsCut`, `itemsAdded`), `Project` (adds required `startDate`).
- `src/core/thresholds.ts`: the only place size limits live. Duration 1–7 S, 8–28 M, 29+ L. Deliverables 1–5 S, 6–15 M, 16+ L. Approvers 1 S, 2 M, 3+ L. Risk `easy_undo`/`some_rework`/`hard_undo` → S/M/L. Unknowns `none`/`few`/`research_needed` → S/M/L.
- `src/core/size.ts` (M0.3): `suggestSize(answers)` → `{ size, decidedBy }`. Size is the highest size any answer maps to; `decidedBy` lists the answer keys that map to that size. Zero, negative, and non-whole numbers throw a `RangeError` that names the field. Unknown risk/unknowns values also throw.
- `src/core/plan.ts` (M0.4): `filePlan(track, size)`. Output order: entry file, `project.yml`, then size files. L = entry + `project.yml` + the four track files (no `PROJECT.md`/`PLAN.md`), as confirmed in review.
- `src/core/projectYaml.ts` (M0.5 + schema): `toYaml` / `fromYaml`. Rejects unknown track or size, missing name, missing `startDate`, and any `startDate`, `deadline`, or `ChangeRecord.date` that is not a real `YYYY-MM-DD` date. Each error names the field. Missing lists parse as empty. Missing `approvedBy` parses as null.
- Tests: `src/core/size.test.ts` (25), `src/core/projectYaml.test.ts` (15), `src/core/plan.test.ts` (11). Total 51. Size tests take every limit from `thresholds.ts`.
- Docs: `README.md`, `AGENTS.md` (points to `docs/SPEC.md` and `docs/SPRINTS.md`, which are not in the repo yet), this file.

Milestones:

- [x] M0.1 Scaffold builds (`npm run build`, `npm run typecheck` exit 0)
- [x] M0.2 `types.ts` (typecheck passes)
- [x] M0.3 `suggestSize(answers)` with thresholds from review; tests for all-S, all-L, one lift to M and to L per column, and boundaries 7/8, 28/29, 5/6, 15/16 (plus 1/2 and 2/3 for approvers)
- [x] M0.4 `filePlan(track, size)`, 9-combination test
- [x] M0.5 `toYaml` / `fromYaml`: round-trip, rejection tests (unknown track, unknown size, missing name), and date-validation tests (`2026-13-01`, `tomorrow`)

Review items:

1. **Spec and sprint files added to `docs/`: NOT DONE.** See Blockers 1.
2. Package renamed to `nasaq`; name `Nasaq` used in `README.md`, `AGENTS.md`, `index.html`. The `main.ts` placeholder text also says `Nasaq`.
3. `src/core/thresholds.ts` created (values as given in review).
4. M0.3 implemented (see above).
5. Schema additions done (`startDate`, `ChangeRecord.approvedBy/itemsCut/itemsAdded`, `ItemStatus` `cut`, date validation).
6. This file updated with every command and result (below).

## Current state

- S0 review items 2–6 are done. Item 1 (spec and sprint files) is blocked.
- Test fixtures in `projectYaml.test.ts` gained the new required fields (`startDate`, and the three `ChangeRecord` fields). No assertion was removed or weakened.
- `startDate` is required and must be a real date. `deadline` is optional (`null` allowed) and must be a real date when set. The code does not check that `deadline` is after `startDate`. That check is not in the sprint text, so it is not implemented.
- `Item.status` values: `todo | doing | done | cut`. Status lives on the item (confirmed in review).
- No UI, no templates, no ZIP output. All out of scope for S0.

## Checks run

Node v22.22.3, npm 10.9.8. All commands run from `/home/user/Nasaq` on branch `arena/b062b4d0-nasaq`.

| Command | Result |
| --- | --- |
| `npm install` | exit 0. Lockfile root name updated to `nasaq`. |
| `npm run typecheck` | exit 0 |
| `npm test` | exit 0. 3 files, 51 tests passed (projectYaml 15, size 25, plan 11) |
| `npm run build` | exit 0. `tsc --noEmit` then `vite build`, output in `dist/` (gitignored) |
| `grep -c '"name": "nasaq"' package-lock.json` | 2 (root package and root entry) |

Spec and sprint lookup (review item 1), real results:

| Command or call | Result |
| --- | --- |
| `ls` and `find` over `/home/user`, `/home/user/Nasaq`, and `/` for spec/sprint files | No match. The repo has only the S0 files. |
| Google Drive `search_files`, query `name contains 'spec' or name contains 'sprint' or ...` | Returned 50 unrelated files (zip archives, exports). No spec or sprint file. |
| Google Drive `search_files`, query `name contains 'Flow' or ... fullText contains 'Project Flow System'` | Found `FLOW.md`, `FLOW (1).md`, `REV7_HANDOFF.md`. `FLOW.md` was read: it is an unrelated "Code&Canvas AI Delivery Framework" document. The others were not read. |
| Google Drive `search_files`, query `fullText contains 'suggestSize' or fullText contains 'project.yml' or ...` | No new match. |
| Google Docs connector | No search tool; only create/read/edit by ID. Not searched. |
| Linear connector | Listed tools. No document search. Not searched. |

Not run: browser or UI checks (no UI in S0).

## Blockers

1. **Spec and sprint files were not received.** The message says "Add the attached spec and sprint files to the repo as `docs/SPEC.md` and `docs/SPRINTS.md`". They are not in the message, the repo, or the workspace. Drive searches did not find them. Please attach them again, or share the Drive file IDs or paste the text. I did not write these files from memory. Once they are here, I will add them and update AGENTS.md to link to them.
2. **Spec §3–6 and §8 are not available,** so I could not check the code against them beyond the sprint text and the review message. Please confirm this is acceptable for S0 or send the sections.
3. **Assumptions to confirm** (implemented, not yet approved):
   - Non-whole numbers for duration, deliverables, or approvers are rejected (for example `7.5`). Otherwise `7.5` would silently fall between the S and M bands.
   - Missing `approvedBy` parses as `null`. Missing `itemsCut` / `itemsAdded` parse as `[]`.
   - `deadline` is allowed to be `null`. Its order relative to `startDate` is not checked.
4. **Shape of `suggestSize` error handling:** invalid input throws. The sprint did not say whether to throw or return an error value.

## Next

- Resolve Blocker 1 (and 2 if needed). Then add `docs/SPEC.md` and `docs/SPRINTS.md`, and link them from AGENTS.md.
- Confirm the assumptions in Blocker 3.
- S1 has not been started. Do not start it until this sprint is reviewed.
