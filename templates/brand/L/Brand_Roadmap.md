# {{name}} — brand roadmap (size L)

**Planner** writes this file and advises. **Builder** produces the work and records status. Decisions on name, logo, palette and type belong to the decision owners below.

Status legend: Planned, In progress, Done, Blocked, Deferred.
Evidence tags: VERIFIED, UNVERIFIED, ASSUMPTION, CLIENT-REPORTED.

## 0 Profile

| Field | Value |
|---|---|
| Name | {{name}} |
| Track | {{track}} |
| Size | {{size}} |
| Mode | NEW or RETROFIT (choose one): _ |
| Start | {{startDate}} |
| Deadline | {{deadline}} |
| Approver | {{approver}} |
| Constraints | _to fill_ |

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
| Other decisions | _to set_ | _to set_ | _to set_ |

The Art Director (the owner) signs off brand decisions.

## 3 Master phase registry (NEW)

| Phase | Focus | Status | Core deliverables | Approval gate | Proof to capture |
|---|---|---|---|---|---|
{{phaseRegistry}}

## 4 RETROFIT registry (use only when Mode is RETROFIT)

| Phase | Status | Core deliverables | Approval gate |
|---|---|---|---|
| Inventory and evidence | Planned | Inventory of current assets, with source and licence for each | Your approval |
| Risk audit | Planned | Findings from Brand_Risks.md, scored | Your approval |
| Application test pass | Planned | Each application tested per Application_Tests.md | Your approval |
| Case-study pack | Planned | Before and after, with approvals on file | Your approval |

## 5 Phase spec template

Spec lint (the Planner checks before a phase starts):

- At most 5 milestones.
- Each milestone names its files or deliverables and one observable acceptance check.
- Out of scope is explicit.
- Exactly one approval gate.

Copy this block per phase:

```
### Phase <id>: <name>
- Status: Planned
- Goal: _
- Inputs (with evidence tag): _
- Out of scope: _
- Linked risk ids: _ (BR-BASE-xx or taxonomy id such as LGL-1)
- Linked test ids: _ (AT-BASE-xxx-xx or suite id)
- Milestones:
  - [ ] <id>.1 <files or deliverables> — accept: <one observable check>
- Approval gate (one): _
- Definition of done: all four L files updated; tier A tests run and recorded; proof list and asset register updated; gate approved.
- Rollback: _
```

## 6 Open questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | _to fill_ | _to fill_ | Planned |
| 2 | _to fill_ | _to fill_ | Planned |

## 7 Closing the project

- Every test in Application_Tests.md run with evidence.
- Every finding in Brand_Risks.md is Fixed or Deferred with a dated decision.
- Handoff.md complete, including Approvals, Asset register and Proof list.
- Delivery receipt, and licences delivered to the client.
- Case-study notes only with approval.
