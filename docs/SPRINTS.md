# Project Flow System — sprints for Arena (2026-11-20)

Five sprints, S0 to S4. Give Arena **one sprint per session**: paste the Preamble, then that sprint's block. Attach `Project_Flow_System_Research_and_Spec_2026-11-20.md` (called "the spec" below) to every session. Review the result before starting the next sprint.

---

## Preamble (paste at the top of every session)

```
You are building "Nasaq", a small web page that sets up and maintains a project folder
for three kinds of work: brand identity, UI/UX, and development. The attached spec is the source of truth
(sections 3 to 6 and 8). Do only the sprint below. Do not start the next one.

Product shape
- A static single-page web app. No backend, no accounts, no database, no analytics, no network calls at runtime.
- Input: a short form. Output: a ZIP of Markdown files plus one project.yml, built in the browser.
- Generated files are in English. The page UI is in English in v1.

Stack
- Vite + TypeScript (strict). No UI framework. Plain CSS.
- Dependencies allowed: jszip, yaml. Dev: vitest, typescript, vite. Ask before adding any other.
- Logic lives in src/core/ as pure functions with no DOM access. UI lives in src/ui/.
- Templates are Markdown files under templates/{track}/{size}/ with {{placeholders}}. No project text in code.

Rules
1. Read HANDOFF.md first (from S1 on). Follow the sprint's "Out of scope" list strictly.
2. Every milestone has an acceptance check. Run it and report the real result. If you could not run
   something, say "not run" and why. Never write "should work".
3. Never weaken or delete a test to make it pass.
4. No client names, no real project data in templates. Placeholders only.
5. Work on the session branch Arena gives you. Open a pull request. Do not merge and do not deploy.
6. If the spec is unclear or wrong, stop that milestone and list the question under "Blockers" in HANDOFF.md.
7. End of session: update HANDOFF.md (Done, Current state, Checks run with results, Blockers, Next), then stop.
```

---

## S0 — Scaffold and core engine (no UI)

**Goal:** a tested core that turns answers into a size and a file plan.

**Out of scope:** any page design, templates' real content, ZIP output, rescope.

**Files**
```
package.json, tsconfig.json, vite.config.ts, index.html   # [New] minimal shell
src/core/types.ts        # [New] Track, Size, Project, Phase, Item, ChangeRecord
src/core/size.ts         # [New] suggestSize(answers)
src/core/plan.ts         # [New] filePlan(track, size)
src/core/projectYaml.ts  # [New] toYaml(project), fromYaml(text) with validation
src/core/*.test.ts       # [New]
AGENTS.md, HANDOFF.md, README.md   # [New]
```

**Milestones**
- [ ] **M0.1** Project scaffold builds. accept: `npm run build` and `npm run typecheck` exit 0.
- [ ] **M0.2** `types.ts`: `Track = brand | uiux | dev`, `Size = S | M | L`. `Project` holds name, track, size, sizeHistory, deadline, approver, outOfScope, phases (each with items marked `must` or `nice` and a status). accept: typecheck passes.
- [ ] **M0.3** `suggestSize(answers)` implements the spec §4 table: five answers (duration, deliverables, approvers, risk, unknowns); the result is the highest size matched by any answer; it also returns which answers decided it. accept: tests cover all-S, all-L, and one test per column where that single column lifts the size.
- [ ] **M0.4** `filePlan(track, size)` returns the list of files to generate: S → `PROJECT.md`; M → `PROJECT.md`, `PLAN.md`; L → the four files for that track (dev: `Implementation.md`, `Security_issues.md`, `Test_scenarios.md`, `Handoff.md`; brand: `Brand_Roadmap.md`, `Brand_Risks.md`, `Application_Tests.md`, `Handoff.md`; uiux: `UX_Roadmap.md`, `UX_Risks.md`, `UX_Tests.md`, `Handoff.md`). Every plan also includes `project.yml` and the entry file (`AGENTS.md` for dev, `README.md` for brand and uiux). accept: a test asserts all 9 combinations.
- [ ] **M0.5** `toYaml` / `fromYaml` round-trip. `fromYaml` rejects an unknown track or size and a missing name with a clear message. accept: round-trip test and three rejection tests pass.

**Done when:** `npm test`, `npm run typecheck`, `npm run build` all exit 0, and HANDOFF.md lists each with its result.

---

## S1 — Size S templates and the ZIP generator

**Goal:** fill the form, download a working ZIP for any track at size S.

**Out of scope:** M and L templates, rescope, status view, styling beyond readable defaults.

**Files**
```
templates/{brand,uiux,dev}/S/PROJECT.md   # [New]
templates/_shared/entry.md                # [New] AGENTS.md / README.md body
src/core/render.ts      # [New] render(template, project): fills {{placeholders}}
src/core/zip.ts         # [New] buildZip(project): Blob
src/ui/form.ts, src/ui/main.ts, src/ui/style.css   # [New]
```

**Milestones**
- [ ] **M1.1** `render` replaces every `{{key}}` and throws if a template uses a key the project does not have. accept: tests for a filled template and for an unknown key.
- [ ] **M1.2** Three S templates. Each `PROJECT.md` has, in this order: Brief (goal, audience, deadline, approver), Out of scope, Phases with a checklist (items marked must or nice) taken from the S column of spec §5 for that track, Baseline checklist (the "Fixed at any size" line of that track), Decisions (table with a Why column), Feedback log (item, source, in scope or change request), Handoff (Done, Current state, Next). accept: a test renders all three with a sample project and finds no leftover `{{`.
- [ ] **M1.3** The entry file states the six always-on rules from spec §3 and the start prompt: "Read PROJECT.md fully. Do one phase. Update Handoff. Stop." accept: rendered in all three ZIPs.
- [ ] **M1.4** Form: name, track, the five size questions, deadline, approver, out-of-scope (one per line). It shows the suggested size with the deciding answers and lets the user override. Choosing M or L shows "templates arrive in S2" and disables download. accept: manual check written in HANDOFF.md.
- [ ] **M1.5** Download produces `{project-slug}.zip` containing exactly the files from `filePlan`. accept: a test unzips the Blob and compares file names with `filePlan` for the three S cases.

**Done when:** tests, typecheck and build pass, and you downloaded one ZIP per track and opened the files.

---

## S2 — Size M and L templates

**Goal:** all 9 track × size folders generate.

**Attach to this session:** project docs 26 (code templates) and 27 (brand templates). They are the base for the L templates.

**Out of scope:** rescope, status view, new form fields.

**Files**
```
templates/{brand,uiux,dev}/M/{PROJECT.md,PLAN.md}   # [New]
templates/dev/L/*      # [New] from doc 26, with every Aboalazm OS specific replaced by a placeholder or removed
templates/brand/L/*    # [New] from doc 27 (already generic)
templates/uiux/L/*     # [New] same four-file shape, content from spec §5.2 column L
src/ui/form.ts         # [Modified] enable M and L
```

**Milestones**
- [ ] **M2.1** M templates. `PROJECT.md` as in S plus a pointer to the plan. `PLAN.md`: phases from the M column of spec §5, each with deliverables, one acceptance check, one approval gate, and must or nice per item; then per-phase checks. accept: render test for 3 tracks, no leftover `{{`.
- [ ] **M2.2** `dev/L` from doc 26. Remove all repo-specific content (paths, commit ids, routes, invariants I1 to I10, the S1 worked example, gotchas). Keep the structure, status legend, evidence tags, spec lint, sprint template, case formats, rules of engagement, baseline tables as empty-but-headed sections. accept: `grep -ril "aboalazm\|payload\|neon\|redesign-v2" templates/dev/L` prints nothing.
- [ ] **M2.3** `brand/L` from doc 27, both modes kept (NEW and RETROFIT). accept: render test passes.
- [ ] **M2.4** `uiux/L`: `UX_Roadmap.md` (phases Discover, Define, Design, Validate, Handoff), `UX_Risks.md` (categories: accessibility, RTL and bilingual, responsive, content, consistency with tokens, handoff completeness), `UX_Tests.md` (usability task cases, contrast, keyboard, 375 and 1280 widths, RTL), `Handoff.md`. accept: render test passes.
- [ ] **M2.5** Guard test: for all 9 combinations the ZIP file list equals `filePlan`, and no generated file contains `{{` or the words "TODO" or "lorem". accept: test passes.

**Done when:** tests, typecheck and build pass, and the form downloads all 9.

---

## S3 — Rescope, status and scope alert

**Goal:** change a project's size mid-way with a logged record, and see where a project stands.

**Out of scope:** editing phases in the browser, storing projects in the browser, merging the user's edited Markdown.

**How it works (no storage):** the user uploads their current `project.yml`. The page reads it, shows status, and can output a new ZIP.

**Files**
```
src/core/rescope.ts     # [New] rescope(project, newSize, reason, approvedBy, date)
src/core/status.ts      # [New] status(project), scopeAlert(project)
src/ui/rescope.ts, src/ui/status.ts   # [New]
templates/_shared/RESCOPE_NOTE.md     # [New]
```

**Milestones**
- [ ] **M3.1** `rescope` returns a new project with the size changed and one entry appended to `sizeHistory`: date, from, to, reason, items cut, items added, approved by. It refuses a change to the same size and an empty reason. accept: tests for L→M, M→S, S→M, M→L, and the two refusals.
- [ ] **M3.2** The rescope ZIP contains: the updated `project.yml`; `RESCOPE_NOTE.md` with the change record and the exact file instructions from spec §6 for that direction (going down: which files to freeze with the banner text and what to carry over; going up: which files are new and the "do not back-fill, write a one-paragraph baseline" rule); and **only the files that are new** at the new size. It never includes a file the user already has. accept: a test checks the file list for each of the four directions.
- [ ] **M3.3** Must/nice step: before confirming a move down, the page lists open items from `project.yml` and the user marks which nice items are cut. Cut items are written to the change record and set to status `cut`. accept: test on a sample project.
- [ ] **M3.4** `status` shows size, size history, current phase, open must items, open nice items, deadline and days left. accept: test with a fixed "today" date.
- [ ] **M3.5** `scopeAlert`: for an S project, warn when it has more than 5 deliverables or its deadline is more than 7 days after its start; for an M project, more than 15 deliverables or more than 28 days. The alert suggests the next size and never changes it by itself. accept: boundary tests (5 and 6, 15 and 16).

**Done when:** tests, typecheck and build pass, and a manual run of generate → upload → rescope down → upload → rescope up is described in HANDOFF.md.

---

## S4 — Hardening and release candidate

**Goal:** a page that is safe to use on real client work.

**Out of scope:** new features, Arabic UI, integrations.

**Milestones**
- [ ] **M4.1** Input safety: project name becomes a safe slug for file names; a malformed or oversized (over 1 MB) `project.yml` shows a clear error and never crashes; user text is inserted as text, never as HTML. accept: tests for a name with `../`, slashes and Arabic letters; a broken YAML test; a search of `src/ui` for `innerHTML` returns nothing or each use is justified in HANDOFF.md.
- [ ] **M4.2** No runtime network: no fonts, scripts or requests from other origins. accept: the built `dist/` contains no `http://` or `https://` URLs other than in comments or license text; verified by a grep recorded in HANDOFF.md.
- [ ] **M4.3** Accessibility and layout: every input has a label, keyboard order follows the form, visible focus, text contrast at least 4.5:1, usable at 375 px width. accept: manual checklist with results in HANDOFF.md.
- [ ] **M4.4** Template editing guide in README: how to change a template, the placeholder list, how to change the size thresholds (one constants file). accept: thresholds live in one file and tests read from it.
- [ ] **M4.5** Release check: fresh clone, `npm ci`, `npm test`, `npm run typecheck`, `npm run build`; generate all 9 ZIPs from the built page. accept: each command and its result listed in HANDOFF.md. Leave the pull request open for the owner. Do not deploy.

**Done when:** the owner can review one pull request with all checks listed and their results.

---

## Review checklist for Mustafa (after each sprint)

1. Does HANDOFF.md list every check with a real result, and are any marked "not run"?
2. Open the generated files yourself: are they short enough to use on a small project?
3. Did the sprint touch anything on its "Out of scope" list?
4. S2 only: read `templates/dev/L` once for leftovers from the OS repo.
5. Have a different model review S3 and S4 before merging (rescope logic and input safety).
