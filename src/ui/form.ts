import {
  createProject,
  fieldErrors,
  INTAKE_FIELDS,
  suggestFromIntake,
  todayIso,
  type IntakeAnswers,
  type IntakeField,
} from "../core/intake";
import { zipFileName } from "../core/files";
import { buildZip } from "../core/zip";
import type { AnswerKey } from "../core/size";
import type { Size } from "../core/types";
import { el, field, saveBlob, type SaveFn } from "./dom";

const ANSWER_LABELS: Record<AnswerKey, string> = {
  duration: "Duration",
  deliverables: "Deliverables",
  approvers: "Approvers",
  risk: "Risk",
  unknowns: "Unknowns",
};

const TRACK_OPTIONS: ReadonlyArray<readonly [string, string]> = [
  ["brand", "Brand identity"],
  ["uiux", "UI/UX"],
  ["dev", "Development"],
];
const RISK_OPTIONS: ReadonlyArray<readonly [string, string]> = [
  ["easy_undo", "Easy to undo"],
  ["some_rework", "Some rework if wrong"],
  ["hard_undo", "Hard to undo (production database, print run, legal, launch date)"],
];
const UNKNOWNS_OPTIONS: ReadonlyArray<readonly [string, string]> = [
  ["none", "None"],
  ["few", "A few"],
  ["research_needed", "Research needed before planning"],
];
const SIZE_OPTIONS: readonly Size[] = ["S", "M", "L"];

/** The form control for each intake field. */
const CONTROL_ID: Record<IntakeField, string> = {
  name: "f-name",
  track: "f-track",
  startDate: "f-start",
  deadline: "f-deadline",
  deliverables: "f-deliverables",
  approvers: "f-approvers",
  risk: "f-risk",
  unknowns: "f-unknowns",
};

function input(id: string, type: string, extra: Partial<HTMLInputElement> = {}): HTMLInputElement {
  return el("input", { id, type, ...extra });
}

function select(id: string, options: ReadonlyArray<readonly [string, string]>, placeholder: string): HTMLSelectElement {
  const opts = [
    el("option", { value: "", textContent: placeholder }),
    ...options.map(([v, t]) => el("option", { value: v, textContent: t })),
  ];
  return el("select", { id }, opts);
}

/** Reads the form fields into answers. Numbers are NaN when the field is empty. */
export function readAnswers(root: ParentNode): IntakeAnswers {
  const get = <T extends HTMLElement>(id: string): T => {
    const node = root.querySelector<T>(`#${id}`);
    if (!node) throw new Error(`missing form field #${id}`);
    return node;
  };
  const num = (id: string): number => {
    const raw = get<HTMLInputElement>(id).value.trim();
    return raw === "" ? NaN : Number(raw);
  };
  return {
    name: get<HTMLInputElement>("f-name").value,
    track: get<HTMLSelectElement>("f-track").value,
    startDate: get<HTMLInputElement>("f-start").value,
    deadline: get<HTMLInputElement>("f-deadline").value,
    approver: get<HTMLInputElement>("f-approver").value,
    outOfScopeText: get<HTMLTextAreaElement>("f-outofscope").value,
    deliverables: num("f-deliverables"),
    approvers: num("f-approvers"),
    risk: get<HTMLSelectElement>("f-risk").value,
    unknowns: get<HTMLSelectElement>("f-unknowns").value,
  };
}

/** Builds the intake page inside `root`. Returns the form element. */
export function mountIntakeForm(root: HTMLElement, save: SaveFn = saveBlob): HTMLFormElement {
  let sizeOverridden = false;
  /** Fields the user has left (blur or change) since the page loaded. */
  const touched = new Set<IntakeField>();
  /** Set after the first Download click: every field's error is shown from then on. */
  let revealAll = false;

  // Errors for a field are shown only once it was touched or Download was clicked.
  const errorsEl = el("ul", { className: "errors", id: "f-errors", role: "alert" });
  const suggestionEl = el("p", { id: "f-suggestion", className: "suggestion", role: "status" });
  const durationEl = el("p", { id: "f-duration", className: "hint" });
  const deadlineHintEl = el("p", { id: "f-deadline-hint", className: "hint" });
  const sizeSelect = el(
    "select",
    { id: "f-size" },
    SIZE_OPTIONS.map((s) => el("option", { value: s, textContent: s })),
  );
  const downloadBtn = el("button", { id: "f-download", type: "button", textContent: "Download ZIP" });

  const form = el("form", { id: "intake", noValidate: true, className: "intake" }, [
    field("f-name", "Project name", input("f-name", "text", { required: true })),
    field("f-track", "Track", select("f-track", TRACK_OPTIONS, "Choose a track")),
    field("f-start", "Start date", input("f-start", "date", { value: todayIso(), required: true })),
    field(
      "f-deadline",
      "Deadline",
      input("f-deadline", "date", { required: true }),
      "Duration is counted from start to deadline, both days included.",
    ),
    field("f-deliverables", "Deliverables (count)", input("f-deliverables", "number", { min: "1", step: "1" })),
    field("f-approvers", "Approvers (people who approve)", input("f-approvers", "number", { min: "1", step: "1", value: "1" })),
    field("f-risk", "Risk if wrong", select("f-risk", RISK_OPTIONS, "Choose a level")),
    field("f-unknowns", "Unknowns", select("f-unknowns", UNKNOWNS_OPTIONS, "Choose a level")),
    field("f-approver", "Approver name (optional)", input("f-approver", "text")),
    field("f-outofscope", "Out of scope (one item per line)", el("textarea", { id: "f-outofscope", rows: 4 })),
    el("section", { className: "result" }, [
      suggestionEl,
      durationEl,
      deadlineHintEl,
      field("f-size", "Size (override if needed)", sizeSelect),
    ]),
    errorsEl,
    el("div", { className: "actions" }, [downloadBtn]),
  ]);

  root.replaceChildren(form);

  // One error line per field, placed under its control and hidden until it should show.
  const errorLines = new Map<IntakeField, HTMLElement>();
  for (const key of INTAKE_FIELDS) {
    const control = form.querySelector<HTMLElement>(`#${CONTROL_ID[key]}`);
    const box = control?.closest(".field");
    if (!control || !box) throw new Error(`form field ${key} is missing`);
    const line = el("p", { className: "field-error", id: `err-${CONTROL_ID[key]}`, hidden: true });
    box.append(line);
    control.setAttribute("aria-describedby", line.id);
    errorLines.set(key, line);
  }

  const showErrors = (messages: string[]): void => {
    errorsEl.replaceChildren(...messages.map((m) => el("li", { textContent: m })));
  };

  /** Shows the error of each field that is touched (or all, after a Download click). */
  const showFieldErrors = (errors: Partial<Record<IntakeField, string>>): void => {
    for (const key of INTAKE_FIELDS) {
      const message = (revealAll || touched.has(key)) && errors[key] ? errors[key] : "";
      const line = errorLines.get(key)!;
      line.textContent = message;
      line.hidden = message === "";
      const control = form.querySelector<HTMLElement>(`#${CONTROL_ID[key]}`)!;
      control.setAttribute("aria-invalid", message === "" ? "false" : "true");
    }
  };

  const refresh = (): void => {
    const a = readAnswers(form);
    const errors = fieldErrors(a);
    showFieldErrors(errors);
    // Both dates are YYYY-MM-DD, so string comparison is date comparison.
    deadlineHintEl.textContent =
      a.startDate && a.deadline && a.deadline < a.startDate
        ? "The deadline is before the start date. Duration counts as 1 day."
        : "";

    if (Object.keys(errors).length > 0) {
      suggestionEl.textContent = "Fill in the fields above to see a suggested size.";
      durationEl.textContent = "";
      return;
    }

    const s = suggestFromIntake(a);
    suggestionEl.textContent = `Suggested size: ${s.size}. Decided by: ${s.decidedBy
      .map((k) => ANSWER_LABELS[k])
      .join(", ")}.`;
    durationEl.textContent = `Duration: ${s.duration} day${s.duration === 1 ? "" : "s"}, counting start and deadline.`;
    if (!sizeOverridden) sizeSelect.value = s.size;
  };

  /** Marks the field the event came from as touched, then refreshes. */
  const touch = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const key = INTAKE_FIELDS.find((k) => CONTROL_ID[k] === target?.id);
    if (key) touched.add(key);
    refresh();
  };

  form.addEventListener("input", refresh);
  form.addEventListener("change", touch);
  form.addEventListener("focusout", touch);
  sizeSelect.addEventListener("change", () => {
    sizeOverridden = true;
    refresh();
  });

  downloadBtn.addEventListener("click", async () => {
    const a = readAnswers(form);
    const errors = fieldErrors(a);
    const first = INTAKE_FIELDS.find((k) => errors[k]);
    if (first) {
      // Reveal every error, then put the cursor in the first invalid field.
      revealAll = true;
      refresh();
      form.querySelector<HTMLElement>(`#${CONTROL_ID[first]}`)?.focus();
      return;
    }
    try {
      const project = createProject(a, sizeSelect.value as Size);
      const blob = await buildZip(project);
      save(blob, zipFileName(project));
    } catch (err) {
      showErrors([(err as Error).message]);
    }
  });

  refresh();
  return form;
}
