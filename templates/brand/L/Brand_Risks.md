# {{name}} — brand risks register (size L)

**Planner** sets the baseline and gates. **Builder** records findings. Findings are never deleted. A finding that cannot be fixed becomes Deferred with a dated decision.

Screening only: name and logo screening is not legal clearance. Counsel confirms.

## 0 Severity scale

| Severity | Meaning | Before delivery |
|---|---|---|
| Critical | Legal or IP exposure, or a mark that cannot be used | Must be fixed |
| High | Likely to fail in use (legibility, reproduction, language) | Must be fixed |
| Medium | Weakens the system; visible in some uses | Fixed, or Deferred with a dated decision |
| Low | Polish or consistency | Fixed when convenient |

Project risks (things that may happen) are scored: probability 1–3 × impact 1–3. Score 6–9: act now and tell the approver. 3–4: plan the mitigation. 1–2: watch.

## 1 Status legend

Open, In progress, Fixed, Deferred (needs a dated decision and a reason).

## 2 Risk taxonomy

| Code | Category |
|---|---|
| LGL | Legal and IP |
| LNG | Language and script |
| CUL | Cultural and sector |
| ACC | Legibility |
| REP | Reproduction |
| DIG | Digital and files |
| CON | Consistency |
| DST | Distinctiveness |
| SCL | Scalability |
| DLV | Delivery |

## 3 Master registry per phase

| Phase | Findings open | Baseline checks run | Gate |
|---|---|---|---|
{{phaseNameRows}}

## 4 Baseline checks

| ID | Check | Result | Last run |
|---|---|---|---|
| BR-BASE-01 | Font licences cover every use | not run | — |
| BR-BASE-02 | Imagery and AI asset licences recorded | not run | — |
| BR-BASE-03 | Name and logo screening recorded (screening only; counsel confirms) | not run | — |
| BR-BASE-04 | Arabic reading check by a native reader | not run | — |
| BR-BASE-05 | AR/EN lockup parity | not run | — |
| BR-BASE-06 | Numerals and mixed-direction policy applied | not run | — |
| BR-BASE-07 | Contrast AA on all text colour pairs | not run | — |
| BR-BASE-08 | Logo reproduces at minimum size and in one colour | not run | — |
| BR-BASE-09 | Colour checked per medium against one physical proof | not run | — |
| BR-BASE-10 | Master file set complete and versioned | not run | — |
| BR-BASE-11 | One source of truth for tokens | not run | — |
| BR-BASE-12 | Handover complete (files, licences, guide, usage session) | not run | — |

## 5 Project risk register

Starting list. Score each one at the start, review at every gate, add your own.

| ID | Risk | P | I | Score | Owner | Mitigation | Next review |
|---|---|---|---|---|---|---|---|
| PR-01 | Feedback arrives late or from several voices | _ | _ | _ | _ | One decision owner; reply window (Playbook 0.1) | _ |
| PR-02 | Scope grows without a change request | _ | _ | _ | _ | Change requests (Playbook 0.2) | _ |
| PR-03 | Name or mark conflicts with an existing one | _ | _ | _ | _ | Screening in Discovery; counsel before the Identity gate | _ |
| PR-04 | Approvers disagree on a route | _ | _ | _ | _ | Route scoring (Playbook 3.2); strategy approved first | _ |
| PR-05 | Font or imagery licence does not cover a use | _ | _ | _ | _ | Licence before use; BR-BASE-01 and 02 | _ |
| PR-06 | Printed colour does not match | _ | _ | _ | _ | One physical proof per medium, early | _ |
| PR-07 | AI-made asset with unclear ownership reaches a master file | _ | _ | _ | _ | AI rules (Playbook 0.3); AI log | _ |
| PR-08 | Deadline moves closer | _ | _ | _ | _ | Rescope in Nasaq; cut nice items first | _ |

## 6 Case format

```
### <CODE>-<n> <title>
- Severity: Critical | High | Medium | Low
- Status: Open | In progress | Fixed | Deferred
- Phase: <id>
- Evidence: VERIFIED | CLIENT-REPORTED | UNVERIFIED | ASSUMPTION — source, proof id, or test id
- Owner: _
- Finding: _
- Fix or mitigation, or dated decision if Deferred: _
- If it still happens: _
- Re-check: <test id>
```

## 7 Findings summary

| Category | Open | Fixed | Deferred |
|---|---|---|---|
| LGL | 0 | 0 | 0 |
| LNG | 0 | 0 | 0 |
| CUL | 0 | 0 | 0 |
| ACC | 0 | 0 | 0 |
| REP | 0 | 0 | 0 |
| DIG | 0 | 0 | 0 |
| CON | 0 | 0 | 0 |
| DST | 0 | 0 | 0 |
| SCL | 0 | 0 | 0 |
| DLV | 0 | 0 | 0 |
