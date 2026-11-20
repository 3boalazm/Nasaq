# {{name}} — test scenarios (size L)

**Planner** defines the cases. **Builder** runs them and records results. A case is never removed to make a run pass.

## 0 Test types

| Type | What it covers |
|---|---|
| Typecheck | Static types, strict mode |
| Unit | Pure logic in the core |
| Integration | Modules working together, data round-trips |
| Build | Production build succeeds |
| Route smoke | Each route loads without error |
| RTL | Layout in right-to-left, if the product is bilingual |
| Reduced motion | Motion respects the reduced-motion setting |
| Keyboard and focus | Every control reachable, focus visible |
| Performance | Main page within the budget in the phase spec |
| Manual check | A person runs the flow and records what was seen |

## 1 Status legend

Planned, In progress, Done, Blocked, Deferred.

## 2 Evidence rule

Every result states one of: the command and its exit code, or the URL, the width, the language and what was seen. A result without evidence is recorded as not run, with the reason.

## 3 Test matrix

| Test type | Tier A (every phase) | Tier B (at release) |
|---|---|---|
| Typecheck | yes | yes |
| Unit and integration | yes | yes |
| Build | yes | yes |
| Route smoke | yes | yes |
| RTL | if bilingual | if bilingual |
| Reduced motion | phase touches motion | yes |
| Keyboard and focus | phase touches UI | yes |
| Performance (main page) | no | yes |
| Manual check | phase touches UI | yes |

## 4 Baseline checks

| ID | Check | Result | Last run |
|---|---|---|---|
| TC-BASE-01 | Typecheck passes | not run | — |
| TC-BASE-02 | All tests pass, none weakened | not run | — |
| TC-BASE-03 | Build passes | not run | — |
| TC-BASE-04 | Route smoke: each route loads | not run | — |
| TC-BASE-05 | RTL check, if bilingual | not run | — |
| TC-BASE-06 | Reduced motion respected | not run | — |
| TC-BASE-07 | Keyboard reachable, focus visible | not run | — |
| TC-BASE-08 | Performance on the main page within budget | not run | — |

## 5 Case format

```
### TC-<n> <title>
- Phase: <id>
- Type: <from section 0>
- Tier: A | B
- Linked: <risk id>, <milestone id>
- Steps: _
- Expected: _
- Result: Planned | Done | Blocked | Deferred
- Evidence: command and exit code, or URL, width, language, what was seen
```

## 6 Results log

| Date | Case | Result | Evidence |
|---|---|---|---|
