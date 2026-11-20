# HANDOFF

## Sprint

S2 — Size M and L templates. All 9 track × size folders generate. Branch: `arena/3c99cdef-nasaq` (session branch, from `main` at `ad4b875`, which includes S1 merged as PR #2). Status: PR opened, not merged, not deployed. S3 has not been started.

Source docs 26 and 27 were not available, as instructed. The L files were built from the outline in the S2 request and from `docs/SPEC.md` sections 3, 5 and 6.

## Done

Spec fix (first, as instructed):

- `docs/SPEC.md` §5.2: added the line `Fixed at any size: text contrast AA (4.5:1), works at 375 px and 1280 px, Arabic/RTL parity when the product is bilingual, keyboard reachable with visible focus, every screen has empty, loading and error states.` It sits after the §5.2 table. The S and M UI/UX `PROJECT.md` baseline checklists now use it (the placeholder is gone).

Code:

- `src/core/templates.ts`: all files under `templates/` load with one `import.meta.glob` (raw text). `fileTemplate(track, size, file)` and `phaseDefs(track, size)` replace the S-only helpers.
- `src/core/files.ts`: `renderProjectFiles` renders every name in `filePlan` for any size. The S-only guard is gone.
- `src/core/render.ts`: new context values: `track`, `readFirst` (derived from `filePlan`), `phaseRegistry` (rows for the master registry; brand and uiux add a "proof to capture" cell), `phasePlan` (per-phase item tables), `phaseNameRows`, `changeLogRows` (size history).
- `src/core/intake.ts`: `createProject` takes any size and uses that size's phase list.
- `src/core/plan.ts`: exports `ENTRY_FILE` and `PROJECT_YAML`.
- `src/ui/form.ts`: M and L are enabled; the S2 warning is removed. Download uses the chosen size.
- `templates/_shared/entry.md`: "Read {{readFirst}}" instead of always naming PROJECT.md (required for L, which has no PROJECT.md).

Templates added:

- M (all three tracks): `PROJECT.md` (S plus a pointer to `PLAN.md`) and `PLAN.md` (phase blocks from `phasePlan`, per-phase checks).
- `phases.yml` for M and L (all three tracks), from the M and L columns of spec §5.
- L, dev: `Implementation.md` (roadmap), `Security_issues.md` (SEC-BASE-01..08), `Test_scenarios.md` (TC-BASE-01..08), `Handoff.md`.
- L, brand: `Brand_Roadmap.md` (Roles table, Mode NEW or RETROFIT, RETROFIT registry), `Brand_Risks.md` (taxonomy LGL, LNG, CUL, ACC, REP, DIG, CON, DST, SCL, DLV; BR-BASE-01..12), `Application_Tests.md` (suites LOG, CLR, TYP, LAY, STA, SIG, DIG, TPL; AT-BASE-xxx-01/02; test types BENCH, PROOF, FIELD, DIGITAL, USER; Applications in scope), `Handoff.md` (Approvals, Asset register, Proof list).
- L, uiux: `UX_Roadmap.md` (Discover, Define, Design, Validate, Handoff), `UX_Risks.md` (six categories; UXR-BASE-01..08), `UX_Tests.md` (usability task cases; UXT-BASE-01..08), `Handoff.md`.
- All L roadmap, risk and test files share the header: Planner writes, Builder records, status legend, evidence tags. Brand also has CLIENT-REPORTED.
- Every L file is under 150 lines (enforced by a test).

Milestones:

- [x] M2.1 M templates for three tracks; render test covers them; no leftover `{{`.
- [x] M2.2 `dev/L` is generic. The grep check passes (see Checks run).
- [x] M2.3 `brand/L` with both NEW and RETROFIT modes.
- [x] M2.4 `uiux/L`: UX_Roadmap, UX_Risks, UX_Tests, Handoff.
- [x] M2.5 Guard test: for all nine combinations, the ZIP file list equals `filePlan`, and no file contains `{{`, `TODO` or `lorem`.

## Current state

- All nine track × size combinations generate. Verified by `files.test.ts` and by building nine ZIPs (see Checks run).
- The form enables download for every size. The browser click was not run (no browser).
- S3 has not been started.

## Checks run

Node v22.22.3, npm 10.9.8. All commands from `/home/user/Nasaq` on branch `arena/3c99cdef-nasaq`. No pipes were used for check commands.

| Command | Result |
| --- | --- |
| `git status --short`, `git branch --show-current`, `git log --oneline -1` | Clean tree. Branch `arena/3c99cdef-nasaq`. HEAD `ad4b875` (main, merge of PR #2). |
| `awk '/^## S2/,/^## S3/' docs/SPRINTS.md` | Read the S2 section. |
| Python edit of `docs/SPEC.md` §5.2 | Done. `grep` shows the new line at line 104. |
| `npm run typecheck` (first try) | exit 127. `tsc: not found`. Cause: `node_modules` was absent in this fresh checkout. |
| `npm install` | exit 0. `found 0 vulnerabilities`. |
| `npm run typecheck` | exit 0 (after install). |
| `npm test` (first run after S2 code) | exit 1. 1 failed, 140 passed. Cause: my new "filePlan sizes" test looped over the entry file name (`README.md`), which uses the shared template. Fixed by skipping the entry file, as the renderer does. |
| `npm test` (final) | exit 0. 9 files, 141 tests passed. |
| `grep -ril "aboalazm\|payload\|neon\|redesign-v2" templates/dev/L` | exit 1, no output: no match. |
| `npm run build` | exit 0. `tsc --noEmit` then `vite build`. |
| Temporary export test (`src/core/tmp-export9.test.ts`) that calls `buildZip` for all 9 and writes `/tmp/nasaq-zips-s2/` | exit 0. Temp file deleted afterwards. 9 ZIPs written. |
| `unzip -Z1` on each of the 9 ZIPs | Each ZIP lists exactly its `filePlan`. S: entry, `project.yml`, `PROJECT.md`. M: entry, `project.yml`, `PROJECT.md`, `PLAN.md`. L: entry, `project.yml`, four track files. |
| `unzip` and `sed` on `brand-L` `Brand_Roadmap.md` and `dev-M` `PLAN.md` | Registry rows and phase blocks rendered with the project's phases. No `{{` left. |

Test changes made because S2 changes behaviour (no assertion was weakened):

- `templates.test.ts`: `sProjectTemplate` and `sPhaseDefs` became `fileTemplate` and `phaseDefs`. The "Read PROJECT.md fully." check now renders the entry file, instead of reading the raw template.
- `render.test.ts`: the S-only "no `{{`" test now covers every track and size.
- `zip.test.ts`: "refuses M and L" became "M and L build a ZIP with their own file lists" (S2 behaviour).
- `intake.test.ts`: "throws for M and L" became "builds M and L phases from their own spec columns".
- `form.test.ts`: "M disables download with the S2 message" became "M enables download"; an L case was added; the override and file-name tests were updated for M.

Manual checks NOT run:

- Clicking Download for each of the nine combinations in a real browser, and opening each file from the browser's download folder. No browser is installed in the sandbox. The ZIPs were built through the same `buildZip` the button calls and opened with `unzip`.
- Visual check of the form at 375 px and 1280 px. Not run (no browser).

## Blockers

1. **Question: what does "AD" mean?** The L brand Roles table says "AD and client decide name, logo, palette, type", as in the S2 outline. The spec does not define AD. I wrote it as "the role that signs off brand decisions" with a note to confirm. Needs your answer.
2. **Question: dev L Build phase.** Spec §5.3 says the L Build column is "Sprints as in doc 26". Doc 26 is not available. The L `phases.yml` item is "Sprints per Implementation.md (source doc 26 was not available)". Should the item be replaced with the real sprint structure when doc 26 is available?
3. **Assumption: "+" in spec §5 M and L columns is cumulative.** I read "+ stakeholder call, peer audit" (M) as added to the S items, and "+ workshop, name and trademark screen" (L) as added to the M items. Each "+" item is its own checklist item. Please confirm.
4. **Carried from S0 (still not confirmed):** non-whole numbers rejected; missing `approvedBy` parses as null; `deadline` may be null and is not checked against `startDate` in the data model (the form warns only); invalid `suggestSize` input throws `RangeError`.

Resolved in S2:

- S1 open question on the UI/UX baseline: resolved by the spec line added to §5.2 and used in the S and M templates. The L UX files use the same line in UX_Roadmap and UXR-BASE/UXT-BASE rows.

## Next

- Review and merge only if the user approves. Do not deploy.
- Answer Blockers 1 to 3.
- Run the manual UI checks in a browser when one is available, then record the results here.
- S3 has not been started. Do not start it until S2 is reviewed.
