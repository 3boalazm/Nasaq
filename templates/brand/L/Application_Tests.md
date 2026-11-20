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

Chosen from the catalogue in Brand_Playbook.md section 5, before Identity core starts. The Planner may not start that phase while this table is empty.

| ID | Application | Group | Size or format | Viewing distance or screen width | Language | Type | Proof id |
|---|---|---|---|---|---|---|---|
| APP-01 | _to fill_ | _to fill_ | _to fill_ | _to fill_ | AR / EN / both | _to fill_ | _to fill_ |

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

| ID | Check | Type | Pass when | Result | Last run |
|---|---|---|---|---|---|
| AT-BASE-LOG-01 | Logo at minimum size and in one colour | PROOF | Every part readable at the stated minimum size, printed at 100% | not run | — |
| AT-BASE-LOG-02 | AR/EN lockup parity | BENCH | Same visual weight and height side by side; neither reads as secondary | not run | — |
| AT-BASE-CLR-01 | Colour per medium matches one physical proof | PROOF | Matches the signed proof under the same light, or within the ΔE agreed with the printer | not run | — |
| AT-BASE-CLR-02 | Contrast AA on text colour pairs | BENCH | 4.5:1 for body text, 3:1 for large text, every pair listed | not run | — |
| AT-BASE-TYP-01 | Each font use covered by its licence | BENCH | Licence text names every use in scope (print, web, app, video) | not run | — |
| AT-BASE-TYP-02 | Arabic reading check by a native reader | USER | Smallest text read aloud without error at normal distance | not run | — |
| AT-BASE-LAY-01 | Layout checked at smallest and largest format | PROOF | Grid, clear space and minimum sizes hold on both | not run | — |
| AT-BASE-LAY-02 | Numerals and mixed-direction policy applied | BENCH | No broken order in mixed AR/EN lines in any sample | not run | — |
| AT-BASE-STA-01 | Stationery set printed and checked | PROOF | Printed on the final stock; trim, colour and small text checked | not run | — |
| AT-BASE-STA-02 | Master file set complete and versioned | BENCH | Every row of Playbook 6.1 present, named per 6.3 | not run | — |
| AT-BASE-SIG-01 | Legible at viewing distance | FIELD | Read at the distance in section 2. Rule of thumb to confirm on site: 25 mm letter height per 3 m | not run | — |
| AT-BASE-SIG-02 | Scale checked on site | FIELD | Full-size print or photo mock-up seen in place | not run | — |
| AT-BASE-DIG-01 | Digital sizes and screen contrast | DIGITAL | Clear at 16 px favicon and avatar size; checked at 320 and 1280 px, RTL and LTR | not run | — |
| AT-BASE-DIG-02 | Asset licences recorded, files named per standard | BENCH | Asset register has no empty licence cell | not run | — |
| AT-BASE-TPL-01 | Template operated by a non-designer | USER | Three set tasks done without help and without breaking a rule | not run | — |
| AT-BASE-TPL-02 | Handover complete, one source of truth for tokens | BENCH | Guide, files and templates show the same values | not run | — |

## 5 Case format

```
### <SUITE>-<n> <title>
- Application: <id from section 2>
- Type: BENCH | PROOF | FIELD | DIGITAL | USER
- Tier: A | B
- Linked: <risk id>, <milestone id>
- Steps: _
- Pass when (a measurable or observable threshold): _
- Result: Planned | Done | Blocked | Deferred
- Evidence: proof id, or URL; size or width; language; what was seen
```

## 6 Results log

| Date | Case | Result | Proof id |
|---|---|---|---|
