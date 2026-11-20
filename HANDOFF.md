# HANDOFF

## Sprint

S4: hardening and release candidate. Branch `arena/566c2423-nasaq`, from `main` at `6b612e7` (S3 merged as PR #4).

Status: pull request open for owner review. Not merged. Not deployed. No further sprint started.

Code commit checked: `d5bc80f` (fresh clone). Earlier S4 commit `595dfe3` (before the preview fix). The commit that adds this file only changes docs.

Out of scope (kept): new features, Arabic UI, integrations.

## Done

| Milestone | Result |
| --- | --- |
| M4.1 Input safety | Done (automated). See details below. |
| M4.2 No runtime network | Done with one open question: two URLs from dependency code are allowed exactly. See Blockers Q1. |
| M4.3 Accessibility and layout | Partly done. jsdom and CSS checks pass. Browser checklist NOT run. See the checklist below. |
| M4.4 Template editing guide | Done. README sections "Editing templates", "Changing the size thresholds". `thresholds.test.ts` reads the bands from the file. |
| M4.5 Release check | Done for the fresh clone. The nine ZIPs were made by the core code, not by clicking the built page. See Blockers Q3. Pull request left open. |

Also done, as asked:

- README: new "Use it" section (three steps: `npm ci`, `npm run build`, `npm run preview`). New "Known limits" section listing each browser check not run.
- `docs/SPRINTS.md` updated to match the build: a "Record (as built)" table of session branches and PRs (S0 to S4); doc 26 and 27 references replaced (not in repo, not used); S3 rescope ZIP rule for six directions; `approvedBy` required for rescope; duration counted inclusively; M4.x accept text updated. Milestone boxes left unticked, as before.

### M4.1 details

- Project name to file name: `projectSlug` in `src/core/files.ts` gives lowercase a-z, 0-9 and "-" only, at most 60 characters. `../`, slashes, Arabic, and HTML all become separators. A name with no usable letters (including all-Arabic) gives `project`. Windows device names (`con`, `nul`, `com1`, …) get the prefix `project-`. The ZIP file name is `{slug}.zip`; the rescope ZIP is `{slug}-rescope-{S|M|L}.zip`. ZIP entry names are fixed and never come from the project name (tested).
- `project.yml` over 1 MB (1,048,576 bytes, counted in bytes, not characters) is refused before it is read (`MAX_PROJECT_YAML_BYTES` in `thresholds.ts`). Message: "project.yml is larger than 1 MB. …"
- Not YAML, YAML that is not a mapping, empty file, duplicate keys, alias bombs, NUL bytes: a message, never a throw. `readProjectYaml` also catches any unexpected error and shows it as a message.
- Unknown fields are an error at every level: top level, phase, item, size history record. Message: `unknown field "owner" in project.yml (phases[0].items[0]). Remove it or fix the spelling.` Before this sprint, unknown fields were silently ignored. No existing test depended on that.
- Upload: the size is checked before the file is read. A read error or a render error shows a message.
- HTML in names: every UI write uses `textContent`. The jsdom test uploads a name containing `<b>x</b>` and `<img src=x onerror=…>`; the text shows as text, no `<b>` or `<img>` is created, and no script runs.
- `innerHTML` search (see Checks): no use in `src/ui` code. The only mention is a comment in `dom.ts`. No justification needed.

### M4.3 checklist (what was checked, and how)

| Item | How checked | Result |
| --- | --- | --- |
| Every input has a label | jsdom: every input, select and textarea on both tabs, before and after an upload, has a non-empty label (`src/ui/safety.test.ts`) | PASS (automated) |
| Keyboard order follows the form | jsdom: no `tabindex` above 0. Page order is DOM order, which is the visual order (not checked in a browser) | PARTLY (automated); keyboard in a browser NOT run |
| Visible focus | CSS rule `:focus-visible` gives a 3 px blue outline to inputs, selects, textareas and buttons (`style.css`) | Rule present; seen in a browser NOT run |
| Text contrast at least 4.5:1 | Computed from the CSS colours for 11 text pairs (`src/ui/contrast.test.ts`). Lowest enabled-text pair: 6.02:1 (active tab). Disabled button was 2.8:1; darkened to `#6e6e75` (5.06:1). Input border 3.43:1 (needs 3:1). | PASS (computed, not seen on screen) |
| Usable at 375 px width | Not checked. No browser in the sandbox. | NOT RUN |

## Current state

- All tests pass (302), typecheck passes, build passes (includes the dist scan), fresh clone reproduces the same results.
- Not run in a browser: see Known limits in README (tab switching, file picker, must-cut warning and approver field on screen, both downloads opened, 375 px and 1280 px layout, keyboard and focus ring in a browser, screen reader).
- The built page was served with `npm run preview` and returned HTTP 200 for the page and its script.

## Checks run

Node v22.22.3, npm 10.9.8. Check commands ran without pipes; exit codes were read from the command.

### Final: fresh clone of `d5bc80f` (`/tmp/s4-final`)

| Command | Result |
| --- | --- |
| `git clone --branch arena/566c2423-nasaq …` | exit 0. Commit `d5bc80f`. |
| `npm ci` | exit 0. |
| `npm test` | exit 0. 20 files, 302 tests passed. |
| `npm run typecheck` | exit 0. |
| `npm run build` | exit 0. `tsc --noEmit`, `vite build` (built in 184 ms), then `postbuild` (`vitest run --config vitest.dist.config.ts`): 8 tests passed. |
| `npm run test:dist` | exit 0. 8 tests passed. |
| Nine ZIPs (3 tracks × 3 sizes) written with `buildZip`, then `unzip -tq` | exit 0 for all nine; all tests of the archives OK. |
| Rescope ZIPs: 6 directions × 3 tracks (18 ZIPs) with `buildRescopeZip` | exit 0. File lists below. |
| `grep -ril "aboalazm\|payload\|neon\|redesign-v2" templates/dev/L` | exit 1 (no match). |
| `grep -rn "\bAD\b\|doc 26" templates/` | exit 1 (no match). |
| `grep -o "https\?://[^\"' )]*" -r dist` | exit 0. Two hits, both in code, both in the allowlist (Blockers Q1): `https://rolldown.rs/in-depth/bundling-cjs#require-external-modules` and `https://stuk.github.io/jszip/documentation/howto/read_zip.html`. No other URL. |
| `grep -rn "innerHTML" src/ui --include=*.ts \| grep -v "\.test\.ts"` | Only `src/ui/dom.ts:1`, a comment ("without innerHTML"). No use. |
| `grep -rn "insertAdjacentHTML\|outerHTML\|document.write\|eval(\|new Function" src scripts` | Only `outerHTML` read inside a test message. No HTML sink. |
| `grep -rn "https\?://" src templates index.html` (excluding tests) | exit 1 (no match). |

ZIP file lists, final clone (all nine plus `unzip -Z1`):

- brand L: `README.md project.yml Brand_Roadmap.md Brand_Risks.md Application_Tests.md Handoff.md`
- brand M: `README.md project.yml PROJECT.md PLAN.md`
- brand S: `README.md project.yml PROJECT.md`
- dev L: `AGENTS.md project.yml Implementation.md Security_issues.md Test_scenarios.md Handoff.md`
- dev M: `AGENTS.md project.yml PROJECT.md PLAN.md`
- dev S: `AGENTS.md project.yml PROJECT.md`
- uiux L: `README.md project.yml UX_Roadmap.md UX_Risks.md UX_Tests.md Handoff.md`
- uiux M: `README.md project.yml PROJECT.md PLAN.md`
- uiux S: `README.md project.yml PROJECT.md`

Rescope ZIPs, final clone (each has `project.yml`, `RESCOPE_NOTE.md`, the entry file, and the new files only):

- S→M adds `PLAN.md`; S→L and M→L add the four L files; L→M adds `PROJECT.md` and `PLAN.md`; L→S adds `PROJECT.md`; M→S adds nothing.
- All three tracks match this rule (for example `brand-L-to-M`: `project.yml RESCOPE_NOTE.md README.md PROJECT.md PLAN.md`; `dev-M-to-S`: `project.yml RESCOPE_NOTE.md AGENTS.md`).

### Workspace, commit `595dfe3` (before the preview fix)

| Command | Result |
| --- | --- |
| `npm ci` | exit 0 |
| `npm run typecheck` | exit 0 (after the M4.1 changes; rerun after all tests were added: exit 0) |
| `npm test` | exit 0. 20 files, 302 tests. |
| `npm run build` | exit 0 |

### Preview check (`npm run preview`, README step 3)

- First try: `vite preview` returned a warning, "Port 4173 REJECTS the user's preview host … HTTP 403". Fixed by `preview.allowedHosts: [".e2b.app"]` and `host: "0.0.0.0"` in `vite.config.ts` (commit `d5bc80f`).
- After the fix: no warning. `GET /` with the sandbox host header returned 200. The script `/assets/index-Bx9H5tb4.js` returned 200 (262,631 bytes).

### Failures during this sprint (all fixed; no assertion weakened)

1. `input-safety.test.ts`: one test read `README.md` for a dev project, whose entry file is `AGENTS.md`. Test fixed.
2. Contrast test: Vitest stubbed the CSS imports (`?raw`, `?inline`) as empty strings. Changed to read `style.css` with Node's `fs` through `process.getBuiltinModule`, which needs no new package.
3. Contrast helper: `#fff` (3 digits) was read as NaN. Helper now expands 3-digit colours.
4. Contrast, real finding: the disabled download button (white on `#9a9aa0`) is 2.8:1. Disabled controls are exempt from WCAG, but this sprint asks for 4.5:1. Background darkened to `#6e6e75` (5.06:1).
5. Contrast test string match: CSS writes `#fff`, the test wrote `#ffffff`. Test corrected to the CSS form.

### Development runs (before the final clone)

- Full suite after the M4.1 core changes: 241 existing tests still passed; then 61 new tests were added (302 total).

## Blockers

Open questions. Owner decision needed. None of these stops the pull request from being reviewed.

1. **M4.2 is not met as written, for two URLs in dependency code.** The rule says the built page may contain `http://` or `https://` only in comments or license text. Two URLs are in code strings: the bundler's helper error text (`rolldown.rs`) and jszip's error hint (`stuk.github.io/jszip`). `scripts/dist-scan.test.ts` allows exactly these two, each must appear exactly once, and any other URL fails the build. Options:
   - (a) Keep the exact allowlist (current). Recommended: nothing is fetched; these are error texts.
   - (b) Patch the dependency output to remove the strings. This is a build change that alters third-party code.
   - (c) Limit the rule to the page's own code and drop dependency text from the scan.
2. **M4.3 browser checklist not run.** The sandbox has no browser. Items not run: keyboard in a browser, focus ring, 375 px layout, screen reader. The owner should run them before release.
3. **M4.5 "generate all 9 ZIPs from the built page" was done from the core code.** Clicking the built page needs a browser. The nine ZIPs use the same `buildZip` function the page calls. Is that acceptable for the release candidate, or should the browser run be done first?
4. **1 MB limit.** Set to 1,048,576 bytes (1 MiB), counted in bytes. Is that the meaning of "1 MB" you want? If you prefer 1,000,000 bytes, change `MAX_PROJECT_YAML_BYTES` in `src/core/thresholds.ts`.
5. **Preview host in `vite.config.ts`.** `preview.allowedHosts: [".e2b.app"]` is needed for the sandbox preview link. Keep it for the review, or remove it before any real deployment.
6. **Unknown fields are now an error** (previously silently ignored). Projects made by this page are unaffected. A hand-edited `project.yml` with an extra field will now be refused with the field name.

Carried from S3 (still closed): the L→M and L→S carry-over rule, the inclusive day count, `approvedBy` required for rescope, `itemsAdded` empty in v1, S0 assumptions, and the "Art Director" and dev L wording.

## Next

- Owner review of PR #4 and this S4 pull request. Per the sprint, a second model should review S3 and S4 (rescope logic and input safety) before merging.
- Run the browser checklist (README "Known limits"). Record the results here.
- Answer Blockers 1 to 6.
- Do not merge or deploy until the owner asks.
