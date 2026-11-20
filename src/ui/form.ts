import {
  createProject,
  fieldErrors,
  INTAKE_FIELDS,
  suggestFromIntake,
  todayIso,
  type IntakeAnswers,
  type IntakeField,
} from "../core/intake";
import { isRealIsoDate } from "../core/projectYaml";
import { zipFileName } from "../core/files";
import { filePlan } from "../core/plan";
import { phaseDefs } from "../core/templates";
import { buildZip } from "../core/zip";
import type { AnswerKey, SizeSuggestion } from "../core/size";
import { TRACKS, type Size, type Track } from "../core/types";
import { el, field, saveBlob, type SaveFn, choice, checkedValue, setChecked } from "./dom";
import { SIZE_NAMES, TRACK_LABELS } from "./labels";

const ANSWER_LABELS: Record<AnswerKey, string> = {
  duration: "Duration",
  deliverables: "Deliverables",
  approvers: "Approvers",
  risk: "Risk",
  unknowns: "Unknowns",
};

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
const SIZE_LIST: readonly Size[] = ["S", "M", "L"];

/** The three wizard steps, with the intake fields each step asks for. Step 3 has none of its own. */
const STEPS: ReadonlyArray<{ title: string; fields: readonly IntakeField[] }> = [
  { title: "What kind of project?", fields: ["name", "track"] },
  { title: "How big is it?", fields: ["startDate", "deadline", "deliverables", "approvers", "risk", "unknowns"] },
  { title: "Confirm the size", fields: [] },
];
const STAGE_NAMES = ["Project", "Scope", "Size"];

/** The form control (or group) for each intake field. Used for ids and error lines. */
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

/** Where focus goes when a field is invalid. Radio groups focus their first option. */
const FOCUS_TARGET: Record<IntakeField, string> = {
  name: "f-name",
  track: "f-track-brand",
  startDate: "f-start",
  deadline: "f-deadline",
  deliverables: "f-deliverables",
  approvers: "f-approvers",
  risk: "f-risk-easy_undo",
  unknowns: "f-unknowns-none",
};

function input(id: string, type: string, extra: Partial<HTMLInputElement> = {}): HTMLInputElement {
  return el("input", { id, type, ...extra });
}

/** A group of selection cards for one intake field. The fieldset carries data-field for events. */
function choiceGroup(key: IntakeField, legend: string, options: ReadonlyArray<readonly [string, string]>): HTMLFieldSetElement {
  const group = el("fieldset", { className: "choice-group" }, [
    el("legend", { textContent: legend }),
    ...options.map(([value, text]) =>
      choice(CONTROL_ID[key], `${CONTROL_ID[key]}-${value}`, value, [
        el("span", { className: "card-title", textContent: text }),
        el("span", { className: "check", textContent: "✓" }, []),
      ], "option-card"),
    ),
  ]);
  group.dataset["field"] = key;
  return group;
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
    track: checkedValue(root, "f-track"),
    startDate: get<HTMLInputElement>("f-start").value,
    deadline: get<HTMLInputElement>("f-deadline").value,
    approver: get<HTMLInputElement>("f-approver").value,
    outOfScopeText: get<HTMLTextAreaElement>("f-outofscope").value,
    deliverables: num("f-deliverables"),
    approvers: num("f-approvers"),
    risk: checkedValue(root, "f-risk"),
    unknowns: checkedValue(root, "f-unknowns"),
  };
}

/** Builds the three-step intake wizard inside `root`. Returns the form element. */
export function mountIntakeForm(root: HTMLElement, save: SaveFn = saveBlob): HTMLFormElement {
  let sizeOverridden = false;
  let current = 0;
  /** Fields the user has left (blur or change), or that a Continue click has reached. */
  const touched = new Set<IntakeField>();
  /** Set after the first Download click: every field's error is shown from then on. */
  let revealAll = false;

  // Shared output: errors, the live summary, and the suggestion.
  const errorsEl = el("ul", { className: "errors", id: "f-errors", role: "alert" });
  const suggestionEl = el("p", { id: "f-suggestion", className: "suggestion", role: "status" });
  const durationEl = el("p", { id: "f-duration", className: "hint" });
  const deadlineHintEl = el("p", { id: "f-deadline-hint", className: "hint" });
  const sumName = el("dd", { id: "f-sum-name" });
  const sumTrack = el("dd", { id: "f-sum-track" });
  const sumDates = el("dd", { id: "f-sum-dates" });

  // Step 1: name and track.
  const nameField = field("f-name", "Project name", input("f-name", "text", { required: true }));
  nameField.dataset["field"] = "name";
  const trackGroup = el(
    "fieldset",
    { className: "choice-group track-group" },
    [
      el("legend", { textContent: "Track" }),
      ...TRACKS.map((t: Track) =>
        choice(
          "f-track",
          `f-track-${t}`,
          t,
          [
            el("span", { className: "card-title", textContent: TRACK_LABELS[t] }),
            el("span", { className: "chip", textContent: `${phaseDefs(t, "S").length} phases` }),
            el("span", { className: "check", textContent: "✓" }, []),
          ],
          `track-card track-${t}`,
        ),
      ),
    ],
  );
  trackGroup.dataset["field"] = "track";

  // Step 2: dates, counts, risk and unknowns.
  const startField = field("f-start", "Start date", input("f-start", "date", { value: todayIso(), required: true }));
  const deadlineField = field(
    "f-deadline",
    "Deadline",
    input("f-deadline", "date", { required: true }),
    "Duration is counted from start to deadline, both days included.",
  );
  const deliverablesField = field(
    "f-deliverables",
    "Deliverables (count)",
    input("f-deliverables", "number", { min: "1", step: "1" }),
  );
  const approversField = field(
    "f-approvers",
    "Approvers (people who approve)",
    input("f-approvers", "number", { min: "1", step: "1", value: "1" }),
  );
  startField.dataset["field"] = "startDate";
  deadlineField.dataset["field"] = "deadline";
  deliverablesField.dataset["field"] = "deliverables";
  approversField.dataset["field"] = "approvers";
  const riskGroup = choiceGroup("risk", "Risk if wrong", RISK_OPTIONS);
  const unknownsGroup = choiceGroup("unknowns", "Unknowns", UNKNOWNS_OPTIONS);

  // Step 3: size cards, approver, out of scope.
  const sizeCards = SIZE_LIST.map((size, i) => {
    const badge = el("span", { className: "badge", textContent: "Suggested", hidden: true });
    const detail = el("div", { className: "detail", hidden: true });
    const card = choice(
      "f-size",
      `f-size-${size}`,
      size,
      [
        el("span", { className: "card-num", textContent: String(i + 1).padStart(2, "0") }),
        el("span", { className: "card-size", textContent: size }),
        el("span", { className: "card-name", textContent: SIZE_NAMES[size] }),
        badge,
        el("span", { className: "check", textContent: "✓" }, []),
        detail,
      ],
      "size-card",
    );
    return { size, card, badge, detail };
  });
  const sizeGroup = el("fieldset", { className: "choice-group size-group" }, [
    el("legend", { textContent: "Size" }),
    ...sizeCards.map((c) => c.card),
  ]);
  sizeGroup.dataset["field"] = "size";
  const approverField = field("f-approver", "Approver name (optional)", input("f-approver", "text"));
  const outOfScopeField = field(
    "f-outofscope",
    "Out of scope (one item per line)",
    el("textarea", { id: "f-outofscope", rows: 4 }),
  );

  // Navigation and progress.
  const segs = STEPS.map(() => el("span", { className: "seg" }));
  const stepCount = el("p", { id: "f-step-count", className: "step-count" });
  const stages = STAGE_NAMES.map((name, i) =>
    el("li", { className: "stage" }, [el("span", { className: "stage-num", textContent: String(i + 1) }), ` ${name}`]),
  );
  const stepperEl = el("ol", { className: "stepper" }, stages);
  stepperEl.setAttribute("aria-label", "Progress");
  const tipEl = el("p", { className: "chip tip", textContent: "Tip: cut nice items first when the deadline moves." });
  const headings = STEPS.map((s, i) => {
    const h = el("h2", { id: `step-${i + 1}-title`, className: "step-title", textContent: s.title });
    h.tabIndex = -1;
    return h;
  });
  const stepSections = STEPS.map((_, i) => {
    const children: Array<Node | string> = [headings[i]!];
    if (i === 0) children.push(nameField, trackGroup);
    if (i === 1) {
      children.push(startField, deadlineField, deadlineHintEl, deliverablesField, approversField, riskGroup, unknownsGroup);
    }
    if (i === 2) {
      children.push(stepperEl, sizeGroup, approverField, outOfScopeField, tipEl);
    }
    const section = el("section", { className: "step", id: `step-${i + 1}` }, children);
    section.setAttribute("aria-labelledby", `step-${i + 1}-title`);
    return section;
  });
  const backBtn = el("button", { id: "f-back", type: "button", className: "secondary", textContent: "Back" });
  const nextBtn = el("button", { id: "f-next", type: "button", className: "primary", textContent: "Continue" });
  const downloadBtn = el("button", { id: "f-download", type: "button", className: "primary", textContent: "Download ZIP" });

  const progressEl = el("div", { className: "progress" }, segs);
  progressEl.setAttribute("aria-hidden", "true");
  const wizardMain = el("div", { className: "wizard-main" }, [
    progressEl,
    stepCount,
    ...stepSections,
    errorsEl,
    el("div", { className: "wizard-nav" }, [backBtn, nextBtn, downloadBtn]),
  ]);

  const summary = el("aside", { className: "summary", id: "f-summary" }, [
    el("h2", { className: "summary-title", textContent: "Summary" }),
    el("dl", { className: "summary-list" }, [
      el("dt", { textContent: "Project" }),
      sumName,
      el("dt", { textContent: "Track" }),
      sumTrack,
      el("dt", { textContent: "Dates" }),
      sumDates,
    ]),
    durationEl,
    suggestionEl,
  ]);
  summary.setAttribute("aria-label", "Summary");

  const form = el("form", { id: "intake", noValidate: true, className: "intake wizard" }, [wizardMain, summary]);
  root.replaceChildren(form);

  // One error line per field, placed in the field's own box and hidden until it should show.
  const errorLines = new Map<IntakeField, HTMLElement>();
  for (const key of INTAKE_FIELDS) {
    const box = form.querySelector<HTMLElement>(`[data-field="${key}"]`);
    if (!box) throw new Error(`form field ${key} is missing`);
    const line = el("p", { className: "field-error", id: `err-${CONTROL_ID[key]}`, hidden: true });
    box.append(line);
    for (const control of Array.from(box.querySelectorAll<HTMLElement>("input, select, textarea"))) {
      control.setAttribute("aria-describedby", line.id);
    }
    errorLines.set(key, line);
  }

  const stepOf = (key: IntakeField): number => STEPS.findIndex((s) => s.fields.includes(key));

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
      const box = form.querySelector<HTMLElement>(`[data-field="${key}"]`)!;
      for (const control of Array.from(box.querySelectorAll<HTMLElement>("input, select, textarea"))) {
        control.setAttribute("aria-invalid", message === "" ? "false" : "true");
      }
    }
  };

  /** Shows one step, updates the progress, and moves focus to its heading when asked. */
  const goTo = (n: number, focusHeading: boolean): void => {
    current = n;
    stepSections.forEach((s, i) => (s.hidden = i !== n));
    segs.forEach((s, i) => s.classList.toggle("on", i <= n));
    stepCount.textContent = `${n + 1} of ${STEPS.length}`;
    stages.forEach((li, i) => {
      li.classList.toggle("done", i < n);
      li.classList.toggle("current", i === n);
      if (i === n) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
    backBtn.hidden = n === 0;
    nextBtn.hidden = n === STEPS.length - 1;
    downloadBtn.hidden = n !== STEPS.length - 1;
    errorsEl.replaceChildren();
    if (focusHeading) headings[n]!.focus();
  };

  const focusField = (key: IntakeField): void => {
    form.querySelector<HTMLElement>(`#${FOCUS_TARGET[key]}`)?.focus();
  };

  const updateSizeCards = (suggestion: SizeSuggestion | null, a: IntakeAnswers): void => {
    const chosen = checkedValue(form, "f-size");
    const validTrack = (TRACKS as readonly string[]).includes(a.track);
    for (const c of sizeCards) {
      c.badge.hidden = suggestion === null || c.size !== suggestion.size;
      const on = chosen === c.size;
      c.detail.hidden = !on;
      c.detail.replaceChildren();
      if (!on) continue;
      if (suggestion && c.size === suggestion.size) {
        c.detail.append(
          el("p", {
            className: "detail-line",
            textContent: `Decided by: ${suggestion.decidedBy.map((k) => ANSWER_LABELS[k]).join(", ")}.`,
          }),
        );
      }
      c.detail.append(el("p", { className: "detail-line", textContent: "Files in the folder:" }));
      const files = validTrack
        ? filePlan(a.track as Track, c.size).map((f) => el("li", { textContent: f }))
        : [el("li", { textContent: "Choose a track to see the files." })];
      c.detail.append(el("ul", { className: "files" }, files));
    }
  };

  const updateSummary = (a: IntakeAnswers): void => {
    sumName.textContent = a.name.trim() || "Not named yet";
    sumTrack.textContent = (TRACKS as readonly string[]).includes(a.track) ? TRACK_LABELS[a.track as Track] : "Not chosen";
    sumDates.textContent =
      isRealIsoDate(a.startDate) && isRealIsoDate(a.deadline) ? `${a.startDate} to ${a.deadline}` : "Not set";
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

    let suggestion: SizeSuggestion | null = null;
    if (Object.keys(errors).length > 0) {
      suggestionEl.textContent = "Fill in the fields above to see a suggested size.";
      durationEl.textContent = "";
    } else {
      const s = suggestFromIntake(a);
      suggestionEl.textContent = `Suggested size: ${s.size}. Decided by: ${s.decidedBy
        .map((k) => ANSWER_LABELS[k])
        .join(", ")}.`;
      durationEl.textContent = `Duration: ${s.duration} day${s.duration === 1 ? "" : "s"}, counting start and deadline.`;
      if (!sizeOverridden) setChecked(form, "f-size", s.size);
      suggestion = s;
    }
    updateSizeCards(suggestion, a);
    updateSummary(a);
  };

  /** Marks the field the event came from as touched, then refreshes. */
  const touch = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const key = target?.closest<HTMLElement>("[data-field]")?.dataset["field"] as IntakeField | undefined;
    if (key) touched.add(key);
    refresh();
  };

  form.addEventListener("input", refresh);
  form.addEventListener("change", touch);
  form.addEventListener("focusout", touch);
  sizeGroup.addEventListener("change", () => {
    sizeOverridden = true;
    refresh();
  });

  nextBtn.addEventListener("click", () => {
    const keys = STEPS[current]!.fields;
    for (const k of keys) touched.add(k);
    const errors = fieldErrors(readAnswers(form));
    refresh();
    const bad = keys.find((k) => errors[k]);
    if (bad) {
      focusField(bad);
      return;
    }
    goTo(current + 1, true);
  });

  backBtn.addEventListener("click", () => goTo(Math.max(0, current - 1), true));

  downloadBtn.addEventListener("click", async () => {
    const a = readAnswers(form);
    const errors = fieldErrors(a);
    const first = INTAKE_FIELDS.find((k) => errors[k]);
    if (first) {
      // Reveal every error, go to the step with the first invalid field, and put the cursor there.
      revealAll = true;
      refresh();
      goTo(stepOf(first), false);
      focusField(first);
      return;
    }
    const sizeChosen = checkedValue(form, "f-size") as Size | "";
    if (sizeChosen === "") {
      showErrors(["Choose a size."]);
      return;
    }
    try {
      const project = createProject(a, sizeChosen);
      const blob = await buildZip(project);
      save(blob, zipFileName(project));
    } catch (err) {
      showErrors([(err as Error).message]);
    }
  });

  goTo(0, false);
  refresh();
  return form;
}
