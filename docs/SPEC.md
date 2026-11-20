# Project Flow System — research and build spec (2026-11-20)

For Mustafa. Written to be handed to Arena as the build brief. It extends the 4-files workflow (project docs 25–27) and uses the Atlas pilot result (doc 29).

Tags: `[SOURCE]` taken from a linked source · `[OURS]` from our own project docs · `[PROPOSED]` my proposal, change freely.

## 1. Verdict

1. **Do not build the method from scratch, and do not adopt a whole framework either.** The parts you asked for already exist separately. Borrow five ideas and keep our files.
2. **One flow, three tracks, three sizes.** The stages are the same for Brand, UI/UX and Dev. The track changes the content of each stage. The size changes how much is written down.
3. **Size is a setting that can change mid-project,** with one logged procedure (§6).
4. **The software should start as a generator, not a platform:** it asks 6 questions, creates the right files, and handles a size change. Everything stays plain Markdown so any AI tool can read it.

## 2. What already exists (prior art)

| Existing thing | What it already solves | Use it? |
|---|---|---|
| **BMAD Method v6** | Three planning tracks by project size (Quick Flow: tech-spec only; BMad Method: PRD + architecture; Enterprise: plus security, DevOps, test). A "scope alert" when a small track gets a big request. BMad Builder lets you create custom modules for other domains. `[SOURCE]` | Borrow the three-track idea and the scope alert. Do not install it: it is the heaviest option and reviewers call it overkill for a solo developer shipping small features. `[SOURCE]` |
| **OpenSpec** | A light, per-change folder for an existing system: proposal, tasks, spec delta. `[SOURCE]` | Borrow the "one folder per change" shape for size M work on existing repos (ERP, NPF, OS). |
| **GitHub Spec Kit** | spec → plan → tasks per feature, for new builds. `[SOURCE]` | Same idea as our Implementation file. Nothing new to take. |
| **Shape Up (Basecamp)** | Fixed time, variable scope. "Appetite" instead of estimates. "Scope hammering": separate must-haves from nice-to-haves to finish inside the time box. `[SOURCE]` | This is the rescoping rule (§6). |
| **AGENTS.md** | One Markdown entry file that most coding agents read (open standard under the Linux Foundation). `[SOURCE]` | Use it as the single entry file in every project, since you switch between many tools. |
| **Our 4 files (docs 26–27)** | Roadmap, risks, tests, handoff, in a code edition and a brand edition. `[OURS]` | This becomes size L. |

**Gap:** in this search I found nothing that covers branding, UI/UX and development in one size-aware system. BMAD is software-first; its Builder could host brand and UX modules, but I did not test that, and it installs into Claude Code, Codex or Cursor, not into a chat tool like Arena.

**Evidence that size should decide the paperwork**
- A 2026 benchmark (50 Python tickets, five workflows) found no merge-rate advantage for specs on small tickets (1–2 files), and a 30-point advantage on large ones (6+ files). Spec writing took about a third of the tokens. One team, one model, Python only. `[SOURCE]`
- Our own Atlas pilot (doc 29): fresh sessions recovered the project state equally well with and without the extra protocol files (7.0 vs 7.5 out of 10, n = 2 per arm). `[OURS]`

Both point the same way: small work needs a brief and a handoff, not four files.

## 3. The common flow (all tracks)

| Stage | Output | Gate |
|---|---|---|
| **0. Intake** | Track, size, deadline, approver, out-of-scope list | You confirm the size |
| **1. Research** | Findings with sources, tagged verified or assumed | You accept the findings |
| **2. Setup** | Brief, constraints, tools and roles, folder created | Client or you sign the brief |
| **3. Phasing** | Phases, each with deliverables, one acceptance check and one gate. Every item marked **must** or **nice** | You approve the plan |
| **4. Execution** | Per phase: build → check → feedback → log | One approval per phase |
| **5. Close** | Delivery, final handoff, case-study notes | Delivery receipt |

**Always-on rules, any size** `[PROPOSED]`
1. Size and out-of-scope are written before work starts.
2. One approval gate per phase, recorded (who, when, where).
3. Every session ends with a handoff note: done, current state, next.
4. Decisions are logged with the reason.
5. Claims carry a tag: verified, client-reported, unverified, assumption.
6. Nothing is sent, published, merged or deployed without your approval.

**Feedback points:** after research, after the first direction or prototype, at each phase gate, and before delivery. Client feedback goes into one log, each item marked in scope or change request.

## 4. Sizes

Pick the highest row that matches any column. `[PROPOSED]` thresholds.

| | **S** small | **M** medium | **L** large |
|---|---|---|---|
| Duration | up to 1 week | 1–4 weeks | over 4 weeks |
| Deliverables | 1–5 | 6–15 | over 15 |
| Approvers | 1 approver | 2 approvers | 3 or more |
| Risk | easy to undo | some rework if wrong | hard to undo: production database, print run, legal, launch date |
| Unknowns | none | a few | research needed before planning |

| What is required | S | M | L |
|---|---|---|---|
| Files | `PROJECT.md` only (brief, checklist, log, handoff) | `PROJECT.md` + `PLAN.md` | The 4 files (doc 26 or 27) |
| Research | 30–60 minutes, 3–5 references | Short findings page | Full findings with sources |
| Phases | 1–2 | 3–4 | 5 or more |
| Checks | Short baseline checklist | Baseline + per-phase checks | Baseline + risk register + test cases |
| Review | You | You, plus a second model on risky parts | Independent review on risky parts, required |
| Docs at close | Handoff note | Handoff + decisions | Handoff + decisions + case-study pack |

`AGENTS.md` (or a short README for non-code projects) is the entry file at every size and points to the files above.

## 5. The three tracks

### 5.1 Brand identity
Order from the sources: discovery, then strategy, then identity design, then guidelines and rollout; design follows strategy. `[SOURCE]` Matches doc 27 (S1–S5). `[OURS]`

| Phase | S | M | L |
|---|---|---|---|
| Discovery | Questionnaire + 5 peers | + stakeholder call, peer audit | + workshop, name and trademark screen |
| Strategy | One positioning line, 3 attributes | One-page strategy | Full strategy, voice, architecture |
| Identity core | 1 direction: logo AR/EN, colour, type | 2 routes, then refine one | 2–3 routes, full lockup set |
| System | 1-page usage sheet | Tokens, grid, 10–20 page guide | Full brand book, sub-brand rules, stretch test |
| Applications | 2–3 mock-ups | 3–6 real applications, tested on screen | All touchpoints, print proofs, field tests |
| Handover | Files + sheet | Files, templates, guide | Files, templates, licences, usage session |

Fixed at any size: AR/EN parity, licence before use, versioned file names, client approval before anything leaves.

### 5.2 UI/UX
Base model: Double Diamond (discover, define, develop, deliver), which pairs diverging and converging in two rounds. `[SOURCE]`

| Phase | S (one page or flow) | M (a product area) | L (full product) |
|---|---|---|---|
| Discover | Goal, audience, 3–5 references | Competitor review, audit of the current UI, analytics if available | User interviews, audit, analytics, content inventory |
| Define | One problem statement, one flow | Flows, sitemap, requirements list | IA, journeys, prioritised requirements, success metrics |
| Design | Straight to hi-fi | Wireframes → UI → small component kit and tokens | Wireframes → UI → design system (tokens, components, states, RTL) |
| Validate | Self-check: contrast, mobile, RTL | One round of usability testing on a prototype | Testing rounds, accessibility audit |
| Handoff | Annotated screens | Specs, tokens, states, assets | Specs, token file, component docs, edge cases |

Fixed at any size: text contrast AA (4.5:1), works at 375 px and 1280 px, Arabic/RTL parity when the product is bilingual, keyboard reachable with visible focus, every screen has empty, loading and error states.

AI builders (Lovable, Bolt, Replit, Rocket) fit the Design and Validate phases as fast clickable prototypes. Treat their code as a prototype unless it passes the Dev track checks.

### 5.3 Development (front and back)
Base model: spec → plan → tasks → implement → verify. `[SOURCE]`

| Phase | S (fix or small feature) | M (feature set) | L (new system or major release) |
|---|---|---|---|
| Spec | Tech-spec: goal, files, acceptance check | PRD-lite + data model + API list | PRD, architecture, data model, API contract, non-functional needs |
| Setup | Branch | Branch, preview deploy, env list | + CI, staging, secrets handling, migration plan, rollback plan |
| Build | 1 session | Phases of up to 5 milestones, one per session | Sprints as in doc 26 |
| Verify | Typecheck, existing tests, manual check | + new tests, security baseline, preview check | + test cases per sprint, security register, performance and accessibility |
| Release | Your approval, merge | Your approval, merge, smoke test | Release candidate, your approval, monitored release |

Fixed at any size: no secrets in code, no production database change without approval, never weaken a test to pass, the model that reviews is not the model that built.

## 6. Changing size mid-project

Rule borrowed from Shape Up: when time is fixed, scope is what moves. `[SOURCE]`

**Triggers:** the client changes the brief · the deadline moves · more than half the time is used with less than half the must-haves done `[PROPOSED]` · a new unknown appears.

**Procedure (15 minutes)**
1. Stop at the end of the current session.
2. List what is left. Mark each item must or nice.
3. Choose the new size from the §4 table.
4. Write one change record: date, old size → new size, reason, what was cut or added, who approved.
5. Adjust the files as below, then rewrite NEXT in the handoff.

| Change | What happens to the files |
|---|---|
| **L → M** | Keep handoff, decisions and plan. Freeze the risk and test files (banner: "frozen on {date}") and carry only their open items into the baseline checklist. |
| **M → S** | Fold the open part of `PLAN.md` into the `PROJECT.md` checklist. |
| **S → M, M → L** | Add the missing files from now on. Do not back-fill history; write a one-paragraph baseline. |
| **Never dropped** | Approvals, decision log, out-of-scope list, handoff. |

Tell the client in writing when a size change cuts something they expected.

## 7. Roles for AI tools (tool-agnostic)

| Role | Does | Typical tool |
|---|---|---|
| Researcher | Finds and cites | A search-first assistant (Perplexity or a deep-research mode) |
| Planner (Elephant) | Writes the brief, phases and checks | Your strongest reasoning model |
| Builder (Goldfish) | Does one phase per session | Arena for code; Lovable, Bolt, Replit or Rocket for prototypes; your design tools for brand |
| Reviewer | Checks evidence against the acceptance checks | A different model from the builder |
| You | Decide, approve, talk to the client | — |

Because the files are plain Markdown and each session starts from the handoff, you can change tools between sessions.

## 8. Build brief for Arena `[PROPOSED]`

**Goal:** a small tool that sets up and maintains the project folder. No accounts, no database, no dashboard in v1.

**v1 functions**
1. `init`: asks track (brand, uiux, dev), the five size questions from §4, deadline, approver, out-of-scope. Suggests a size; the user can override.
2. Generates the folder for that track and size from templates (docs 26–27 are the L templates; S and M are cut-down versions).
3. `rescope`: asks the new size and reason, applies the §6 table, appends the change record.
4. `status`: prints size, current phase, open must-haves, last handoff date.
5. Scope alert: warns when an S project passes its limits (more than 5 deliverables or more than 1 week).

**Data:** one `project.yml` (track, size, size history, deadline, approver, phases with must/nice items and status). Markdown files for everything a model reads.

**Shape:** a command-line script or a single-page web app that outputs a zip. Templates live in a `templates/{track}/{size}/` folder so they can be edited without touching code.

**Done when:** all 9 track × size folders generate; a rescope in each direction leaves a valid folder and a change record; no template contains a client fact.

**Not in v1:** integrations, multi-user, automation of sessions, analytics.

## 9. Open decisions

1. Are the §4 thresholds right for your real projects? Test them against GAD (brand), Aboalazm OS redesign (UI/UX + dev) and NPF storefront (dev).
2. Command-line script or small web page for v1?
3. Mixed projects (brand + website): one project with two tracks, or two linked projects? I suggest two linked projects in v1.

## Sources

- BMAD scale-adaptive tracks: https://www.mintlify.com/bmad-code-org/BMAD-METHOD/concepts/scale-adaptive-planning · modules: https://docs.bmad-method.org/reference/modules/
- Framework comparison (files, costs, drawbacks): https://developertoolkit.ai/en/ecosystem/frameworks/spec-driven-frameworks/
- Spec-driven benchmark 2026: https://uvik.net/?p=7598
- Shape Up glossary: https://basecamp.com/shapeup/4.5-appendix-06 · summary: https://resources.rework.com/libraries/project-management/shape-up-method
- AGENTS.md: https://addyosmani.com/agents/15-agents-md/
- Branding stages: https://www.phable.io/what-is-the-branding-process-from-start-to-finish · https://www.logodesignlove.com/brand-identity
- Double Diamond: https://maze.co/blog/double-diamond-design-process/
- Ours: project docs 25, 26, 27, 29
