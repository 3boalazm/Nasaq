# HANDOFF

## Sprint

S1 — Fill the form, download a working ZIP for any track at size S. Branch: `arena/1120c134-nasaq` (session branch, from `main` at `5573fb2`). Status: PR opened, not merged, not deployed.

Out of scope (kept): M and L templates, rescope, status view, styling beyond readable defaults.

## Done

Cleanups (same PR):

- Deleted `docs/123` (stray 1-byte file).
- `docs/SPEC.md` §4 Approvers row now reads `1 approver | 2 approvers | 3 or more`, matching `thresholds.ts`. This resolves S0 Blocker 1.
- `docs/SPRINTS.md` Preamble: name is "Nasaq"; rule 5 is "Work on the session branch Arena gives you. Open a pull request. Do not merge and do not deploy."

Dependencies: `jszip` (runtime), `jsdom` (dev). Both user-approved.

Templates (`templates/`, size S only):

- `templates/_shared/entry.md`: six always-on rules (spec §3) and the start prompt. Shared by all tracks.
- `templates/{brand,uiux,dev}/S/PROJECT.md`: sections in order Brief, Out of scope, Phases, Baseline checklist, Decisions (Date | Decision | Why), Feedback log, Handoff.
- `templates/{brand,uiux,dev}/S/phases.yml`: phase checklist copied from the S column of spec §5.1, §5.2, §5.3. The test `templates.test.ts` checks brand and dev against the spec text.

Code:

- `src/core/render.ts` (M1.1): `render(template, project)` replaces every `{{key}}` and throws on an unknown key. `buildContext` derives the values from the project.
- `src/core/templates.ts`: loads the templates as raw text and parses the S phase lists.
- `src/core/files.ts`: `renderProjectFiles(project)` renders exactly `filePlan(track, "S")`; `projectSlug` and `zipFileName` give `{project-slug}.zip`. M and L throw `templates ... arrive in S2`.
- `src/core/zip.ts`: `buildZip(project)` → Blob (jszip).
- `src/core/intake.ts`: `durationDays` (inclusive of both days, minimum 1), `validateAnswers`, `suggestFromIntake`, `createProject` (all items `must` / `todo`; the initial size is recorded in `sizeHistory`), `parseOutOfScope`, `todayIso`.
- `src/ui/form.ts`: intake form built with DOM APIs (no `innerHTML`). Fields: name, track, start date (default today), deadline, five size questions, approver, out of scope. Shows the suggested size with the deciding answers, and a size override select. M or L shows "Templates for size M arrive in S2" and disables the download button. Download calls `buildZip` and saves `{slug}.zip`.
- `src/ui/main.ts`, `src/ui/style.css` (plain CSS, readable defaults). `src/main.ts` removed; `index.html` points at `src/ui/main.ts`.

Milestones:

- [x] M1.1 `render` replaces every `{{key}}`, throws on unknown key. Tests: `render.test.ts`.
- [x] M1.2 Three S templates, section order tested, no leftover `{{` (tested for all tracks). The UI/UX baseline is a placeholder — see Blockers 2.
- [x] M1.3 Entry file: six rules and start prompt, tested.
- [x] M1.4 Form with the required fields, suggestion with deciding answers, override, M/L disables download with the S2 message. DOM tests in `src/ui/form.test.ts` (jsdom). The manual browser check was NOT run — see Checks run.
- [x] M1.5 Download produces `{slug}.zip` with exactly `filePlan` files for S. Test `zip.test.ts` unzips each track and compares names. ZIPs for all three tracks were also generated and opened (see Checks run).

## Current state

- Working tree on `arena/1120c134-nasaq` is complete for S1 and committed as one PR.
- The form is wired to the pure core. The only DOM code is in `src/ui/`.
- No M or L template exists; M and L are blocked at the form and at `buildZip` / `renderProjectFiles`.
- S2 has not been started.

## Checks run

Node v22.22.3, npm 10.9.8. All commands from `/home/user/Nasaq` on branch `arena/1120c134-nasaq`. Final run on the tree that was committed:

| Command | Result |
| --- | --- |
| `npm install` (after adding `jszip` and `jsdom`) | exit 0. `found 0 vulnerabilities` |
| `npm install --save jszip` / `npm install --save-dev jsdom` | Both succeeded (`package.json` shows `dependencies`: jszip ^3.10.2, yaml ^2.9.1; `devDependencies`: jsdom ^31.0.1, typescript, vite, vitest). Note: these two were run through `\| tail -1`, so the exit code shown was tail's. The success is confirmed by the package.json contents and by the final `npm install` below, which ran without a pipe. |
| `npm test` (before S1 test files existed) | exit 0. 3 files, 51 tests passed (baseline) |
| `npm run typecheck` (after core/UI code) | exit 0 |
| `npm run build` (after UI code) | exit 0. `tsc --noEmit` then `vite build`. Output in `dist/` (gitignored) |
| `npm test` (final) | exit 0. 8 files, 94 tests passed (size 25, projectYaml 15, plan 11, render, templates, zip, intake, form) |
| `npm run typecheck` (final) | exit 0 |
| `npm run build` (final) | exit 0 |
| `npm install` (final) | exit 0 |

First test run after adding the form tests: 2 failures, both caused by my test data. I used a 31-day duration, which is the L band (29+), and expected M. I changed the deadline to 2026-12-01 (12 days, M band). The assertions were not changed.

ZIP check (M1.5 "downloaded and opened"):

- Browser download NOT run: no browser is installed in the sandbox (no chromium, chrome, firefox, or Playwright cache), so the button click was not run in a real browser. The button path is covered by the jsdom test, which checks the saved filename `acme-relaunch.zip` and a non-empty blob.
- Instead, `buildZip` was called for the three S tracks with the same project settings and written to `/tmp/nasaq-zips/` (outside the repo). Opened with `unzip -l` and `unzip`:
  - `brand-demo-project.zip`: `README.md`, `project.yml`, `PROJECT.md`
  - `uiux-demo-project.zip`: `README.md`, `project.yml`, `PROJECT.md`
  - `dev-demo-project.zip`: `AGENTS.md`, `project.yml`, `PROJECT.md`
- The dev `PROJECT.md` was read and shows the title, brief, out of scope, and the five phases with `[must]` items. `project.yml` shows `startDate`, `sizeHistory`, and the phase ids.

Manual UI checks NOT run (M1.4, no browser available):

- Typing into the real form in a browser.
- Visual layout and readable defaults on a phone-width screen.
- Clicking Download in a real browser and opening the file from the browser's download folder.
- Keyboard-only flow and screen-reader labels.

These are the only UI checks not run. The logic behind each is covered by the jsdom tests.

## Blockers

1. **Resolved:** S0 Blocker 1 (approvers wording) — fixed by cleanup 2. Blocker 3 (`docs/123`) — fixed by cleanup 1.
2. **Open question — UI/UX baseline.** Spec §5.2 gives a list of fixed items for brand (§5.1) and dev (§5.3), but no "fixed at any size" line for UI/UX. The UI/UX `PROJECT.md` has a Baseline checklist section with the text "not defined for UI/UX in spec section 5.2. To be confirmed by the owner." M1.2 requires the section, so it is present, but its content is a placeholder. Question: what is the UI/UX baseline list?
3. **Open, carried from S0 (not confirmed by the user):** S0 Blocker 2 assumptions remain as implemented: non-whole numbers are rejected; a missing `approvedBy` parses as null; `deadline` may be null and its order relative to `startDate` is not checked; invalid `suggestSize` input throws a `RangeError`. The form does show a warning when the deadline is before the start date, and the duration then counts as 1 day. This is UI-only and does not block the data model.

## Next

- Review and merge only if the user approves. Do not deploy.
- Answer Blocker 2 (UI/UX baseline list) before S2, or leave the placeholder.
- Run the manual UI checks listed above in a browser when one is available, then record the results here.
- S2 has not been started. Do not start it until S1 is reviewed.
