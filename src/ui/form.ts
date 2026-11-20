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
import { el, field, saveBlob, type SaveFn, choice, checkedValue, setChecked, wireArrowKeys } from "./dom";
import { sizeName, trackName } from "./labels";
import { bind, describeError, ltr, onLanguageChange, pluralText, t, translate } from "./i18n";
import type { MessageKey } from "./i18n/en";

const ANSWER_KEYS: Record<AnswerKey, MessageKey> = {
  duration: "answer.duration",
  deliverables: "answer.deliverables",
  approvers: "answer.approvers",
  risk: "answer.risk",
  unknowns: "answer.unknowns",
};

const RISK_OPTIONS: ReadonlyArray<readonly [string, MessageKey]> = [
  ["easy_undo", "risk.easy_undo"],
  ["some_rework", "risk.some_rework"],
  ["hard_undo", "risk.hard_undo"],
];
const UNKNOWNS_OPTIONS: ReadonlyArray<readonly [string, MessageKey]> = [
  ["none", "unknowns.none"],
  ["few", "unknowns.few"],
  ["research_needed", "unknowns.research_needed"],
];
const SIZE_LIST: readonly Size[] = ["S", "M", "L"];

/** The three wizard steps, with the intake fields each step asks for. Step 3 has none of its own. */
const STEPS: ReadonlyArray<{ title: MessageKey; fields: readonly IntakeField[] }> = [
  { title: "step.1", fields: ["name", "track"] },
  { title: "step.2", fields: ["startDate", "deadline", "deliverables", "approvers", "risk", "unknowns"] },
  { title: "step.3", fields: [] },
];
const STAGE_NAMES: readonly MessageKey[] = ["stage.project", "stage.scope", "stage.size"];

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
function choiceGroup(key: IntakeField, legend: MessageKey, options: ReadonlyArray<readonly [string, MessageKey]>): HTMLFieldSetElement {
  const group = el("fieldset", { className: "choice-group" }, [
    translate(el("legend", {}), legend),
    ...options.map(([value, textKey]) =>
      choice(CONTROL_ID[key], `${CONTROL_ID[key]}-${value}`, value, [
        translate(el("span", { className: "card-title" }), textKey),
        el("span", { className: "check", textContent: "✓" }, []),
      ], "option-card"),
    ),
  ]);
  group.dataset["field"] = key;
  wireArrowKeys(group);
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
  /** Step-level error messages, as functions so they can be re-translated on a language switch. */
  let stepErrors: Array<() => string> = [];

  // Shared output: errors, the live summary, and the suggestion.
  const errorsEl = el("ul", { className: "errors", id: "f-errors", role: "alert" });
  const suggestionEl = el("p", { id: "f-suggestion", className: "suggestion", role: "status" });
  const durationEl = el("p", { id: "f-duration", className: "hint" });
  const deadlineHintEl = el("p", { id: "f-deadline-hint", className: "hint" });
  const sumName = el("dd", { id: "f-sum-name" });
  sumName.dir = "auto";
  const sumTrack = el("dd", { id: "f-sum-track" });
  const sumDates = el("dd", { id: "f-sum-dates" });

  // Step 1: name and track.
  const nameField = field("f-name", "field.name", input("f-name", "text", { required: true }));
  nameField.dataset["field"] = "name";
  const trackGroup = el("fieldset", { className: "choice-group track-group" }, [
    translate(el("legend", {}), "legend.track"),
    ...TRACKS.map((tr: Track) => {
      const chip = el("span", { className: "chip" });
      bind(() => {
        chip.textContent = pluralText("phase", phaseDefs(tr, "S").length);
      });
      return choice(
        "f-track",
        `f-track-${tr}`,
        tr,
        [
          bind2(el("span", { className: "card-title" }), () => trackName(tr)),
          chip,
          el("span", { className: "check", textContent: "✓" }, []),
        ],
        `track-card track-${tr}`,
      );
    }),
  ]);
  trackGroup.dataset["field"] = "track";
  wireArrowKeys(trackGroup);

  // Step 2: dates, counts, risk and unknowns.
  const startField = field("f-start", "field.startDate", input("f-start", "date", { value: todayIso(), required: true }));
  const deadlineField = field(
    "f-deadline",
    "field.deadline",
    input("f-deadline", "date", { required: true }),
    "hint.deadline",
  );
  const deliverablesField = field(
    "f-deliverables",
    "field.deliverables",
    input("f-deliverables", "number", { min: "1", step: "1" }),
  );
  const approversField = field(
    "f-approvers",
    "field.approvers",
    input("f-approvers", "number", { min: "1", step: "1", value: "1" }),
  );
  startField.dataset["field"] = "startDate";
  deadlineField.dataset["field"] = "deadline";
  deliverablesField.dataset["field"] = "deliverables";
  approversField.dataset["field"] = "approvers";
  const riskGroup = choiceGroup("risk", "legend.risk", RISK_OPTIONS);
  const unknownsGroup = choiceGroup("unknowns", "legend.unknowns", UNKNOWNS_OPTIONS);

  // Step 3: size cards, approver, out of scope.
  const sizeCards = SIZE_LIST.map((size, i) => {
    const badge = translate(el("span", { className: "badge", hidden: true }), "badge.suggested");
    const detail = el("div", { className: "detail", hidden: true });
    const card = choice(
      "f-size",
      `f-size-${size}`,
      size,
      [
        el("span", { className: "card-num", textContent: String(i + 1).padStart(2, "0") }),
        el("span", { className: "card-size", textContent: size }),
        bind2(el("span", { className: "card-name" }), () => sizeName(size)),
        badge,
        el("span", { className: "check", textContent: "✓" }, []),
        detail,
      ],
      "size-card",
    );
    return { size, card, badge, detail };
  });
  const sizeGroup = el("fieldset", { className: "choice-group size-group" }, [
    translate(el("legend", {}), "legend.size"),
    ...sizeCards.map((c) => c.card),
  ]);
  sizeGroup.dataset["field"] = "size";
  wireArrowKeys(sizeGroup);
  const approverField = field("f-approver", "field.approverOpt", input("f-approver", "text"));
  const outOfScopeField = field(
    "f-outofscope",
    "field.outOfScope",
    el("textarea", { id: "f-outofscope", rows: 4 }),
  );

  // Navigation and progress.
  const segs = STEPS.map(() => el("span", { className: "seg" }));
  const stepCount = el("p", { id: "f-step-count", className: "step-count" });
  const stages = STAGE_NAMES.map((name, i) => {
    const num = el("span", { className: "stage-num", textContent: String(i + 1) });
    const li = el("li", { className: "stage" }, [num, " "]);
    const label = translate(el("span", {}), name);
    li.append(label);
    return li;
  });
  const stepperEl = el("ol", { className: "stepper" }, stages);
  bind(() => stepperEl.setAttribute("aria-label", t("wizard.progress")));
  const tipEl = translate(el("p", { className: "chip tip" }), "tip");
  const headings = STEPS.map((s, i) => {
    const h = translate(el("h2", { id: `step-${i + 1}-title`, className: "step-title" }), s.title);
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
  const backBtn = translate(el("button", { id: "f-back", type: "button", className: "secondary" }), "nav.back");
  const nextBtn = translate(el("button", { id: "f-next", type: "button", className: "primary" }), "nav.next");
  const downloadBtn = translate(el("button", { id: "f-download", type: "button", className: "primary" }), "nav.download");
  const noteEl = translate(el("p", { className: "hint download-note" }), "note.english");

  const progressEl = el("div", { className: "progress" }, segs);
  progressEl.setAttribute("aria-hidden", "true");
  const wizardMain = el("div", { className: "wizard-main" }, [
    progressEl,
    stepCount,
    ...stepSections,
    errorsEl,
    el("div", { className: "wizard-nav" }, [backBtn, nextBtn, downloadBtn]),
    noteEl,
  ]);

  const summary = el("aside", { className: "summary", id: "f-summary" }, [
    translate(el("h2", { className: "summary-title" }), "summary.title"),
    el("dl", { className: "summary-list" }, [
      translate(el("dt", {}), "summary.project"),
      sumName,
      translate(el("dt", {}), "summary.track"),
      sumTrack,
      translate(el("dt", {}), "summary.dates"),
      sumDates,
    ]),
    durationEl,
    suggestionEl,
  ]);
  bind(() => summary.setAttribute("aria-label", t("summary.title")));

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

  const renderStepErrors = (): void => {
    errorsEl.replaceChildren(...stepErrors.map((message) => el("li", { textContent: message() })));
  };
  onLanguageChange(renderStepErrors);

  const showErrors = (messages: Array<() => string>): void => {
    stepErrors = messages;
    renderStepErrors();
  };

  /** Shows the error of each field that is touched (or all, after a Download click). */
  const showFieldErrors = (errors: Partial<Record<IntakeField, string>>): void => {
    for (const key of INTAKE_FIELDS) {
      const message = (revealAll || touched.has(key)) && errors[key] ? t(`err.${key}` as MessageKey) : "";
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
    renderStep();
    stages.forEach((li, i) => {
      li.classList.toggle("done", i < n);
      li.classList.toggle("current", i === n);
      if (i === n) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
    backBtn.hidden = n === 0;
    nextBtn.hidden = n === STEPS.length - 1;
    downloadBtn.hidden = n !== STEPS.length - 1;
    stepErrors = [];
    renderStepErrors();
    if (focusHeading) headings[n]!.focus();
  };

  const renderStep = (): void => {
    stepCount.textContent = t("wizard.stepOf", { n: current + 1, total: STEPS.length });
  };
  onLanguageChange(renderStep);

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
            textContent: t("detail.decidedBy", { by: decidedBy(suggestion) }),
          }),
        );
      }
      c.detail.append(el("p", { className: "detail-line", textContent: t("detail.files") }));
      const files = validTrack
        ? filePlan(a.track as Track, c.size).map((f) => el("li", { textContent: f }))
        : [el("li", { textContent: t("detail.chooseTrack") })];
      c.detail.append(el("ul", { className: "files ltr" }, files));
    }
  };

  const decidedBy = (s: SizeSuggestion): string => s.decidedBy.map((k) => t(ANSWER_KEYS[k])).join(t("list.sep"));

  const updateSummary = (a: IntakeAnswers): void => {
    sumName.textContent = a.name.trim() || t("summary.notNamed");
    sumTrack.textContent = (TRACKS as readonly string[]).includes(a.track) ? trackName(a.track as Track) : t("summary.notChosen");
    sumDates.textContent =
      isRealIsoDate(a.startDate) && isRealIsoDate(a.deadline)
        ? t("summary.range", { start: ltr(a.startDate), end: ltr(a.deadline) })
        : t("summary.notSet");
  };

  const refresh = (): void => {
    const a = readAnswers(form);
    const errors = fieldErrors(a);
    showFieldErrors(errors);
    // Both dates are YYYY-MM-DD, so string comparison is date comparison.
    deadlineHintEl.textContent =
      a.startDate && a.deadline && a.deadline < a.startDate ? t("deadline.before") : "";

    let suggestion: SizeSuggestion | null = null;
    if (Object.keys(errors).length > 0) {
      suggestionEl.textContent = t("suggest.fill");
      durationEl.textContent = "";
    } else {
      const s = suggestFromIntake(a);
      suggestionEl.textContent = t("suggest.line", { size: s.size, by: decidedBy(s) });
      durationEl.textContent = t("duration.line", { d: pluralText("day", s.duration) });
      if (!sizeOverridden) setChecked(form, "f-size", s.size);
      suggestion = s;
    }
    updateSizeCards(suggestion, a);
    updateSummary(a);
  };
  onLanguageChange(refresh);

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
      showErrors([() => t("err.chooseSize")]);
      return;
    }
    try {
      const project = createProject(a, sizeChosen);
      const blob = await buildZip(project);
      save(blob, zipFileName(project));
    } catch (err) {
      const message = describeError(err);
      showErrors([() => message]);
    }
  });

  goTo(0, false);
  refresh();
  return form;
}

/** Keeps a text node's content in step with a function that reads the language. */
function bind2<N extends HTMLElement>(node: N, text: () => string): N {
  bind(() => {
    node.textContent = text();
  });
  return node;
}
