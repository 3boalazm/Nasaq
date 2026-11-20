# {{name}} — implementation roadmap (size L)

**Planner** writes this file. **Builder** records status. Change a phase spec only through the Planner; the Builder treats specs as read-only.

Status legend: Planned, In progress, Done, Blocked, Deferred.
Evidence tags: VERIFIED (command and exit code, or URL), UNVERIFIED, ASSUMPTION.

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
| 7 | No secrets in code, no tracked env files. |
| 8 | No production database change without approval. |
| 9 | Never weaken a test to pass. |
| 10 | The model that reviews is not the model that built. |

## 2 Master phase registry

| Phase | Focus | Status | Core deliverables | Approval gate |
|---|---|---|---|---|
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
- Inputs: _
- Out of scope: _
- Linked risk ids: _ (SEC-BASE-xx or SEC-n)
- Linked test ids: _ (TC-BASE-xx or TC-n)
- Milestones:
  - [ ] <id>.1 <files or deliverables> — accept: <one observable check>
- Approval gate (one): _
- Definition of done: Implementation, Security_issues, Test_scenarios and Handoff updated; tier A checks run and recorded; gate approved.
- Rollback: _
```

## 4 Open questions

| # | Question | Owner | Status |
|---|---|---|---|
| 1 | _to fill_ | _to fill_ | Planned |

## 5 Closing the project

- All tier B checks in Test_scenarios.md run with evidence.
- Every finding in Security_issues.md is Fixed or Deferred with a dated decision.
- Handoff.md is complete.
- Release approval recorded (who, when, where).
- Delivery receipt written.
- Case-study notes only with approval.
