# {{name}} — UX tests (size L)

**Planner** defines the tasks and cases. **Builder** runs them and records evidence. A case is never removed to make a run pass.

Status legend: Planned, In progress, Done, Blocked, Deferred.

## 0 Test types

| Type | What it covers |
|---|---|
| Usability task | A user completes a task; success and time recorded |
| Contrast | Text and control colours against AA |
| Keyboard | Every control reachable, focus visible |
| Responsive | Layout at 375 px and 1280 px |
| RTL | Layout and reading order in Arabic |
| States | Empty, loading and error states present |
| Content fit | Copy fits in Arabic and in English |
| Handoff review | Specs, tokens, states and assets complete |

## 1 Evidence rule

Every result states the URL or prototype link, the width, the language, and what was seen. A result without evidence is recorded as not run, with the reason.

## 2 Test matrix

| Test type | Tier A (every phase) | Tier B (at release) |
|---|---|---|
| Usability task | at Validate | yes |
| Contrast | yes | yes |
| Keyboard | phase touches UI | yes |
| Responsive (375 and 1280) | phase touches UI | yes |
| RTL | if bilingual | if bilingual |
| States | phase touches UI | yes |
| Content fit (AR and EN) | phase touches copy | yes |
| Handoff review | at Handoff | yes |

## 3 Baseline tests

| ID | Check | Result | Last run |
|---|---|---|---|
| UXT-BASE-01 | Usability task success on the core tasks | not run | — |
| UXT-BASE-02 | Contrast AA on all text and control colours | not run | — |
| UXT-BASE-03 | Keyboard path complete, focus visible | not run | — |
| UXT-BASE-04 | Layout at 375 px | not run | — |
| UXT-BASE-05 | Layout at 1280 px | not run | — |
| UXT-BASE-06 | RTL layout and reading order | not run | — |
| UXT-BASE-07 | Empty, loading and error states on every screen | not run | — |
| UXT-BASE-08 | Content fits in Arabic and English; handoff complete | not run | — |

## 4 Usability task case format

```
### UXT-TASK-<n> <title>
- Task: _ (what the user is asked to do, in their words)
- Participants: _ (count and profile)
- Success criterion: _
- Result: Planned | Done | Blocked | Deferred
- Success rate and time: _
- Evidence: link to recording or notes, width, language, what was seen
```

## 5 Results log

| Date | Case | Result | Evidence |
|---|---|---|---|
