# {{name}} — UX roadmap (size L)

**Planner** writes this file. **Builder** records status. Change a phase spec only through the Planner.

Status legend: Planned, In progress, Done, Blocked, Deferred.
Evidence tags: VERIFIED (command and exit code, or URL, width, language, what was seen), UNVERIFIED, ASSUMPTION.

## 0 Profile

| Field | Value |
|---|---|
| Name | {{name}} |
| Track | {{track}} |
| Size | {{size}} |
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
| 5 | Claims carry a tag: VERIFIED, UNVERIFIED, ASSUMPTION. |
| 6 | Nothing is sent, published, merged or deployed without your approval. |
| 7 | Text contrast AA (4.5:1). |
| 8 | Works at 375 px and 1280 px. |
| 9 | Arabic/RTL parity when the product is bilingual. |
| 10 | Keyboard reachable with visible focus. |
| 11 | Every screen has empty, loading and error states. |

## 2 Master phase registry

| Phase | Focus | Status | Core deliverables | Approval gate | Proof to capture |
|---|---|---|---|---|---|
{{phaseRegistry}}

## 3 Phase spec template

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
- Linked risk ids: _ (UXR-BASE-xx)
- Linked test ids: _ (UXT-BASE-xx or case id)
- Milestones:
  - [ ] <id>.1 <files or deliverables> — accept: <one observable check>
- Approval gate (one): _
- Definition of done: UX_Roadmap, UX_Risks, UX_Tests and Handoff updated; tests run and recorded; gate approved.
- Rollback: _
```

## 4 Open questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | _to fill_ | _to fill_ | Planned |

## 5 Closing the project

- All tier B tests in UX_Tests.md run with evidence.
- Every finding in UX_Risks.md is Fixed or Deferred with a dated decision.
- Handoff.md complete: specs, token file, component docs, edge cases.
- Release approval recorded (who, when, where).
