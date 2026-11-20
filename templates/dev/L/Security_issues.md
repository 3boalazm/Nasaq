# {{name}} — security issues register (size L)

**Planner** sets the baseline and the phase gates. **Builder** records findings and fixes. Findings are never deleted: a finding that cannot be fixed becomes Deferred with a dated decision.

## 0 Severity scale

| Severity | Meaning | Before release |
|---|---|---|
| Critical | Secret exposure, data exposure, or write access without login | Must be fixed |
| High | Exploitable with some effort | Must be fixed |
| Medium | Weakens a defence | Fixed, or Deferred with a dated decision |
| Low | Hygiene | Fixed when convenient |

## 1 Status legend

Open, In progress, Fixed, Deferred (needs a dated decision and a reason).

## 2 Master registry per phase

| Phase | Findings open | Baseline checks run | Gate |
|---|---|---|---|
{{phaseNameRows}}

## 3 Baseline checks

| ID | Check | Result | Last run |
|---|---|---|---|
| SEC-BASE-01 | No secrets in the diff and no tracked env files | not run | — |
| SEC-BASE-02 | Headers and routing config unchanged unless listed in the phase spec | not run | — |
| SEC-BASE-03 | No new injection sinks (dynamic HTML, eval, raw SQL built from input) | not run | — |
| SEC-BASE-04 | No new third-party origins (scripts, styles, frames, fonts) | not run | — |
| SEC-BASE-05 | External links use rel="noopener" | not run | — |
| SEC-BASE-06 | Public write paths validate their input | not run | — |
| SEC-BASE-07 | Admin surfaces require login | not run | — |
| SEC-BASE-08 | Dependency audit runs when the lock file changes | not run | — |

## 4 Case format

```
### SEC-<n> <title>
- Severity: Critical | High | Medium | Low
- Status: Open | In progress | Fixed | Deferred
- Phase: <id>
- Evidence: VERIFIED | UNVERIFIED | ASSUMPTION — file and line, or command and exit code
- Finding: _
- Fix, or dated decision if Deferred: _
- Re-check: <test id>
```

## 5 Findings summary

| Severity | Open | Fixed | Deferred |
|---|---|---|---|
| Critical | 0 | 0 | 0 |
| High | 0 | 0 | 0 |
| Medium | 0 | 0 | 0 |
| Low | 0 | 0 | 0 |
