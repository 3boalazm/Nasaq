# HANDOFF

## Sprint

S3 — Rescope, status and scope alert. Branch: `arena/8b6adae4-nasaq` (session branch, from `main` at `b78bb50`, which includes S2 merged as PR #3). Status: PR opened, not merged, not deployed. S4 has not been started.

Out of scope (kept): editing phases in the browser, storing projects in the browser, merging the user's edited Markdown.

## Done

Core (pure, no DOM):

- `src/core/rescope.ts` (M3.1): `rescope(project, newSize, reason, approvedBy, date, options?)` returns a new project with the size changed and one change record appended to `sizeHistory`. It refuses the same size, a blank reason, a date that is not real, cuts when moving up, unknown or non-open items, and a must cut without a typed reason. The must-cut reason is written into the change record's `reason` text. `approvedBy` is optional (blank becomes null).
- `src/core/rescope.ts` (M3.2): `newFilesFor(track, from, to)` and `renderRescopeNote(project, from)`. Going up: the files of the new size that the old size did not have, minus `project.yml`. Going down: none.
- `src/core/zip.ts`: `buildRescopeZip(project, from)`. Contains `project.yml`, `RESCOPE_NOTE.md`, and the new files only.
- `templates/_shared/RESCOPE_NOTE.md` and `templates/_shared/rescope/{down-L-M,down-M-S,up}.md`: the change record and the instructions from spec §6. The instruction text lives in the templates, not in code. A move that crosses two steps (for example L → S) gets both step snippets in order.
- `src/core/status.ts` (M3.4): `status(project, today)` returns size, history, current phase (first phase with an open item), open must and nice items, deliverables (items not cut), days left and overdue. Days left uses the inclusive `durationDays` rule.
- `src/core/status.ts` (M3.5): `scopeAlert(project)` for S and M, with limits read from `thresholds.ts` (`DELIVERABLES_BANDS` and `DURATION_DAYS_BANDS`, `.max`). It returns the reasons and a suggested next size. It never changes the size. L has no alert.
- `src/core/readProject.ts`: `readProjectYaml(text)` wraps `fromYaml` and returns `{ ok, project }` or `{ ok: false, error }`. It does not throw.
- `src/core/render.ts`: `render(template, project, extra?)`. The optional `extra` values are used only by the rescope note.
- `src/core/plan.ts`: exports `roleFiles(track)` (roadmap, risk, test, handoff names of the L files).

UI (`src/ui/`):

- `app.ts`: two tabs, New project and Existing project.
- `existing.ts`: upload `project.yml`, then show status, the alert, and the rescope panel. After a rescope, the page shows the new project.
- `status.ts`: status card, alert (`role="alert"`), size history table.
- `rescope.ts`: new size (default: first size other than the current one), reason (required), approved by (optional), date (default today). The cut step appears only for a move down. Nice open items are listed first, then must. Checking a must item shows a warning (`role="alert"`) and a required typed reason.
- `dom.ts`: shared helpers (`el`, `field`, `saveBlob`). `form.ts` now mounts into a tab panel, so it no longer renders its own page heading.
- `style.css`: plain CSS for tabs, status card, history table and cut step. `[hidden]` is forced to `display: none`.

Milestones:

- [x] M3.1 `rescope`: tests for L→M, M→S, S→M, M→L, the same-size refusal, the empty-reason refusal (and other refusals).
- [x] M3.2 Rescope ZIP file list, checked for all four directions, and for every track. Never includes a file the user already has.
- [x] M3.3 Cut step on a move down: tests on a sample project, including the must-cut warning and typed reason.
- [x] M3.4 `status`: tests with a fixed `today`.
- [x] M3.5 `scopeAlert`: boundary tests at 5/6 and 15/16 deliverables, and at the duration boundaries for S and M.

## Current state

- Typecheck, tests and build pass on this branch (see Checks run).
- The page has the two tabs. The Existing project tab can read a `project.yml`, show status and alert, and produce the rescope ZIP.
- The full generate → upload → rescope down → upload → rescope up run was done with a script, not in a browser (see Checks run).
- S4 has not been started.

## Checks run

Node v22.22.3, npm 10.9.8. All commands from `/home/user/Nasaq` on branch `arena/8b6adae4-nasaq`. Check commands ran without pipes.

| Command | Result |
| --- | --- |
| `git branch --show-current`, `git status --short`, `git log --oneline -1` | Branch `arena/8b6adae4-nasaq`. HEAD `b78bb50` (main). Tree had only the S3 changes. |
| `awk '/^## S3/,/^## S4/' docs/SPRINTS.md` and reads of `thresholds.ts`, `size.ts`, `projectYaml.ts`, `plan.ts` | Read the S3 section and the code it builds on. |
| `npm run typecheck` (first try, after the S3 core code) | exit 127. `tsc: not found`. Cause: `node_modules` was absent on this fresh checkout. |
| `npm install` | exit 0. `found 0 vulnerabilities`. |
| `npm run typecheck` | exit 0. |
| Typecheck after the UI code | exit 1 once: `exactOptionalPropertyTypes` in `app.ts` (an optional `save` passed as `undefined`). Fixed by passing the option only when it is set. Then exit 0. |
| `npm test` (first run after the new tests) | exit 1. 3 failed, 199 passed. (a) Two upload tests in `existing.test.ts` checked for an element that always exists, so they did not wait for the file read. Fixed: the wait now checks the outcome (error text or status card). (b) A status test used the sample S project with a 10-day duration, which really does exceed the S limit of 7. Fixed the test data to a 3-day deadline. Neither fix changes an assertion's meaning. |
| `npm test` (final) | exit 0. 16 files, 202 tests passed. |
| `npm run typecheck` (final) | exit 0. |
| `npm run build` (final) | exit 0. `tsc --noEmit` then `vite build`. Output in `dist/` (gitignored). |
| Scripted flow (temporary test file `src/core/tmp-flow.test.ts`, deleted afterwards): generate → upload → rescope down → upload → rescope up | exit 0. ZIPs written to `/tmp/nasaq-s3/`. |
| `unzip -Z1` on the three flow ZIPs | 1 generated L brand project: `README.md project.yml Brand_Roadmap.md Brand_Risks.md Application_Tests.md Handoff.md`. 2 rescope down L → M: `project.yml RESCOPE_NOTE.md` only. 3 rescope up M → L: `project.yml RESCOPE_NOTE.md Brand_Roadmap.md Brand_Risks.md Application_Tests.md Handoff.md`. |
| `unzip` and `cat` of the down note | Change record shows `L → M`, the date, the reason including the must-cut reason, the approver, `Items cut: p1-1`. The instructions show the freeze banner `> Frozen on 2026-11-05.` and the carry-over step. The "Never dropped" section and the cut notice are present. |

Browser checks NOT run (no browser is installed in the sandbox):

- Opening the page at `/` and switching between the New project and Existing project tabs.
- Choosing a real `project.yml` with the file picker. The upload path is covered by a jsdom test, which sets `files` on the input and fires `change`.
- The must-cut warning as it looks on screen, and whether the typed-reason field appears in the right place.
- Clicking Download rescope ZIP in a real browser and opening the file from the download folder. The button path is covered by jsdom tests, and the ZIP content is covered by the core tests and the script run above.
- Layout and readable defaults at phone and desktop widths, and keyboard use of the tabs.

The logic behind each item is covered by the jsdom and core tests. These browser checks should be run before merge.

## Manual run (described; the core parts were run by script above)

1. **Generate.** On New project, enter a brand project with size L, then Download ZIP. Keep `project.yml` from the ZIP.
2. **Upload.** On Existing project, choose that `project.yml`. The status card shows size L and the open items. Scope alert: none for L.
3. **Rescope down.** Choose M. Reason: "Client cut the workshop". Date: today. Cut step: tick the first item, which is must. The warning appears; type the reason. Download rescope ZIP. The ZIP contains `project.yml` and `RESCOPE_NOTE.md` only. Follow the note: freeze the risk and test files with the banner.
4. **Upload again.** Choose the new `project.yml` from the rescope ZIP. The status shows size M, the cut item as cut, and two history rows.
5. **Rescope up.** Choose L. Reason: "Scope came back". Download rescope ZIP. The ZIP contains the four Brand L files that the user does not have, plus `project.yml` and `RESCOPE_NOTE.md`.

Steps 1 to 5 were run as a script (see Checks run), not in a browser.

## Blockers

1. **Question: where does the baseline checklist live after L → M?** Spec §6 says to carry the open items of the frozen risk and test files into the baseline checklist. The move-down ZIP does not include `PROJECT.md`, because the note says the user already has the files and the sprint says the down ZIP holds only `project.yml` and the note. The note says to carry the items into "the Baseline checklist section of PROJECT.md". If the user does not have PROJECT.md (for example, a project that started at L), they have nowhere to put it. Should the down ZIP include an empty Baseline checklist in a new `PROJECT.md`? That would break the "never include a file the user already has" rule only when they do not have one.
2. **Assumption: "more than 7 days after its start" uses the inclusive count.** You asked for inclusive day counts, so the S duration limit is "inclusive duration above 7". The literal spec wording ("deadline more than 7 days after its start") would allow an 8-day inclusive span (deadline 7 days after start). Under the inclusive rule, an 8-day span is an alert. Please confirm which one you want. The code follows your note.
3. **Assumption: `approvedBy` is optional.** Spec §6 step 4 asks for "who approved". The sprint's M3.1 does not require it. The page leaves it blank by default and records null. Confirm.
4. **Assumption: `itemsAdded` is always empty.** S3 has no step for adding items, so the change record writes `itemsAdded: []`. Confirm that adding items is not part of S3.
5. **Carried from S0 (still not confirmed):** non-whole numbers rejected; missing `approvedBy` parses as null; `deadline` may be null and is not checked against `startDate` in the data model (the form warns only); invalid `suggestSize` input throws `RangeError`.
6. **Carried from S2:** the meaning of "AD" in the brand roles table, and the dev L Build item that refers to doc 26 (not available).

## Next

- Review and merge only if the user approves. Do not deploy.
- Run the browser checks listed above, then record the results here.
- Answer Blockers 1 to 6.
- S4 has not been started. Do not start it until S3 is reviewed.
