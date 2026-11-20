# Nasaq

Nasaq is a small static web app that sets up and maintains a project folder for three kinds of work: brand identity, UI/UX, and development. Input is a short form; output is a ZIP of Markdown files plus one `project.yml`, built in the browser.

No backend, no accounts, no database, no analytics, no network calls at runtime.

## Use it

1. `npm ci`
2. `npm run build`
3. `npm run preview`, then open the address it prints (usually `http://localhost:4173/`).

`npm run build` also runs the dist check (`postbuild`): it fails if the built page contains any `http://` or `https://` text outside license comments.

### Language

The page is in English or Arabic (العربية). Use the two-option pill in the header to switch; the page does not reload.

- First visit: `?lang=ar` or `?lang=en` in the address wins. Without it, a stored choice is used, then the browser language (Arabic if it starts with `ar`), then English.
- The choice is remembered in the browser's `localStorage` under the key `nasaq-lang`. Nothing else is stored.
- Arabic sets the page to right-to-left (`dir="rtl"`). Numbers, dates, file names and code stay left-to-right inside Arabic text.
- Generated files (Markdown, `project.yml`, `RESCOPE_NOTE.md`) are always in English, because AI tools read them.
- The strings are in `src/ui/i18n/en.ts` and `src/ui/i18n/ar.ts`. Both files must have the same keys; `src/ui/i18n/strings.test.ts` checks this.

## Stack

- Vite + TypeScript (strict), plain CSS, no UI framework
- Runtime dependencies: `yaml`, `jszip`
- Dev: `typescript`, `vite`, `vitest`, `jsdom`
- Core logic in `src/core/` (pure functions, no DOM); UI in `src/ui/`
- Size limits only in `src/core/thresholds.ts`
- Templates (Markdown with `{{placeholders}}`) under `templates/`

## Commands

```sh
npm ci
npm run dev          # local dev server
npm run typecheck    # tsc --noEmit
npm test             # unit tests (src/)
npm run build        # typecheck, vite build, then the dist URL check
npm run test:dist    # the dist URL check on its own (needs dist/ from a build)
npm run preview      # serve dist/ locally
```

## Editing templates

Every generated file comes from a Markdown template in `templates/{track}/{size}/`. No project text is written in code.

| What you want to change | Where |
| --- | --- |
| Text of a size S or M file | `templates/{track}/{size}/PROJECT.md` or `PLAN.md` |
| Text of an L file | `templates/{track}/L/` (four files per track) |
| The entry file (`AGENTS.md` for dev, `README.md` for brand and UI/UX) | `templates/_shared/entry.md` |
| Phases and items for a track and size | `templates/{track}/{size}/phases.yml` (phase `name` and `items` list) |
| The rescope note and the per-move instructions | `templates/_shared/RESCOPE_NOTE.md`, `templates/_shared/rescope/*.md` |

Steps:

1. Edit the Markdown or `phases.yml`. Do not add real client names or project data; use placeholders.
2. Run `npm test`. The tests render every track and size and fail on a leftover `{{`, a `TODO`, or the word "lorem".
3. Run `npm run build`.

To add a new file to a size: add the template under `templates/{track}/{size}/`, add its name to `filePlan` in `src/core/plan.ts`, then run `npm test`. A file that is in `filePlan` but has no template fails the tests.

### Placeholders

A placeholder is `{{name}}`. Using a name the project does not provide makes the build of that file throw, so a typo shows up in the tests, not in a user's ZIP.

Available in project files:

| Placeholder | Value |
| --- | --- |
| `name` | Project name (as entered; it is text only, never a file name) |
| `track` | `brand`, `uiux` or `dev` |
| `size` | `S`, `M` or `L` |
| `readFirst` | The other files the entry file tells the reader to read |
| `startDate`, `deadline` | Dates (`YYYY-MM-DD`); `deadline` is `not set` when empty |
| `approver` | Approver name, or `not set` |
| `outOfScope` | Out-of-scope list as Markdown bullets, or `- None` |
| `phaseChecklist`, `phaseRegistry`, `phasePlan`, `phaseNameRows` | Generated phase tables and lists |
| `changeLogRows` | Rows of the size history table |
| `sizeDate`, `sizeReason` | Date and reason of the first size decision |

Available in `RESCOPE_NOTE.md` and the rescope instruction files, in addition to the above:

| Placeholder | Value |
| --- | --- |
| `changeDate`, `fromSize`, `toSize`, `direction` | The change record and whether the move goes up or down |
| `reason`, `approvedBy` | Reason for the change and who approved it |
| `itemsCut`, `itemsAdded` | Items cut or added in this change (`none` if empty) |
| `fileList` | The files in the ZIP and what to do with each |
| `roadmapFile`, `riskFile`, `testFile` | The names of the track's L files by role |
| `cutNotice`, `instructions` | Generated text for the cut and the move |

## Changing the size thresholds

All limits are in one file: `src/core/thresholds.ts`.

- `DURATION_DAYS_BANDS`: days from start to deadline, counting both days (S 1 to 7, M 8 to 28, L 29 and up).
- `DELIVERABLES_BANDS`: number of deliverables (S 1 to 5, M 6 to 15, L 16 and up).
- `APPROVERS_BANDS`: number of approvers (S 1, M 2, L 3 and up).
- `RISK_SIZES`, `UNKNOWNS_SIZES`: the size each answer gives.
- `MAX_PROJECT_YAML_BYTES`: the largest `project.yml` the page reads (1 MB).

Change a number there, then run `npm test`. The tests read these values from the file, and `thresholds.test.ts` fails if the S, M and L bands leave a gap or overlap. Do not copy a limit into another file.

## Look and feel

- Colours, radii and shadows are defined only in `src/ui/tokens.css`. `src/ui/style.css` uses those names and no raw colour values. `src/ui/contrast.test.ts` checks the text pairs against 4.5:1.
- The Latin font is Outfit, a geometric sans, self-hosted in `src/ui/fonts/` (SIL Open Font License 1.1; the licence is in `src/ui/fonts/LICENSE-Outfit.txt`). The Arabic font is IBM Plex Sans Arabic, self-hosted in the same folder (SIL Open Font License 1.1; `src/ui/fonts/LICENSE-IBMPlexSansArabic.txt`), weights 400, 600 and 700. Arabic comes first in the font stack. Nothing is loaded from another host.
- `src/ui/style.css` uses logical properties (`inline-start`, `inline-end`), not left and right. `src/ui/rtl.test.ts` fails if a physical left or right property comes back.
- The New project form is a three-step wizard. The Existing project page is a dashboard built from the uploaded `project.yml`.

## Known limits

Browser checks that have not been run. There is no browser in the build sandbox, so none of these were done.

- S6 Arabic on screen: the right-to-left layout, the mirrored progress bars, steppers and phase bars, and how the Arabic font looks. Nothing in Arabic has been seen in a browser.
- S6 mixed text: how Latin dates, file names and code sit inside Arabic sentences. The bidi isolates are in place and the strings are tested, but the rendering has not been seen.
- S6 arrow keys on the Arabic selection cards: Left and Right follow the screen. The logic is covered by `src/ui/rtl-arrows.test.ts` (jsdom), not by a real keypress in a browser.
- S6 the language pill on narrow screens, and the header at 320, 375 and 1280 px.
- S6 the Arabic copy has not been reviewed by a native speaker. It was written for the product tone the brief asks for, and it needs a read-through before a wider release.
- S6 the `?lang=` switch, the stored choice and `navigator.language` in a real browser. These are tested with jsdom, which fakes the address bar and storage.
- S5 visual checks: the new wizard and dashboard on screen. Not seen in any browser, so the look, the colours, and the spacing are unchecked.
- S5 layout at 320, 375 and 1280 px, for both tabs, measured in a browser (no horizontal scroll). The CSS rules are guarded by tests, but no width was measured.
- S5 keyboard: the visible focus ring on each control. Native radio behaviour is assumed, not seen.
- S5 drag and drop of `project.yml` onto the drop zone in a real browser. The drop path has a jsdom test (`src/ui/upload-zone.test.ts`), which fakes the drop event.
- S5 the Outfit font rendering in a browser. The font file is served (HTTP 200 from `vite preview`), but how it looks was not seen.
- Opening the page in a browser and switching between the New project and Existing project tabs.
- Choosing a real `project.yml` with the file picker. The upload path is covered by jsdom tests, not by a real picker.
- How the must-cut warning, the required "Approved by" field, and the status card look on screen.
- Clicking "Download ZIP" and "Download rescope ZIP" in a browser and opening the files. ZIP contents are covered by tests.
- Keyboard use of the tabs and the form, with a visible focus ring, in a real browser. Focus order and labels are covered by jsdom tests.
- Screen reader behaviour. Not tested.
- Running the built page itself (`dist/`) in a browser. The ZIPs for all nine track and size combinations were generated by the same core code the page calls, not by clicking the built page.

Other limits:

- The dist check allows two URL strings that bundled dependencies keep in code (error hints). They are listed in `scripts/dist-scan.test.ts`. See `HANDOFF.md`.
- The generated files (Markdown, `project.yml`, `RESCOPE_NOTE.md`) are English in both languages, by design.
- Core error messages are shown in the page language by error code. The English parser detail that used to follow "project.yml is not valid YAML" is no longer shown in the page; the message itself is.
- No storage: a project is only in the `project.yml` the user keeps. The only browser storage is the language choice.

## Docs

- `docs/SPEC.md`: product spec. `docs/SPRINTS.md`: sprint plan (S0 to S4).
- `HANDOFF.md`: current sprint state, checks with results, and open questions.
