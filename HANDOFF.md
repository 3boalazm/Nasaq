# HANDOFF

## Sprint

S5: UI redesign. Branch `arena/7ff7b194-nasaq`, from `main` at `4a23fb0` (S4 merged as PR #5). Pull request: open from this branch, not merged. Not deployed. No further sprint started.

Code commit checked in the latest revision: `e251e11` (fresh clone, see "Review round 3" below). This file is updated in a later commit that only changes docs.

## Review round 3 (on `e251e11`)

The owner checked `fc3012c` in Chrome: colours, cards, borders, selected states and the dashboard render; 390 tests passed. One accuracy fix was requested.

1. **Phase bars by item count.** Each phase bar has three segments, sized by item count: done = dark green (`--accent`), open = neutral grey (`--line-soft`, on a white track with a 1px `--line` edge so the grey is visible), cut = striped grey (`--cut` and `--line`). A phase with 0 done has no green segment. The text label is unchanged, for example "0 done · 2 open · 0 cut", and is the accessible label. The open segment was light green before; that was the bug.
2. **Open items progress bar.** Counts done items against items not cut, across all phases. Its colour is unchanged (light green, per the S5 token rule "light green for progress"). Tests check the value and the maximum.
3. **Dashboard layout.** The Size history card is full width, so it no longer sits alone in a row. The grid stretches cards to the row height (`align-items: stretch`, guarded by a test). Row order on desktop: Open items (2 columns) and Size; Deliverables, Scope and Phases; Size history (full width); Rescope (full width).

Tests added: `src/ui/dashboard.test.ts` (phase bars for 0 done, some done, all done, one cut, proportional sizes; Open items bar counts; history full width) and `src/ui/layout.test.ts` (phase colour rules; no `accent-light` on the open segment; grid stretch).

### Checks (fresh clone of `e251e11`, `/tmp/t3-final`)

| Command | Result |
| --- | --- |
| `npm ci` | exit 0 |
| `npm test` | exit 0. 27 files, 400 tests passed. |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0. Postbuild dist scan passes. |
| `npm run test:dist` | exit 0. 14 tests passed. |
| URLs in `dist/` | 2 distinct, both dependency strings already allowlisted. |
| `grep innerHTML` in `src/ui` (not tests) | Only a comment (`dom.ts:1`). |

The same commands pass in `/home/user/Nasaq` at `e251e11`.

### Still not seen

I have not seen the page in a browser. There is no browser in this sandbox. The phase colours, the striped cut segment, and the card layout are verified by tests on the DOM and the CSS source, not by looking at the result. Please check the phase bars and the dashboard row layout in Chrome at 375, 1280 px.

## Review fix round (PR #6 review, on `fc3012c`)

The owner's Chrome run found the page had no colours, card backgrounds, borders or visible inputs. Cause, verified in the built output before the fix: `src/ui/tokens.css` was never imported. `main.ts` imported only `style.css`, so the built CSS had 0 custom-property definitions and 109 `var(--…)` uses.

Fixes:

1. **Tokens load first.** `src/ui/main.ts` imports `./tokens.css`, then `./style.css`. The built CSS now defines 23 tokens and uses 113 `var(--…)` names.
2. **Dist test for tokens** (`scripts/dist-scan.test.ts`, runs after the build): every `var(--name)` in the built CSS is defined there; the built CSS defines `--page`, `--surface`, `--ink` and `--accent`. Negative check: with the import removed, `npm run build` exited 1 (the postbuild scan ran and failed), and the scan reported 2 failing tests (`undefined tokens` and missing `--page, --surface, --ink, --accent`). With the import restored, all pass. So the check would have caught this.
3. **Input borders.** Text, date, number and textarea fields use `border: 1px solid var(--line)` on `background: var(--surface)`. The focus ring is `outline: 3px solid var(--focus)`. Tested in the built CSS (`scripts/dist-scan.test.ts`) and in the source CSS (`src/ui/layout.test.ts`).
4. **File input in the drop zone.** The native input stays visible and reachable by keyboard (not hidden, not removed). Only its button is restyled, as a pill (`input[type="file"]::file-selector-button`). The zone keeps its dashed `--line` border on a white card. Tested in `src/ui/buttons.test.ts` and the dist test.
5. **Download rescope ZIP** is `className: "primary"`, the same pill as Download ZIP. Tested in `src/ui/buttons.test.ts`, which also checks that every action button on the page is a primary or secondary pill (tabs excluded).

### Checks (fresh clone of `fc3012c`, `/tmp/r-final`)

| Command | Result |
| --- | --- |
| `npm ci` | exit 0 |
| `npm test` | exit 0. 27 files, 390 tests passed. |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0. Built CSS: 23 token definitions, 113 uses. Postbuild dist scan passes. |
| `npm run test:dist` | exit 0. 14 tests passed. |
| URLs in `dist/` | 2 distinct, both dependency strings already allowlisted (`rolldown.rs`, `stuk.github.io/jszip`). |

The same commands pass in `/home/user/Nasaq` at `fc3012c`.

### What I still cannot see

I cannot see the page. There is no browser in this sandbox, and browser binaries cannot be downloaded from the allowed hosts. The fixes are verified by the built CSS and by jsdom and dist tests, which check that the rules and tokens exist. They do not show that the page looks right. Colours, spacing, the file input's look, and the rescope button's look still need the browser checks in README "Known limits", at 320, 375 and 1280 px, on this build.

## What changed

Layout references used: stepper card, numbered cards, tinted category cards, onboarding selection cards, glass-free dashboard with checklist, teal finance dashboard, time-tracker widgets. Only the named patterns were used. No logos, product names, illustrations, 3D, photos, or copied colours. All text is Nasaq's own.

### New project: three-step wizard (`src/ui/form.ts`)

- Segmented progress bar with the text "1 of 3", large question headings, Back and Continue pill buttons.
- Step 1 "What kind of project?": project name, then three track cards (tinted: brand peach, UI/UX lilac, development green). Each card shows its phase count, read from `phaseDefs()` in core, not typed in.
- Step 2 "How big is it?": start, deadline, deliverables, approvers, then risk and unknowns as three selection cards each.
- Step 3 "Confirm the size": the labelled stepper, S/M/L cards numbered 01 to 03. The suggested card is checked and labelled "Suggested". Its detail lists the deciding answers and the files from `filePlan()`. The detail of the chosen card is shown; the others are hidden. Then approver name, out of scope, and Download ZIP. The tip chip reads "Tip: cut nice items first when the deadline moves."
- Summary panel: beside the step at 900 px and wider, below it on narrower screens. It shows the project name, track, dates, duration in days, and the live suggestion.
- Continue is blocked on an invalid step. Errors show after a field is touched or after the first Continue click, and focus moves to the first invalid field. Download on step 3 reveals every error and jumps to the step with the first invalid field.
- Selection cards are real radio inputs. The card is the label. Groups share a `name`, so arrow keys work natively.

### Existing project: dashboard (`src/ui/existing.ts`, `src/ui/status.ts`)

- Before upload: one large drop-zone card around the real file input (`#up-file`). Dropping a `project.yml` on it works the same as choosing it. After a good upload the card shrinks to a compact row.
- Header: project name, size pill, track pill.
- Cards, in this order: Open items (first; must items before nice; progress bar and text), Size (letter, start date, days left), Deliverables (count not cut, segmented bar of the limit from `thresholds.ts`; L shows the minimum from `thresholds.ts` and no bar), Scope (amber only when the alert is active, otherwise "Within limits"), Phases (one bar per phase: done, open, cut, with counts written out), Size history (newest first, activity list).
- Rescope card, full width: the same form as before, with the new size as selection cards.
- Every number on a card comes from `project.yml`, `thresholds.ts`, or the date counted from today. Phase counts in the wizard come from the templates through core.

### Tokens and font

- `src/ui/tokens.css` defines every colour, radius and shadow: off-white page, white cards, radius 20px, pills 999px, soft shadow, one green scale, near-black ink, three track tints, amber alert.
- `src/ui/style.css` uses only `var()` names. No raw hex colour, `rgb()` or `hsl()` is in it (checked by a test).
- Font: Outfit 400, 600, 700 (Latin subset, `.woff2`), self-hosted in `src/ui/fonts/`. Licence: SIL Open Font License 1.1, committed as `src/ui/fonts/LICENSE-Outfit.txt`. Fetched with `npm pack @fontsource/outfit@5.3.0`. No new npm dependency was added.
- Motion: transitions are 120 ms. `prefers-reduced-motion` turns transitions and animations off.
- Focus: every control has a 3 px outline (`--focus`, near-black), and each selection card shows the ring when its radio has focus.

### Core

`src/core` is unchanged (`git diff -- src/core` is empty). Thresholds are unchanged.

## Requirements

| Requirement | Status |
| --- | --- |
| `src/core` logic unchanged | Done. No diff. |
| All existing tests still pass | Done, with assertion changes listed below. 332 original tests are still in the suite and pass. Total is now 385. |
| Tokens in one file | Done. `src/ui/tokens.css`. |
| Contrast at least 4.5:1 for text | Computed from tokens for 21 text pairs (`src/ui/contrast.test.ts`). Lowest text pair: hint text (`ink-3`) on the page, 5.38:1. Lowest on a card: 5.88:1. Input border on a card: 3.16:1 (needs 3:1). All pass. Computed, not seen on screen. |
| One geometric sans, licence committed | Done. Outfit, OFL 1.1. |
| Wizard, step gating, summary, validation | Done (jsdom tests). Not seen in a browser. |
| Selection cards, arrow keys | Radio groups with shared names (jsdom check). Arrow keys not run in a browser. |
| Suggested size preselected and labelled | Done (jsdom test). |
| Dashboard cards from a sample `project.yml` | Done (jsdom tests, `src/ui/dashboard.test.ts`). |
| No horizontal scroll at 320, 375, 1280 px | CSS rules guarded (`src/ui/layout.test.ts`). Not measured in a browser. |
| Respect reduced motion, transitions 150 ms or less | Done (CSS, guarded by tests). |
| Text stays text, no `innerHTML` | Done. The only match in `src/ui` is a comment (`dom.ts:1`). |
| No runtime network calls | Done. `dist/` has only the two dependency URLs listed in S4 (`scripts/dist-scan.test.ts`). Fonts are local files. |
| Keep ids that tests and README mention | Kept, except the size select (now radio cards). |

### Tests changed (assertion behaviour kept; DOM or helper changed)

- `src/ui/form.test.ts`: the test helpers now choose radio cards for track, risk, unknowns and size. Expected values are unchanged.
- `src/ui/rescope.test.ts`, `src/ui/existing.test.ts`, `src/ui/safety.test.ts`: the new-size choice is a radio card now. Helpers changed; expected values unchanged.
- `src/ui/status.test.ts`: `mountStatus` now takes the project and today, and computes the status itself. The `dd` check became `.dash-name`. The history check became the first item of `ol.activity`.
- `src/ui/review-fixes.test.ts`: the size history is a list, newest first. The test reads the "Items cut" and "Approved by" values from it and checks the same values as before. The header check (a table with five headers) was removed because the table is now a list.
- `src/ui/contrast.test.ts`: colours are read from `tokens.css` by name. The 11 old hex pairs became 21 token pairs, with the same 4.5:1 and 3:1 thresholds. The old check for the disabled button (`#fff` on `#6e6e75`) is replaced by the pair "ink on cut" (11.06:1), which is stronger. New: no raw colour in `style.css`; every token used is defined.

No assertion about behaviour was loosened.

### Tests added

- `src/ui/wizard.test.ts` (17): step gating, Back, focus on the first invalid field, step 3 contents; selection cards give the same values as the old selects; the suggested size is preselected and labelled; summary; radio groups.
- `src/ui/dashboard.test.ts` (12): card order; header pills; size card; deliverables against the S limit and the L minimum; scope card off and on; phases; open items; history; no HTML from project text.
- `src/ui/upload-zone.test.ts` (2): the drop zone contains the real file input; a dropped `project.yml` shows the dashboard.
- `src/ui/layout.test.ts` (+6): one column below 900 px and three columns from 900 px; every duration is 150 ms or less; reduced motion; font and licence present; no remote stylesheet or font.

## Checks run

Node v22.22.3, npm 10.9.8. Commands ran without pipes; exit codes read from each command.

### Fresh clone of `7f0480a` (`/tmp/s5-final`)

| Command | Result |
| --- | --- |
| `git clone --branch arena/7ff7b194-nasaq …` | exit 0. Commit `7f0480a`. |
| `npm ci` | exit 0 |
| `npm test` | exit 0. 26 files, 385 tests passed. |
| `npm run typecheck` | exit 0 |
| `npm run build` | exit 0. `tsc --noEmit`, `vite build` (built in 275 ms), then the postbuild dist scan. |
| `npm run test:dist` | exit 0. 8 tests passed. |

### Local run on the same code (`/home/user/Nasaq`)

| Command | Result |
| --- | --- |
| `npm test` | exit 0. 26 files, 385 tests passed. |
| `npm run typecheck` | exit 0 (after fixing one test-file type error). |
| `npm run build` | exit 0. Dist scan 8/8. |
| `npm run test:dist` | exit 0. 8 tests passed. |
| `grep -rn "innerHTML\|outerHTML\|insertAdjacentHTML" src/ui --include=*.ts \| grep -v "\.test\.ts"` | Only `src/ui/dom.ts:1`, a comment. |
| `grep -rln "https\?://" src/ui --include=*.ts --include=*.css` (excluding tests) | exit 1. No match. |
| `grep -o "https\?://[^\"' )]*" -r dist` | Two hits, the same two dependency strings as in S4 (`rolldown.rs` and `stuk.github.io/jszip`). No other URL. |
| `git diff -- src/core` | Empty. |
| `npm run preview`, then `GET /`, `GET` of the font file, `GET` of the script | HTTP 200 for each (root 391 bytes; `font/woff2`). Preview stopped afterwards. |

Earlier failing runs in this revision, all fixed before the final run: a missing `data-field` on the name field (form broke at start); a regex that only matched hex colours (token test); two dashboard test data mistakes (the sample's deliverables include every phase; a sample phase had one item); a dashboard test that used a 10-day sample against the 7-day S limit (now a 3-day deadline); one type error in `wizard.test.ts` (`hidden` read as `string | boolean`); and a jsdom limit on assigning `input.files` (the drop handler now reads the dropped file directly).

## Visual checks NOT run

There is no browser in this sandbox, and the browser binaries cannot be downloaded from the allowed hosts. So none of these were seen or measured:

- The wizard and dashboard on screen: the look, spacing, colours, and whether the tints and selected states read well.
- Layout at 320, 375 and 1280 px, for both tabs: no horizontal scroll, no overflow. The CSS rules are guarded by tests; no width was measured.
- Keyboard: arrow keys across the selection cards, the visible focus ring on each control, and tab order through the wizard.
- Screen reader behaviour.
- The Outfit font rendering in a browser. The file is served (HTTP 200).
- Drag and drop of `project.yml` onto the drop zone in a real browser. The jsdom test fakes the drop event.
- Clicking Download ZIP and Download rescope ZIP in a browser.
- Contrast on screen. The numbers were computed from the token values.

The owner's headless Chrome run on S4 (recorded in the earlier HANDOFF history) did not cover S5. It must be run again on this build.

## Decisions to check

1. **"Open items … must come first."** Read as: the Open items card is the first card in the grid, and its list puts must items before nice items.
2. **Numbers on cards.** Days left, "since" and the progress counts are derived from `project.yml` dates and the counts of items, with `today` from the local date. The phase count on a track card is from the templates (`phases.yml` via core). The L deliverables card shows the minimum from `thresholds.ts` (16) and has no upper limit.
3. **Size history** is an activity list, newest first, not a table. It sits in a box that scrolls sideways if needed.
4. **Drop zone** accepts a dropped file as well as the file picker. After a good upload it becomes a compact row, so the dashboard comes first. A bad upload leaves the drop zone as it was.
5. **Summary panel** shows "Not named yet", "Not chosen", and "Not set" until the fields have values.
6. **Validation** follows the S4 rule: errors show after a field is touched, or after the first Continue or Download click. Continue reveals only the errors on the current step.
7. **Radio cards** are visually hidden inputs inside labels. A keyboard user reaches them with Tab, then moves between them with arrow keys (native behaviour, not run in a browser).
8. **Font.** Outfit was chosen because it is a geometric sans under the OFL with a `.woff2` subset small enough to commit (about 14 KB each, three weights).

## Open from S4 (still open; owner decisions)

From the S4 Blockers, unchanged by this sprint:

1. Dist-scan allowance for the two dependency URLs. Options: keep the allowlist, patch the dependency output, or limit the rule to the page's own code.
2. The S4 layout re-measure at 320, 375 and 1280 px. Now also needed for S5 (see above).
3. M4.5 ZIPs were made from core code, not by clicking the built page.
4. 1 MB limit is 1,048,576 bytes.
5. Preview host `.e2b.app` in `vite.config.ts` is for the sandbox preview. Remove before any real deployment.
6. Unknown fields in `project.yml` are an error.
7. Validation timing (see Decisions 6).

## Next

- Owner: run the browser checks in README "Known limits" on this build (S5 items first), at 320, 375 and 1280 px.
- Owner: review the PR. Not merged, not deployed.
- Owner: answer the open items above.
