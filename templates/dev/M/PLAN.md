# {{name}} — development plan (size {{size}})

Phases come from spec section 5 (M column). Each phase has one approval gate. Every item is marked must or nice, and has one acceptance check. Nice items are cut first when the size changes (spec section 6).

## Plan rules

- One approval gate per phase, recorded (who, when, where).
- One acceptance check per item. An item without one is not planned.
- Out of scope is written in PROJECT.md before this plan is approved.

## Phases

{{phasePlan}}

## Checks for every phase

- Typecheck, existing tests, build, manual check.
- No secrets in the diff, no tracked env files.
- Never weaken a test. The model that reviews is not the model that built.
- Evidence tag on every claim (VERIFIED, UNVERIFIED, ASSUMPTION).

## Handoff

See PROJECT.md. Update its Handoff section at the end of each session.
