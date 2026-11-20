import { buildRescopeZip } from "../core/zip";
import { directionOf, rescope } from "../core/rescope";
import { projectSlug } from "../core/files";
import { todayIso } from "../core/intake";
import type { OpenItem } from "../core/status";
import { SIZES, type Project, type Size } from "../core/types";
import { el, field, saveBlob, type SaveFn } from "./dom";

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

  const sizeSel = el(
    "select",
    { id: "rs-size" },
    SIZES.filter((s) => s !== project.size).map((s) => el("option", { value: s, textContent: s })),
  );
  const reasonInput = el("input", { id: "rs-reason", type: "text" });
  const approvedInput = el("input", { id: "rs-approved", type: "text" });
  const dateInput = el("input", { id: "rs-date", type: "date", value: today });

  const mustWarning = el("p", {
    id: "rs-must-warning",
    className: "warning",
    role: "alert",
    textContent: "You are cutting a must item. Type the reason below. The reason is written to the change record.",
  });
  mustWarning.hidden = true;
  const mustReason = el("input", { id: "rs-must-reason", type: "text" });
  const mustField = field("rs-must-reason", "Reason for cutting a must item", mustReason);
  mustField.hidden = true;

  const cutBox = el("div", { id: "rs-cuts", className: "cuts" });
  const cutItems = cutListOrder(project);
  const cutCheckboxes: HTMLInputElement[] = [];
  for (const it of cutItems) {
    const box = el("input", { type: "checkbox", id: `cut-${it.id}`, value: it.id });
    box.dataset["priority"] = it.priority;
    box.addEventListener("change", updateMustWarning);
    cutCheckboxes.push(box);
    cutBox.append(
      el("label", { className: "cut-item", htmlFor: `cut-${it.id}` }, [
        box,
        ` ${it.title} (${it.phase}, ${it.priority})`,
      ]),
    );
  }
  if (cutItems.length === 0) cutBox.append(el("p", { className: "hint", textContent: "No open items to cut." }));
  const cutSection = el("section", { className: "cut-step" }, [
    el("h3", { textContent: "Cut open items (move down only)" }),
    el("p", { className: "hint", textContent: "Nice items are listed first. Any open item can be cut." }),
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
    const newSize = sizeSel.value as Size;
    const down = newSize !== undefined && directionOf(project.size, newSize) === "down";
    cutSection.hidden = !down;
    if (!down) {
      for (const b of cutCheckboxes) b.checked = false;
      updateMustWarning();
    }
  }
  sizeSel.addEventListener("change", updateDirection);

  const button = el("button", { id: "rs-download", type: "button", textContent: "Download rescope ZIP" });
  button.addEventListener("click", async () => {
    errorsEl.replaceChildren();
    const newSize = sizeSel.value as Size;
    const down = directionOf(project.size, newSize) === "down";
    const cutIds = down ? cutCheckboxes.filter((b) => b.checked).map((b) => b.value) : [];
    try {
      const next = rescope(project, newSize, reasonInput.value, approvedInput.value || null, dateInput.value, {
        cutItemIds: cutIds,
        mustCutReason: mustReason.value,
      });
      const blob = await buildRescopeZip(next, project.size);
      save(blob, `${projectSlug(project.name)}-rescope-${newSize}.zip`);
      opts.onRescoped(next);
    } catch (err) {
      errorsEl.replaceChildren(el("li", { textContent: (err as Error).message }));
    }
  });

  root.replaceChildren(
    el("h2", { textContent: "Rescope" }),
    el("p", { className: "hint", textContent: `Current size: ${project.size}. Choose the new size and a reason. A change record is written to the ZIP's RESCOPE_NOTE.md and to project.yml.` }),
    field("rs-size", "New size", sizeSel),
    field("rs-reason", "Reason (required)", reasonInput),
    field("rs-approved", "Approved by (optional)", approvedInput),
    field("rs-date", "Date of change", dateInput),
    cutSection,
    errorsEl,
    el("div", { className: "actions" }, [button]),
  );
  updateDirection();
}
