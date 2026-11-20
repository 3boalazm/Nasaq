# {{name}} — 00 AI orchestration (size L)

Part of the governing layer. It says how AI agents work on this project and how a person checks them. Two agent roles: **Planner** (plans, writes specs, never produces artwork) and **Builder** (produces, tests, records). A person is always the **Approver**.

## 1 Start prompts

**Builder**

```
Read 00_Governance.md, 00_AI_Orchestration.md, 00_Risk_Register.md and Handoff.md, then the module file for this phase (section 2). Do one phase only. The spec is read-only. Run the tests in 05_Quality_Validation.md and record proof for each result. Overwrite Current state and NEXT. Stop.
```

**Planner**

```
Read the governing files and the module for the phase you were asked about. Write or revise the phase spec from the module's required outputs and run the spec lint. Do not produce artwork. Ask the approver for the gate. Append to Decisions and Open questions. Stop.
```

## 2 What to load per phase

| Phase | Module file | Also open |
|---|---|---|
| Discovery | 01_Project_Intelligence.md | — |
| Strategy | 02_Brand_Strategy.md | 01 (insights) |
| Identity core | 03_Creative_Development.md | 02 (positioning, personality) |
| System | 04_Design_System.md | 03 (components) |
| Applications | 04_Design_System.md | 05 (tests) |
| Handover | 06_Delivery_Lifecycle.md | 05 (results) |

Do not load modules for later phases: their content is not approved yet.

## 3 AI rules

1. AI output is a draft. A named person reviews it before it reaches the client or a master file.
2. Every AI-made image or text kept in the project is logged in the AI log below: tool, version, date, purpose, reviewer.
3. No confidential client material goes into a tool the client has not approved.
4. Final marks are drawn as vectors by the designer. An AI image is never master artwork: ownership and registration of AI-made marks are uncertain, and counsel confirms.
5. AI imagery in a deliverable: the tool's licence terms go in the Asset register (06_Delivery_Lifecycle.md), and the client is told where it is used.
6. A research claim from an AI tool is UNVERIFIED until checked against a dated source.
7. An AI agent never approves a gate.
8. Rules of engagement: one phase per session; review before the next phase; the spec is read-only for the Builder; a check is never weakened; every claim carries a tag.

## 4 Phase spec template

Spec lint (the Planner checks before a phase starts):

- At most 5 milestones.
- Each milestone names its files or deliverables and one observable acceptance check.
- Out of scope is explicit.
- Exactly one approval gate.
- Every required output in the phase's module file is a milestone or is listed as cut, with the reason.

Copy this block per phase:

```
### Phase <id>: <name>
- Status: Planned
- Goal: _
- Inputs (with evidence tag): _
- Out of scope: _
- Linked risk ids: _ (BR-BASE-xx or taxonomy id such as LGL-1)
- Linked test ids: _ (AT-BASE-xxx-xx or suite id)
- Milestones:
  - [ ] <id>.1 <files or deliverables> — accept: <one observable check>
- Approval gate (one): _
- Definition of done: module acceptance checks passed with evidence; the governing files updated; tier A tests run and recorded; proof list and asset register updated; gate approved.
- Rollback: _
```

## 5 AI log

| Date | Tool and version | Used for | Reviewed by | Kept in (file) |
|---|---|---|---|---|
