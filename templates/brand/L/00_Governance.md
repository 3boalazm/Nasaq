# {{name}} — 00 Governance (size L)

The governing layer. It runs through every module: who decides, what is in scope, when, and by which rules. **Planner** writes this file and advises. **Builder** produces the work and records status. Decisions on name, logo, palette and type belong to the decision owners below.

Status legend: Planned, In progress, Done, Blocked, Deferred.
Evidence tags: VERIFIED, UNVERIFIED, ASSUMPTION, CLIENT-REPORTED.

## 0 Profile

| Field | Value |
|---|---|
| Name | {{name}} |
| Track | {{track}} |
| Size | {{size}} |
| Why this size | {{sizeRule}} |
| Mode | NEW or RETROFIT (choose one): _ |
| Start | {{startDate}} |
| Deadline | {{deadline}} |
| Approver | {{approver}} |
| Budget, fixed dates, markets, languages | _to fill_ |

### Scope

In scope: the phases in section 3 and the applications chosen in 04_Design_System.md.

Out of scope:

{{outOfScope}}

Scope lint: a size L project names at least three exclusions before the Discovery gate. "None" is not accepted.

## 1 Non-negotiables

| # | Rule |
|---|---|
| 1 | Size and out-of-scope are written before work starts. |
| 2 | One approval gate per phase, recorded (who, when, where). |
| 3 | Every session ends with a handoff note: done, current state, next. |
| 4 | Decisions are logged with the reason. |
| 5 | Claims carry a tag: VERIFIED, CLIENT-REPORTED, UNVERIFIED, ASSUMPTION. |
| 6 | Nothing is sent, published, merged or deployed without your approval. |
| 7 | AR/EN parity in every deliverable. |
| 8 | Licence before use: fonts, imagery and AI assets. |
| 9 | Versioned file names. |
| 10 | Client approval before anything leaves. |

## 2 Roles and decision authority

| Item | Decides | Planner | Builder |
|---|---|---|---|
| Name | Art Director and client | advises | produces options |
| Logo | Art Director and client | advises | produces |
| Palette | Art Director and client | advises | produces |
| Type | Art Director and client | advises | produces |
| Scope, dates, cost | Client decision owner | advises | — |

| Role | Person |
|---|---|
| Art Director (signs off brand decisions) | _name_ |
| Client decision owner (final say; sends the one feedback list) | {{approver}} |
| Other approvers and what each approves | _names_ |
| Feedback rounds per phase / reply window | 2 / 3 working days (change here if agreed otherwise) |

If the Art Director and the client disagree, the client decides and the Art Director's advice is logged in Decisions.
## 3 Modules and phases

| Module | File | Phase it serves | Gate |
|---|---|---|---|
| 01 Project intelligence | 01_Project_Intelligence.md | Discovery | Research brief approved |
| 02 Brand strategy | 02_Brand_Strategy.md | Strategy | Strategy approved |
| 03 Creative development | 03_Creative_Development.md | Identity core | One route chosen and refined |
| 04 Design system | 04_Design_System.md | System, Applications | Guide and applications approved |
| 05 Quality and validation | 05_Quality_Validation.md | Every phase (tier A), release (tier B) | All tests run with evidence |
| 06 Delivery and lifecycle | 06_Delivery_Lifecycle.md | Handover | Delivery receipt signed |

Governing files, used in every phase: this file, 00_AI_Orchestration.md, 00_Risk_Register.md, Handoff.md.

## 4 Master phase registry (NEW)

| Phase | Focus | Status | Core deliverables | Approval gate | Proof to capture |
|---|---|---|---|---|---|
{{phaseRegistry}}

### Timeline and effort

| Phase | Start | Gate date | Effort (days) | Owner | Feedback rounds used |
|---|---|---|---|---|---|
{{phaseTimelineRows}}

Dates must fit between {{startDate}} and {{deadline}}. A slipped gate date is logged in Decisions with the reason.

## 5 RETROFIT registry (use only when Mode is RETROFIT)

| Phase | Status | Core deliverables | Approval gate |
|---|---|---|---|
| Inventory and evidence | Planned | Inventory of current assets, with source and licence for each | Your approval |
| Risk audit | Planned | Findings from 00_Risk_Register.md, scored | Your approval |
| Application test pass | Planned | Each application tested per 05_Quality_Validation.md | Your approval |
| Case-study pack | Planned | Before and after, with approvals on file | Your approval |

## 6 Feedback

1. Rounds per phase: 2 (*default*; the agreed number is in section 2 of this file). A further round is a change request.
2. One consolidated list per round, sent by the client decision owner. Comments that contradict each other go back to that person to settle.
3. Every comment is logged in Handoff.md (Feedback log) with one outcome: accepted, declined with the reason, or change request.
4. Reply window: 3 working days (*default*). A late reply moves the dates by the same number of days, recorded in Decisions.

## 7 Change requests

A change request is any of: a new deliverable or application, a new language or market, reopening an approved gate, or a round beyond the agreed number.

1. Log it in Handoff.md (Change requests) before any work on it.
2. State the effect on dates, effort, cost and items.
3. The approver accepts or declines in writing.
4. If the size changes, run the rescope in Nasaq and keep the RESCOPE_NOTE.md it produces.

## 8 Version control

- Files: `v0.x` is a draft, `v1.0` is approved. Names and folders follow 06_Delivery_Lifecycle.md.
- These project files: Decisions, Approvals and the Session log in Handoff.md are append only. Nothing is deleted; a wrong entry is corrected by a new dated entry.
- A gate that was approved is reopened only by a change request.
