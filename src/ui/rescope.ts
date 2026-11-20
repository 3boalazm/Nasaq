import { buildRescopeZip } from "../core/zip";
import { content, isolate } from "./i18n/content";
import { directionOf, rescope } from "../core/rescope";
import { projectSlug } from "../core/files";
import { todayIso } from "../core/intake";
import type { OpenItem } from "../core/status";
import { SIZES, type Project, type Size } from "../core/types";
import { el, field, saveBlob, choice, checkedValue, wireArrowKeys, type SaveFn } from "./dom";
import { sizeName } from "./labels";
import { bind, describeError, onLanguageChange, t, translate } from "./i18n";

export interface RescopeOptions {
  save?: SaveFn;
  today?: string;
  /** Called with the project after the ZIP is produced. */
  onRescoped: (next: Project) => void;
}

/** Open items, nice first, then must. Used for the cut list. */
export function cutListOrder(project: Project): OpenItem[] {
  const open: OpenItem[] = [];
  for (const ph of project.phases) {
    for (const it of ph.items) {
      if (it.status === "todo" || it.status === "doing") {
        open.push({ id: it.id, title: it.title, phase: ph.name, priority: it.priority });
      }
    }
  }
  return [...open.filter((o) => o.priority === "nice"), ...open.filter((o) => o.priority === "must")];
}

export function mountRescope(root: HTMLElement, project: Project, opts: RescopeOptions): void {
  const save = opts.save ?? saveBlob;
  const today = opts.today ?? todayIso();
  const errorsEl = el("ul", { className: "errors", id: "rs-errors" });
  /** Current error messages, as functions so they can be shown again in the new language. */
  let errorMessages: Array<() => string> = [];
  const renderErrors = (): void => {
    errorsEl.replaceChildren(...errorMessages.map((m) => el("li", { textContent: m() })));
  };
  onLanguageChange(renderErrors);

  // New size: the same selection cards as the wizard. The first size other than the current one is preselected.
  const otherSizes = SIZES.filter((s) => s !== project.size);
  const sizeGroup = el("fieldset", { id: "rs-size", className: "choice-group size-group" }, [
    translate(el("legend", {}), "rescope.newSize"),
    ...otherSizes.map((s) =>
      choice(
        "rs-size",
        `rs-size-${s}`,
        s,
        [
          el("span", { className: "card-size", textContent: s }),
          bind2(el("span", { className: "card-name" }), () => sizeName(s)),
          el("span", { className: "check", textContent: "✓" }, []),
        ],
        "size-card compact",
      ),
    ),
  ]);
  wireArrowKeys(sizeGroup);
  const firstSize = sizeGroup.querySelector<HTMLInputElement>('input[name="rs-size"]');
  if (firstSize) firstSize.checked = true;
  const reasonInput = el("input", { id: "rs-reason", type: "text" });
  const approvedInput = el("input", { id: "rs-approved", type: "text", required: true });
  const dateInput = el("input", { id: "rs-date", type: "date", value: today });

  const mustWarning = translate(
    el("p", { id: "rs-must-warning", className: "warning", role: "alert" }),
    "rescope.mustWarn",
  );
  mustWarning.hidden = true;
  const mustReason = el("input", { id: "rs-must-reason", type: "text" });
  const mustField = field("rs-must-reason", "rescope.mustReason", mustReason);
  mustField.hidden = true;

  const cutBox = el("div", { id: "rs-cuts", className: "cuts" });
  const cutItems = cutListOrder(project);
  const cutCheckboxes: HTMLInputElement[] = [];
  for (const it of cutItems) {
    const box = el("input", { type: "checkbox", id: `cut-${it.id}`, value: it.id });
    box.dataset["priority"] = it.priority;
    box.addEventListener("change", updateMustWarning);
    cutCheckboxes.push(box);
    const text = el("span", {});
    bind(() => {
      text.textContent = t("rescope.cutLabel", {
        title: isolate(content(it.title)),
        phase: isolate(content(it.phase)),
        priority: t(`dash.priority.${it.priority}`),
      });
    });
    cutBox.append(el("label", { className: "cut-item", htmlFor: `cut-${it.id}` }, [box, " ", text]));
  }
  if (cutItems.length === 0) cutBox.append(translate(el("p", { className: "hint" }), "rescope.noOpen"));
  const cutSection = el("section", { className: "cut-step" }, [
    translate(el("h3", {}), "rescope.cutTitle"),
    translate(el("p", { className: "hint" }), "rescope.cutHint"),
    cutBox,
    mustWarning,
    mustField,
  ]);

  function updateMustWarning(): void {
    const mustChecked = cutCheckboxes.some((b) => b.checked && b.dataset["priority"] === "must");
    mustWarning.hidden = !mustChecked;
    mustField.hidden = !mustChecked;
  }

  function updateDirection(): void {
    const picked = checkedValue(sizeGroup, "rs-size");
    const down = picked !== "" && directionOf(project.size, picked as Size) === "down";
    cutSection.hidden = !down;
    if (!down) {
      for (const b of cutCheckboxes) b.checked = false;
      updateMustWarning();
    }
  }
  sizeGroup.addEventListener("change", updateDirection);

  const button = translate(el("button", { id: "rs-download", type: "button", className: "primary" }), "rescope.download");
  button.addEventListener("click", async () => {
    errorMessages = [];
    renderErrors();
    const picked = checkedValue(sizeGroup, "rs-size");
    const newSize = picked as Size;
    const down = picked !== "" && directionOf(project.size, newSize) === "down";
    const cutIds = down ? cutCheckboxes.filter((b) => b.checked).map((b) => b.value) : [];
    try {
      const next = rescope(project, newSize, reasonInput.value, approvedInput.value, dateInput.value, {
        cutItemIds: cutIds,
        mustCutReason: mustReason.value,
      });
      const blob = await buildRescopeZip(next, project.size);
      save(blob, `${projectSlug(project.name)}-rescope-${newSize}.zip`);
      opts.onRescoped(next);
    } catch (err) {
      const message = describeError(err);
      errorMessages = [() => message];
      renderErrors();
    }
  });

  root.replaceChildren(
    translate(el("h2", { className: "card-head" }), "rescope.title"),
    bind2(el("p", { className: "hint" }), () => t("rescope.hint", { size: project.size })),
    sizeGroup,
    field("rs-reason", "rescope.reason", reasonInput),
    field("rs-approved", "rescope.approved", approvedInput),
    field("rs-date", "rescope.date", dateInput),
    cutSection,
    errorsEl,
    el("div", { className: "actions" }, [button]),
  );
  updateDirection();
}

/** Keeps a text node's content in step with a function that reads the language. */
function bind2<N extends HTMLElement>(node: N, text: () => string): N {
  bind(() => {
    node.textContent = text();
  });
  return node;
}
