# {{name}} — application tests (size L)

**Planner** defines the suites and the applications in scope. **Builder** runs them and records proof. A test is never removed to make a run pass.

Status legend: Planned, In progress, Done, Blocked, Deferred.
Evidence tags: VERIFIED, CLIENT-REPORTED, UNVERIFIED, ASSUMPTION.

## 0 Test types

| Type | What it means |
|---|---|
| BENCH | Checked at a desk against the spec and the files |
| PROOF | Checked on a printed or physical proof |
| FIELD | Checked on site, at the real viewing distance |
| DIGITAL | Checked on screens, at real sizes and in both directions |
| USER | Checked with real users doing a task |

## 1 Evidence rule

Every result states the proof id or the URL, the size or width, the language, the medium, and what was seen. A result without evidence is recorded as not run, with the reason.

## 2 Applications in scope

| Application | Medium | Type | Language | Proof id |
|---|---|---|---|---|
| _to fill_ | _to fill_ | _to fill_ | AR / EN / both | _to fill_ |

## 3 Test matrix

| Suite | Tier A (every phase) | Tier B (at release) |
|---|---|---|
| LOG logo | yes | yes |
| CLR colour | yes | yes |
| TYP type and bilingual | yes | yes |
| LAY layout | phase touches layout | yes |
| STA stationery | phase touches stationery | yes |
| SIG signage | phase touches signage | yes |
| DIG digital | phase touches digital | yes |
| TPL operability | at system phase | yes |

## 4 Baseline tests

| ID | Check | Type | Result | Last run |
|---|---|---|---|---|
| AT-BASE-LOG-01 | Logo at minimum size and in one colour | PROOF | not run | — |
| AT-BASE-LOG-02 | AR/EN lockup parity | BENCH | not run | — |
| AT-BASE-CLR-01 | Colour per medium matches one physical proof | PROOF | not run | — |
| AT-BASE-CLR-02 | Contrast AA on text colour pairs | BENCH | not run | — |
| AT-BASE-TYP-01 | Each font use covered by its licence | BENCH | not run | — |
| AT-BASE-TYP-02 | Arabic reading check by a native reader | USER | not run | — |
| AT-BASE-LAY-01 | Layout checked at smallest and largest format | PROOF | not run | — |
| AT-BASE-LAY-02 | Numerals and mixed-direction policy applied | BENCH | not run | — |
| AT-BASE-STA-01 | Stationery set printed and checked | PROOF | not run | — |
| AT-BASE-STA-02 | Master file set complete and versioned | BENCH | not run | — |
| AT-BASE-SIG-01 | Legible at viewing distance | FIELD | not run | — |
| AT-BASE-SIG-02 | Scale checked on site | FIELD | not run | — |
| AT-BASE-DIG-01 | Digital sizes and screen contrast | DIGITAL | not run | — |
| AT-BASE-DIG-02 | Asset licences recorded, files named per standard | BENCH | not run | — |
| AT-BASE-TPL-01 | Template operated by a non-designer | USER | not run | — |
| AT-BASE-TPL-02 | Handover complete, one source of truth for tokens | BENCH | not run | — |

## 5 Case format

```
### <SUITE>-<n> <title>
- Application: <id from section 2>
- Type: BENCH | PROOF | FIELD | DIGITAL | USER
- Tier: A | B
- Linked: <risk id>, <milestone id>
- Steps: _
- Expected: _
- Result: Planned | Done | Blocked | Deferred
- Evidence: proof id, or URL; size or width; language; what was seen
```

## 6 Results log

| Date | Case | Result | Proof id |
|---|---|---|---|
