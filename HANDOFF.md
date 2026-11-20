# HANDOFF

## Sprint

S4: hardening and release candidate. Branch `arena/566c2423-nasaq`, from `main` at `6b612e7` (S3 merged as PR #4). Pull request: #5, open for review. Not merged. Not deployed. No further sprint started.

Code commit checked in this revision: `8afcc58` (fresh clone). This file is updated in a later commit that only changes docs.

Out of scope (kept): new features, Arabic UI, integrations.

## Review round 2 (this revision)

The owner reviewed S4 in a real browser (headless Chrome, `vite preview`): new project, ZIP download, upload, bad uploads, rescope down with a must cut, rescope up. No page errors, no outside requests, and HTML in the project name stayed plain text. Four fixes were requested.

### 1. 375 px overflow (owner's measurement, before this fix)

Measured by the owner in a real browser: document `scrollWidth` was **543** at 375 px. Every `.field`, label, input and select had a right edge at 543. The page scrolled sideways.

Likely cause (from the code, not re-measured): the "Risk if wrong" `<select>` has a long option ("Hard to undo (production database, print run, legal, launch date)"). A select's minimum width follows its longest option, and the grid column took that width.

Fix in `src/ui/style.css`:
- `*, *::before, *::after { box-sizing: border-box }`.
- `.intake` and `.field` use `grid-template-columns: minmax(0, 1fr)` with `min-width: 0`, so a column can shrink.
- Text inputs, selects and textareas: `width: 100%`, `min-width: 0`, `max-width: 100%`. Checkboxes and radios are excluded.
- `.tabs` wraps. `.status` uses `minmax(0, 1fr)` for its value column.
- `.history` sits in `.table-wrap` (`overflow-x: auto`), so a wide table scrolls inside its own box.
- `body` has `overflow-wrap: anywhere`, so long words wrap.

Status of the fix: **not measured in this sandbox** (no browser; Chrome cannot be downloaded from here). Guard tests check that the CSS rules are present (`src/ui/layout.test.ts`). They are not a layout measurement. **Please re-measure at 320, 375 and 1280 px** for both tabs.

### 2. Errors shown before the user typed

- Field errors are shown only after that field was touched (it lost focus, or its value changed), or after the first click on "Download ZIP".
- "Download ZIP" is always enabled. The first click reveals every error, focuses the first invalid field, and saves nothing. A valid click saves as before.
- Each error is a line under its field (`#err-f-…`), hidden until shown. The invalid control gets `aria-invalid` and `aria-describedby`.
- Core: `fieldErrors(answers)` returns one message per invalid field (`src/core/intake.ts`). `validateAnswers` still returns the same messages in the same order.
- Tests: `src/ui/form.test.ts` (touch, blur on another field, fix clears, first click reveals and focuses, valid click reveals nothing). Two old assertions that expected a disabled button were replaced, because that behaviour was changed on request.

### 3. `itemsAdded` in the initial record

`createProject` now writes `itemsAdded: []` in the first size record. The items are still in `phases`. Tests: `src/core/review-fixes.test.ts` check all nine track × size combinations.

### 4. Cut items as "title (id)"

- `describeItem` / `describeItems` (`src/core/status.ts`): `Title (id)`; a bare id when the project has no such item.
- `RESCOPE_NOTE.md`: the "Items cut" row and the "This change cuts:" sentence use the labels. A `|` in a title is escaped so the table is not broken.
- Status size history: new "Items cut" column with the labels (`src/ui/status.ts`); the stored data stays as ids.
- Example from the rescope ZIP (`brand-L-to-S`): `| Items cut | Questionnaire + 5 peers (p1-1) |`.

## Done

| Milestone | Result |
| --- | --- |
| M4.1 Input safety | Done (automated). Slug, `project.yml` limits (1 MB, unknown fields, malformed input), HTML shown as text. |
| M4.2 No runtime network | Done, with one open question (Blockers Q1): two dependency URLs in code are allowed exactly once each. |
| M4.3 Accessibility and layout | Partly done. jsdom and CSS checks pass. Browser checks NOT run in this sandbox. Owner's browser measurement recorded above. |
| M4.4 Template editing guide | Done (README; `thresholds.test.ts`). |
| M4.5 Release check | Done in a fresh clone. The nine ZIPs were made with the core code, not by clicking the built page (Blockers Q3). |
| Docs | `docs/SPRINTS.md` matches the build (session branch record, no docs 26/27, six-direction rescope rule, `approvedBy` required, inclusive day count). README has "Use it" and "Known limits". |

### M4.3 checklist (automated results; browser items NOT run)

| Item | How checked | Result |
| --- | --- | --- |
| Every input has a label | jsdom: every input, select and textarea on both tabs, before and after an upload | PASS (automated) |
| Keyboard order follows the form | jsdom: no `tabindex` above 0; page order is DOM order | PARTLY; keyboard in a browser NOT run |
| Visible focus | CSS `:focus-visible` outline on inputs, selects, textareas and buttons | Rule present; seen in a browser NOT run |
| Text contrast ≥ 4.5:1 | Computed for 11 text pairs from `style.css` (`src/ui/contrast.test.ts`). Lowest enabled text: 6.02:1. Disabled button: 5.06:1. Input border: 3.43:1 (needs 3:1). | PASS (computed, not seen on screen) |
| Usable at 320, 375 and 1280 px | Owner measured the overflow before the fix (543 px at 375). Fix applied. Not re-measured here. | NOT RUN here; owner to re-measure |

## Current state

- Typecheck passes. 332 tests pass (23 files). Build passes, including the dist scan (8 tests). A fresh clone of `8afcc58` gives the same results.
- Browser checks not run in this sandbox: see README "Known limits". The owner's browser run covered the flows listed above; the 375 px fix still needs a re-measure.
- The built page was served with `vite preview` and returned HTTP 200 for the page.

## Checks run

Node v22.22.3, npm 10.9.8. Check commands ran without pipes; exit codes were read from the command.

### Final: fresh clone of `8afcc58` (`/tmp/s5-final`)

| Command | Result |
| --- | --- |
| `git clone --branch arena/566c2423-nasaq …` | exit 0. Commit `8afcc58`. |
| `npm ci` | exit 0 |
| `npm test` | exit 0. 23 files, 332 tests passed. |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0. `tsc --noEmit`, `vite build` (built in 161 ms), then `postbuild` dist scan: 8 tests passed. |
| `npm run test:dist` | exit 0. 8 tests passed. |
| Nine project ZIPs (`buildZip`, 3 tracks × 3 sizes), `unzip -tq` | exit 0 for all nine. File lists below. |
| Eighteen rescope ZIPs (6 directions × 3 tracks), `buildRescopeZip` | exit 0. File lists below. |
| Rescope note content (`unzip -p brand-L-to-S.zip RESCOPE_NOTE.md`) | Shows `Questionnaire + 5 peers (p1-1)` in the table and in the cut sentence. |
| `itemsAdded` in a generated `project.yml` (`dev-M`) | `itemsAdded: []` |
| `grep -ril "aboalazm\|payload\|neon\|redesign-v2" templates/dev/L` | exit 1 (no match) |
| `grep -rn "\bAD\b\|doc 26" templates/` | exit 1 (no match) |
| `grep -o "https\?://[^\"' )]*" -r dist` | exit 0. Two hits, both in code, both allowlisted: `https://rolldown.rs/in-depth/bundling-cjs#require-external-modules` and `https://stuk.github.io/jszip/documentation/howto/read_zip.html` (Blockers Q1). No other URL. |
| `grep -rn "innerHTML" src/ui --include=*.ts \| grep -v "\.test\.ts"` | Only `src/ui/dom.ts:1`, a comment. No use. |
| `npm run preview` (`vite preview`), `GET /` with a sandbox host header | HTTP 200 |

Nine project ZIPs (all `unzip -tq` OK):

- brand L: `README.md project.yml Brand_Roadmap.md Brand_Risks.md Application_Tests.md Handoff.md`
- brand M: `README.md project.yml PROJECT.md PLAN.md`
- brand S: `README.md project.yml PROJECT.md`
- dev L: `AGENTS.md project.yml Implementation.md Security_issues.md Test_scenarios.md Handoff.md`
- dev M: `AGENTS.md project.yml PROJECT.md PLAN.md`
- dev S: `AGENTS.md project.yml PROJECT.md`
- uiux L: `README.md project.yml UX_Roadmap.md UX_Risks.md UX_Tests.md Handoff.md`
- uiux M: `README.md project.yml PROJECT.md PLAN.md`
- uiux S: `README.md project.yml PROJECT.md`

Eighteen rescope ZIPs (all `unzip -tq` OK). Each has `project.yml`, `RESCOPE_NOTE.md`, and the entry file, plus the new files only. The rule holds for all three tracks: S→M adds `PLAN.md`; S→L and M→L add the four L files; L→M adds `PROJECT.md` and `PLAN.md`; L→S adds `PROJECT.md`; M→S adds nothing. For example `brand-L-to-M`: `project.yml RESCOPE_NOTE.md README.md PROJECT.md PLAN.md`.

### Development runs in this revision

| Step | Result |
| --- | --- |
| Typecheck after the core changes | exit 0 |
| `npm run typecheck`, `npm test` (form tests, first run) | exit 1: 10 tests failed with `ReferenceError: btn is not defined`. My edit had removed the `btn` helper line from `form.test.ts`. Helper restored; assertions unchanged. Then exit 0. |
| `npm test` (full suite, after all changes) | exit 0. 23 files, 332 tests. |
| `npm run build` | exit 0 |
| Temporary script writing the ZIPs (in `/tmp`, not in the repo) | exit 1 once: my script compared size letters as strings, so it cut items on the wrong moves. Fixed to compare size ranks. Then exit 0. The ZIPs above come from the fixed run. |

Earlier revisions' results are in the git history.

## Blockers

Open questions. Owner decision needed. None stops the pull request from being reviewed.

1. **M4.2 is not met as written, for two URLs in dependency code.** The rule allows `http://` or `https://` only in comments or license text. Two URLs are in code strings: the bundler's helper error text and jszip's error hint. `scripts/dist-scan.test.ts` allows exactly these two, each once. Options: (a) keep the exact allowlist (current; nothing is fetched); (b) patch the dependency output; (c) limit the rule to the page's own code.
2. **375 px fix not re-measured.** Owner to re-measure at 320, 375 and 1280 px, for both tabs, after this revision.
3. **M4.5 "all 9 ZIPs from the built page"** was done with the core code, not by clicking the built page. Accept, or run the browser step first?
4. **1 MB limit** is 1,048,576 bytes. Say if you want 1,000,000.
5. **Preview host** in `vite.config.ts` (`preview.allowedHosts: [".e2b.app"]`) is for the sandbox preview. Keep it for review, or remove it before any real deployment.
6. **Unknown fields are an error now** (before, they were ignored). A hand-edited `project.yml` with an extra field is refused with the field name.
7. **Validation timing.** Errors show after a field is touched or after the first Download click. Confirm this is the behaviour you want for every field, including the number fields.

Closed from earlier rounds: the L→M and L→S carry-over rule, the inclusive day count, `approvedBy` required for rescope, `itemsAdded` empty in v1 (now also in the initial record), S0 assumptions, and the "Art Director" and dev L wording.

## Next

- Owner: re-measure the layout (Blockers 2) and run the browser checks in README "Known limits".
- Owner: answer Blockers 1 and 3 to 7.
- Second-model review of S3 and S4 (rescope logic, input safety), per the sprint's review checklist.
- Do not merge or deploy until the owner asks.
