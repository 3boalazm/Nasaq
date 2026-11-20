import { createProject, suggestFromIntake, todayIso, validateAnswers, type IntakeAnswers } from "../core/intake";
import { zipFileName } from "../core/files";
import { buildZip } from "../core/zip";
import type { AnswerKey } from "../core/size";
import type { Size } from "../core/types";

export type SaveFn = (blob: Blob, filename: string) => void;

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

/** Downloads a Blob through a temporary link. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}

function field(id: string, labelText: string, control: HTMLElement, hint?: string): HTMLElement {
  const label = el("label", { htmlFor: id }, [labelText]);
  const children: Array<Node | string> = [label, control];
  if (hint) children.push(el("small", { className: "hint" }, [hint]));
  return el("div", { className: "field" }, children);
}

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

  const errorsEl = el("ul", { className: "errors", id: "f-errors" });
  const suggestionEl = el("p", { id: "f-suggestion", className: "suggestion", role: "status" });
  const durationEl = el("p", { id: "f-duration", className: "hint" });
  const deadlineHintEl = el("p", { id: "f-deadline-hint", className: "hint" });
  const sizeMsgEl = el("p", { id: "f-size-msg", className: "warning" });
  const sizeSelect = el(
    "select",
    { id: "f-size" },
    SIZE_OPTIONS.map((s) => el("option", { value: s, textContent: s })),
  );
  const downloadBtn = el("button", { id: "f-download", type: "button", textContent: "Download ZIP", disabled: true });

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
      sizeMsgEl,
    ]),
    errorsEl,
    el("div", { className: "actions" }, [downloadBtn]),
  ]);

  root.replaceChildren(
    el("h1", { textContent: "Nasaq" }),
    el("p", { className: "lead", textContent: "Set up a project folder for brand, UI/UX or development work." }),
    form,
  );

  const showErrors = (messages: string[]): void => {
    errorsEl.replaceChildren(...messages.map((m) => el("li", { textContent: m })));
  };

  const refresh = (): void => {
    const a = readAnswers(form);
    const errors = validateAnswers(a);
    showErrors(errors);
    // Both dates are YYYY-MM-DD, so string comparison is date comparison.
    deadlineHintEl.textContent =
      a.startDate && a.deadline && a.deadline < a.startDate
        ? "The deadline is before the start date. Duration counts as 1 day."
        : "";

    if (errors.length > 0) {
      suggestionEl.textContent = "Fill in the fields above to see a suggested size.";
      durationEl.textContent = "";
      sizeMsgEl.textContent = "";
      downloadBtn.disabled = true;
      return;
    }

    const s = suggestFromIntake(a);
    suggestionEl.textContent = `Suggested size: ${s.size}. Decided by: ${s.decidedBy
      .map((k) => ANSWER_LABELS[k])
      .join(", ")}.`;
    durationEl.textContent = `Duration: ${s.duration} day${s.duration === 1 ? "" : "s"}, counting start and deadline.`;
    if (!sizeOverridden) sizeSelect.value = s.size;

    const size = sizeSelect.value as Size;
    sizeMsgEl.textContent =
      size === "S" ? "" : `Templates for size ${size} arrive in S2. Download is disabled for this size.`;
    downloadBtn.disabled = size !== "S";
  };

  form.addEventListener("input", refresh);
  form.addEventListener("change", refresh);
  sizeSelect.addEventListener("change", () => {
    sizeOverridden = true;
    refresh();
  });

  downloadBtn.addEventListener("click", async () => {
    const a = readAnswers(form);
    if (validateAnswers(a).length > 0 || sizeSelect.value !== "S") return;
    try {
      const project = createProject(a, "S");
      const blob = await buildZip(project);
      save(blob, zipFileName(project));
    } catch (err) {
      showErrors([(err as Error).message]);
    }
  });

  refresh();
  return form;
}
