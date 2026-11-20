import { BRAND_L_GOVERNING, ENTRY_FILE, PROJECT_YAML, filePlan } from "./plan";
import { APPROVERS_BANDS, DELIVERABLES_BANDS, DURATION_DAYS_BANDS } from "./thresholds";
import type { Phase, Project, Size } from "./types";

const PLACEHOLDER = /\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g;

/** "A", "A and B", "A, B and C". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join("");
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

/** Table rows for the master phase registry. Header comes from the template. */
function registryRows(phases: Phase[], withProof: boolean): string {
  return phases
    .map((ph) => {
      const cells = [
        ph.name,
        "_set in phase spec_",
        "Planned",
        ph.items.map((it) => it.title).join("; "),
        "Your approval",
      ];
      if (withProof) cells.push("_to capture_");
      return `| ${cells.join(" | ")} |`;
    })
    .join("\n");
}

/** Rows for the per-phase risk and test registries: one row per project phase. */
function phaseNameRows(phases: Phase[]): string {
  return phases.map((ph) => `| ${ph.name} | 0 | not run | pending |`).join("\n");
}

/** Rows for the timeline table: one row per phase, dates and effort left to fill. */
function phaseTimelineRows(phases: Phase[]): string {
  return phases.map((ph) => `| ${ph.name} | _ | _ | _ | _ | 0 |`).join("\n");
}

/** One sentence saying what makes a project this size, built from the thresholds. */
export function sizeRule(size: Size): string {
  const byHand = "The size can also be set by hand.";
  if (size === "L") {
    return `L when any one is true: ${DURATION_DAYS_BANDS.L.min}+ days, ${DELIVERABLES_BANDS.L.min}+ deliverables, ${APPROVERS_BANDS.L.min}+ approvers, hard to undo, or research needed. ${byHand}`;
  }
  const d = DURATION_DAYS_BANDS[size];
  const n = DELIVERABLES_BANDS[size];
  const a = APPROVERS_BANDS[size];
  const approvers = a.min === a.max ? `${a.min}` : `${a.min}–${a.max}`;
  return `${size} when nothing points higher: ${d.min}–${d.max} days, ${n.min}–${n.max} deliverables, ${approvers} approver(s). ${byHand}`;
}

/** One block per phase: approval gate, item table, checks. */
function planBlocks(phases: Phase[]): string {
  return phases
    .map((ph) =>
      [
        `### ${ph.name}`,
        "",
        "Approval gate: _to fill_",
        "",
        "| Item | Priority | Deliverable | Acceptance check |",
        "|---|---|---|---|",
        ...ph.items.map((it) => `| ${it.title} | ${it.priority} | _to fill_ | _to fill_ |`),
        "",
        "Phase checks: _to fill_",
      ].join("\n"),
    )
    .join("\n\n");
}

/** Values available to templates, derived from the project. */
export function buildContext(project: Project): Record<string, string> {
  const first = project.sizeHistory[0];
  const extra = filePlan(project.track, project.size).filter(
    (f) => f !== ENTRY_FILE[project.track] && f !== PROJECT_YAML,
  );
  const modular = project.track === "brand" && project.size === "L";
  return {
    name: project.name,
    track: project.track,
    size: project.size,
    readFirst: joinNames(modular ? [...BRAND_L_GOVERNING] : extra),
    readNote: modular ? " Then open the numbered module for the phase in hand (01 to 06)." : "",
    startDate: project.startDate,
    deadline: project.deadline ?? "not set",
    approver: project.approver ?? "not set",
    outOfScope: project.outOfScope.length
      ? project.outOfScope.map((s) => `- ${s}`).join("\n")
      : "- None",
    phaseChecklist: project.phases
      .map((ph) => {
        const lines = ph.items.map((it) => `- [ ] [${it.priority}] ${it.title}`);
        return [`### ${ph.name}`, ...lines].join("\n");
      })
      .join("\n\n"),
    phaseRegistry: registryRows(project.phases, project.track !== "dev"),
    phasePlan: planBlocks(project.phases),
    phaseNameRows: phaseNameRows(project.phases),
    phaseTimelineRows: phaseTimelineRows(project.phases),
    sizeRule: sizeRule(project.size),
    changeLogRows: project.sizeHistory
      .map(
        (c) =>
          `| ${c.date} | ${c.fromSize ?? "-"} → ${c.toSize} | ${c.reason} | ${c.approvedBy ?? "-"} |`,
      )
      .join("\n"),
    sizeDate: first?.date ?? "not set",
    sizeReason: first?.reason ?? "not set",
  };
}

/**
 * Fills {{key}} placeholders from the project.
 * Throws if the template uses a key the project does not provide.
 */
export function render(template: string, project: Project, extra: Record<string, string> = {}): string {
  const ctx = { ...buildContext(project), ...extra };
  return template.replace(PLACEHOLDER, (_match, key: string) => {
    if (!Object.hasOwn(ctx, key)) {
      throw new Error(`template uses placeholder {{${key}}}, which the project does not have`);
    }
    return ctx[key] as string;
  });
}
