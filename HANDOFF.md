# HANDOFF

## Sprint

S3 — Rescope, status and scope alert. Branch: `arena/8b6adae4-nasaq` (session branch, from `main` at `b78bb50`, which includes S2 merged as PR #3). Status: PR #4 open, not merged, not deployed. This revision answers the review of S3. S4 has not been started.

Out of scope (kept): editing phases in the browser, storing projects in the browser, merging the user's edited Markdown.

## Review answers applied (this revision)

1. **Rescope ZIP file rule (changed).** Every rescope ZIP contains: `project.yml` (replaced), `RESCOPE_NOTE.md` (new), the regenerated entry file `README.md` or `AGENTS.md` (replaced, because it states the size), and every file in `filePlan(track, newSize)` that is not in `filePlan(track, oldSize)`. Results: S→M adds PLAN.md; S→L and M→L add the four L files; L→M adds PROJECT.md and PLAN.md; L→S adds PROJECT.md; M→S adds nothing. For L→M and L→S the note tells the user to carry open items from the frozen risk and test files into the Baseline checklist of the new PROJECT.md. Applied in `newFilesFor`, `rescopeZipFiles` (single source for ZIP and note), and the note templates. Tests now cover all six directions for all three tracks with explicit file lists.
2. **Inclusive day count.** Confirmed. No change.
3. **`approvedBy` is required for a rescope.** `rescope()` refuses an empty, blank, or missing value, and its type is now `string`. The page's "Approved by" field is required and says so. It stays optional elsewhere (for example, the initial sizing record keeps `approvedBy: null`).
4. **`itemsAdded` stays empty in v1.** No change.
5. **S0 assumptions confirmed.** No change.
6. **"AD" written out.** The brand templates now say "Art Director" and "the Art Director (the owner) signs off brand decisions". The open question about the meaning of AD was removed. In the dev L phases, the Build item is now "Sprints of up to 5 milestones, one per session". No template mentions doc 26 any more.

## Done

Core (pure, no DOM):

- `src/core/rescope.ts`:
  - `rescope(project, newSize, reason, approvedBy, date, options?)` returns a new project with the size changed and one change record appended to `sizeHistory`. It refuses the same size, a blank reason, a missing or blank approver, a date that is not real, cuts when moving up, unknown or non-open items, and a must cut without a typed reason. The must-cut reason is written into the change record's `reason` text.
  - `newFilesFor(track, from, to)`: the files the user does not have yet (see answer 1).
  - `renderRescopeNote(project, from)`: the change record, a "Files in this ZIP" table (replace, new, or read), and the instructions for the move.
  - `rescopeZipFiles(project, from)`: every file in the rescope ZIP, by name. The ZIP and the note both use it.
- `src/core/zip.ts`: `buildRescopeZip(project, from)` zips `rescopeZipFiles`.
- `templates/_shared/RESCOPE_NOTE.md`, and the instruction snippets `templates/_shared/rescope/{down-L-M, down-L-S, down-M-S, up}.md`. The snippet is chosen by the move: L→M, L→S, M→S, or up (S→M, S→L, M→L).
- `src/core/status.ts`: `status(project, today)` and `scopeAlert(project)` (unchanged from the previous revision).
- `src/core/readProject.ts`: `readProjectYaml(text)` (unchanged).
- `src/core/render.ts`: `render(template, project, extra?)`.
- `src/core/plan.ts`: `roleFiles(track)`.

UI (`src/ui/`):

- `app.ts` (two tabs), `existing.ts` (upload, status, alert, rescope), `status.ts`, `rescope.ts` (approver field now required, label "Approved by (required)"), `dom.ts`, `form.ts` (mounts into a tab panel), `style.css`.

Templates:

- `templates/brand/L/Brand_Roadmap.md`: "Art Director" wording (see answer 6).
- `templates/dev/L/phases.yml`: Build item replaced (see answer 6).

Milestones:

- [x] M3.1 `rescope`: tests for all six directions; refusals for the same size, a blank reason, a missing or blank approver, and a bad date.
- [x] M3.2 Rescope ZIP: exact file list tested for all six directions and all three tracks; no file the user already has, except the regenerated entry file and project.yml.
- [x] M3.3 Cut step on a move down: tested on a sample project, including the must-cut reason.
- [x] M3.4 `status`: tests with a fixed `today`.
- [x] M3.5 `scopeAlert`: boundary tests at 5/6 and 15/16 deliverables, and at the duration boundaries.

## Current state

- Typecheck, all 241 tests, and the build pass on this branch (see Checks run).
- The six directions produce the ZIP contents listed in answer 1. Checked by tests and by a script that wrote one ZIP per direction (below).
- Browser checks have not been run (see below).
- S4 has not been started.

## Checks run

Node v22.22.3, npm 10.9.8. All commands from `/home/user/Nasaq` on branch `arena/8b6adae4-nasaq`. Check commands ran without pipes (output went to a file, and the exit code was read from the command).

### Earlier in this sprint (before this revision)

| Command | Result |
| --- | --- |
| `npm run typecheck` (after the first S3 code) | exit 127: `tsc: not found`. Cause: no `node_modules` on this checkout. |
| `npm install` | exit 0. `found 0 vulnerabilities`. |
| `npm run typecheck` | exit 0. |
| `npm run typecheck` (after UI code) | exit 1 once: `exactOptionalPropertyTypes` in `app.ts`. Fixed. Then exit 0. |
| `npm test` (first run after the new tests) | exit 1. 3 failed, 199 passed. Two upload tests did not wait for the file read; one status test used a 10-day S project, which really exceeds the S limit. Test setup fixed; assertions unchanged. |
| `npm test` | exit 0. 16 files, 202 tests. |
| `npm run build` | exit 0. |
| Scripted flow (generate → upload → rescope down → upload → rescope up, temp test file, deleted) | exit 0. |

### This revision

| Command | Result |
| --- | --- |
| `npm run typecheck` (after the rule and approver changes) | exit 1: 23 errors, 22 of them `null` passed as the approver in tests, and one snippet type that did not include `down-L-S`. Fixed the snippet type; changed the test calls to a real approver name (the type now requires a string, so `null` is caught at compile time). |
| `npm test` (first run) | exit 1. 4 failed, 236 passed. Three UI tests did not fill in the now-required approver field, and one `newFilesFor` expectation listed the L files alphabetically while the function returns them in plan order. Test setup and expected order fixed; no assertion changed. |
| `npm run typecheck` (final) | exit 0. |
| `npm test` (final) | exit 0. 16 files, 241 tests passed. |
| `npm run build` (final) | exit 0. `tsc --noEmit` then `vite build`. |
| `grep -ril "aboalazm\|payload\|neon\|redesign-v2" templates/dev/L` | exit 1, no output: no match (M2.2 still holds). |
| `grep -rn "\bAD\b\|doc 26" templates/` | exit 1, no output: no match. |
| Temp script `src/core/tmp-dirs.test.ts` (writes one rescope ZIP per direction, brand project, then deleted) | exit 0. |
| `unzip -Z1` on each direction's ZIP | S-to-M: `project.yml RESCOPE_NOTE.md README.md PLAN.md`. S-to-L: `project.yml RESCOPE_NOTE.md README.md Brand_Roadmap.md Brand_Risks.md Application_Tests.md Handoff.md`. M-to-L: same as S-to-L. L-to-M: `project.yml RESCOPE_NOTE.md README.md PROJECT.md PLAN.md`. L-to-S: `project.yml RESCOPE_NOTE.md README.md PROJECT.md`. M-to-S: `project.yml RESCOPE_NOTE.md README.md`. |
| `unzip` and `cat` of the L-to-S note | The change record shows the approver and "L → S". The file table says replace `project.yml` and `README.md`, and that `RESCOPE_NOTE.md` and `PROJECT.md` are new. The instructions freeze `Brand_Risks.md` and `Application_Tests.md` and carry open items into the Baseline checklist of the new PROJECT.md. No `{{` in the output. |

Browser checks NOT run (no browser is installed in the sandbox):

- Opening the page and switching between the New project and Existing project tabs.
- Choosing a real `project.yml` with the file picker. The upload path is covered by a jsdom test.
- How the must-cut warning and the required approver field look on screen.
- Clicking Download rescope ZIP in a real browser and opening the file. The ZIP contents are covered by tests and the script run above.
- Layout and readable defaults at phone and desktop widths, and keyboard use of the tabs.

These should be run before merge.

## Manual run (described; the core parts were run by script above)

1. **Generate.** On New project, make a brand project at size L and download the ZIP. Keep its `project.yml`.
2. **Upload.** On Existing project, choose that `project.yml`. The status card shows size L and the open items. There is no scope alert for L.
3. **Rescope down.** Choose M. Reason: "Client cut the workshop". Approved by: a name (required). Date: today. Tick a must item: the warning appears, and you type the reason. Download. The ZIP contains `project.yml`, `RESCOPE_NOTE.md`, `README.md`, `PROJECT.md`, and `PLAN.md`. Follow the note: freeze the risk and test files, and carry their open items into the Baseline checklist.
4. **Upload again.** Choose the new `project.yml`. The status shows size M, the cut item as cut, and two history rows.
5. **Rescope up.** Choose L. Reason and approver required. Download. The ZIP contains `project.yml`, `RESCOPE_NOTE.md`, `README.md`, and the four Brand L files.

Steps 1 to 5 were run as a script (see Checks run), not in a browser.

## Blockers

None open from the review. The review answers above close the earlier questions. Two items remain for your awareness:

1. **Assumption to note:** the inclusive count is used for the S and M duration limits (confirmed in answer 2).
2. **Carried from S0 (confirmed in answer 5):** non-whole numbers rejected; missing `approvedBy` in the data model parses as null; `deadline` may be null and is not checked against `startDate` in the data model (the form warns only); invalid `suggestSize` input throws `RangeError`.

## Next

- Review and merge only if the user approves. Do not deploy.
- Run the browser checks listed above and record the results here.
- S4 has not been started. Do not start it until S3 is reviewed.
