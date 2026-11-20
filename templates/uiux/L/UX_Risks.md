# {{name}} — UX risks register (size L)

**Planner** sets the baseline and gates. **Builder** records findings. Findings are never deleted. A finding that cannot be fixed becomes Deferred with a dated decision.

## 0 Severity scale

| Severity | Meaning | Before release |
|---|---|---|
| Critical | A user cannot complete a core task | Must be fixed |
| High | A user is likely to fail or be excluded | Must be fixed |
| Medium | Friction or inconsistency in a flow | Fixed, or Deferred with a dated decision |
| Low | Polish | Fixed when convenient |

## 1 Status legend

Open, In progress, Fixed, Deferred (needs a dated decision and a reason).

## 2 Categories

Accessibility · RTL and bilingual · Responsive · Content · Consistency with tokens · Handoff completeness.

## 3 Master registry per phase

| Phase | Findings open | Baseline checks run | Gate |
|---|---|---|---|
{{phaseNameRows}}

## 4 Baseline checks

| ID | Category | Check | Result | Last run |
|---|---|---|---|---|
| UXR-BASE-01 | Accessibility | Text contrast AA (4.5:1) | not run | — |
| UXR-BASE-02 | Accessibility | Keyboard reachable, focus visible | not run | — |
| UXR-BASE-03 | Responsive | Works at 375 px and 1280 px | not run | — |
| UXR-BASE-04 | RTL and bilingual | Arabic/RTL parity when bilingual | not run | — |
| UXR-BASE-05 | Content | Empty, loading and error states on every screen | not run | — |
| UXR-BASE-06 | Content | Copy fits in Arabic and in English | not run | — |
| UXR-BASE-07 | Consistency with tokens | Components use tokens only | not run | — |
| UXR-BASE-08 | Handoff completeness | Specs, token file, states and assets delivered | not run | — |

## 5 Case format

```
### UXR-<n> <title>
- Category: <from section 2>
- Severity: Critical | High | Medium | Low
- Status: Open | In progress | Fixed | Deferred
- Phase: <id>
- Evidence: URL, width, language, what was seen
- Finding: _
- Fix, or dated decision if Deferred: _
- Re-check: <test id>
```

## 6 Findings summary

| Category | Open | Fixed | Deferred |
|---|---|---|---|
| Accessibility | 0 | 0 | 0 |
| RTL and bilingual | 0 | 0 | 0 |
| Responsive | 0 | 0 | 0 |
| Content | 0 | 0 | 0 |
| Consistency with tokens | 0 | 0 | 0 |
| Handoff completeness | 0 | 0 | 0 |
