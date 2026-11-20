import { scopeAlert, status, type OpenItem, type ProjectStatus, type ScopeAlert } from "../core/status";
import { DELIVERABLES_BANDS } from "../core/thresholds";
import type { Item, Project, Size } from "../core/types";
import { el } from "./dom";
import { SIZE_NAMES, TRACK_LABELS } from "./labels";

export type Line = [label: string, value: string];

function itemText(it: OpenItem): string {
  return `${it.title} (${it.phase}, ${it.priority})`;
}

/** Label and value pairs for the status summary. Pure, so it can be tested without the DOM. */
export function statusLines(s: ProjectStatus): Line[] {
  const days = !s.hasDeadline
    ? "no deadline set"
    : s.overdue
      ? "overdue"
      : `${s.daysLeft} day${s.daysLeft === 1 ? "" : "s"} (counting today and the deadline)`;
  return [
    ["Project", s.name],
    ["Track", s.track],
    ["Size", s.size],
    ["Start", s.startDate],
    ["Deadline", s.deadline ?? "not set"],
    ["Days left", days],
    ["Current phase", s.currentPhase ?? "none: every item is done or cut"],
    ["Deliverables (not cut)", String(s.deliverables)],
    ["Open must items", s.openMust.length ? s.openMust.map(itemText).join("; ") : "none"],
    ["Open nice items", s.openNice.length ? s.openNice.map(itemText).join("; ") : "none"],
    ["Size changes", String(s.sizeHistory.length)],
  ];
}

/** Scope alert text, or null when there is no alert. The alert never changes the size. */
export function alertMessage(a: ScopeAlert): string | null {
  if (!a.alert) return null;
  return `Scope alert: ${a.reasons.join("; ")}. Suggested next size: ${a.suggestedSize}. Nothing has changed. Rescope if you want to move up.`;
}

/** Done, open and cut counts for each phase, in phase order. Derived from project.yml only. */
export function phaseCounts(project: Project): Array<{ name: string; done: number; open: number; cut: number }> {
  return project.phases.map((ph) => {
    const count = (pred: (it: Item) => boolean): number => ph.items.filter(pred).length;
    return {
      name: ph.name,
      done: count((it) => it.status === "done"),
      open: count((it) => it.status === "todo" || it.status === "doing"),
      cut: count((it) => it.status === "cut"),
    };
  });
}

/** Deliverables limit for a size from thresholds.ts. Null for L, which has no upper limit. */
export function deliverableLimit(size: Size): number | null {
  return size === "L" ? null : DELIVERABLES_BANDS[size].max;
}

const plural = (n: number, word: string): string => `${n} ${word}${n === 1 ? "" : "s"}`;

function card(id: string, title: string, extra: string[] = []): { node: HTMLElement; body: HTMLElement } {
  const body = el("div", { className: "card-body" });
  const node = el("section", { className: ["card", ...extra].join(" "), id }, [
    el("h3", { className: "card-head", textContent: title }),
    body,
  ]);
  node.setAttribute("aria-labelledby", `${id}-title`);
  node.querySelector("h3")!.id = `${id}-title`;
  return { node, body };
}

function openItemsCard(project: Project): HTMLElement {
  const items = project.phases.flatMap((ph) =>
    ph.items.filter((it) => it.status === "todo" || it.status === "doing").map((it) => ({ it, phase: ph.name })),
  );
  const total = project.phases.reduce((n, ph) => n + ph.items.filter((it) => it.status !== "cut").length, 0);
  const done = project.phases.reduce((n, ph) => n + ph.items.filter((it) => it.status === "done").length, 0);
  const { node, body } = card("card-open", "Open items", ["card-wide-2"]);
  body.append(
    el("p", { className: "big-line", textContent: `${done} of ${total} done` }),
    (() => {
      const bar = el("progress", { max: Math.max(total, 1), value: done, className: "progress-bar" });
      bar.setAttribute("aria-label", `${done} of ${total} items done`);
      return bar;
    })(),
  );
  if (items.length === 0) {
    body.append(el("p", { className: "hint", textContent: "No open items. Every item is done or cut." }));
  } else {
    // Must items first, then nice items, in phase order within each group.
    const ordered = [...items.filter((x) => x.it.priority === "must"), ...items.filter((x) => x.it.priority === "nice")];
    body.append(
      el(
        "ul",
        { className: "checklist" },
        ordered.map(({ it, phase }) =>
          el("li", {}, [
            el("span", { className: "box", textContent: "☐" }),
            el("span", { className: "check-title", textContent: it.title }),
            el("span", { className: "check-meta", textContent: `${phase} · ${it.priority === "must" ? "Must" : "Nice"}` }),
          ]),
        ),
      ),
    );
  }
  return node;
}

function sizeCard(s: ProjectStatus): HTMLElement {
  const { node, body } = card("card-size", "Size");
  const days = !s.hasDeadline
    ? "No deadline set"
    : s.overdue
      ? "Overdue"
      : `${plural(s.daysLeft, "day")} left`;
  body.append(
    el("p", { className: "big", textContent: s.size }),
    el("p", { className: "big-sub", textContent: SIZE_NAMES[s.size] }),
    el("p", { className: "meta", textContent: `Since ${s.startDate}` }),
    el("p", { className: "meta", textContent: days }),
  );
  return node;
}

function deliverablesCard(s: ProjectStatus): HTMLElement {
  const { node, body } = card("card-deliverables", "Deliverables");
  const limit = deliverableLimit(s.size);
  body.append(el("p", { className: "big", textContent: String(s.deliverables) }));
  if (limit === null) {
    body.append(
      el("p", { className: "meta", textContent: `Not cut. ${DELIVERABLES_BANDS.L.min} or more is size L, with no upper limit.` }),
    );
    return node;
  }
  body.append(el("p", { className: "meta", textContent: `Not cut. Limit for ${s.size}: ${limit}.` }));
  const bar = el("div", { className: "segments" });
  bar.setAttribute("aria-hidden", "true");
  for (let i = 0; i < limit; i++) {
    bar.append(el("span", { className: i < s.deliverables ? "seg on" : "seg" }));
  }
  body.append(bar);
  if (s.deliverables > limit) {
    body.append(el("p", { className: "meta alert-text", textContent: `${s.deliverables - limit} over the limit.` }));
  }
  return node;
}

function alertCard(alert: ScopeAlert): HTMLElement {
  if (!alert.alert) {
    const { node, body } = card("card-scope", "Scope");
    body.append(el("p", { className: "big-line", textContent: "Within limits" }));
    return node;
  }
  const { node, body } = card("card-scope", "Scope", ["card-alert"]);
  body.append(el("p", { id: "scope-alert", className: "alert-text", role: "alert", textContent: alertMessage(alert) ?? "" }));
  return node;
}

function phasesCard(project: Project): HTMLElement {
  const { node, body } = card("card-phases", "Phases");
  const rows = phaseCounts(project).map((c) => {
    const total = c.done + c.open + c.cut;
    const bar = el("div", { className: "phase-bar" });
    bar.setAttribute("aria-hidden", "true");
    const seg = (n: number, cls: string): void => {
      if (n === 0) return;
      const part = el("span", { className: `part ${cls}` });
      part.style.flexGrow = String(n);
      bar.append(part);
    };
    seg(c.done, "done");
    seg(c.open, "open");
    seg(c.cut, "cut");
    if (total === 0) bar.append(el("span", { className: "part empty" }));
    return el("div", { className: "phase-row" }, [
      el("p", { className: "phase-name", textContent: c.name }),
      bar,
      el("p", { className: "meta", textContent: `${c.done} done · ${c.open} open · ${c.cut} cut` }),
    ]);
  });
  body.append(el("div", { className: "phase-list" }, rows));
  return node;
}

function historyCard(s: ProjectStatus): HTMLElement {
  const { node, body } = card("card-history", "Size history");
  if (s.historyRows.length === 0) {
    body.append(el("p", { className: "hint", textContent: "No size changes yet." }));
    return node;
  }
  // Newest first.
  const rows = [...s.historyRows].reverse().map((c) =>
    el("li", { className: "activity-item" }, [
      el("p", { className: "act-head" }, [
        el("span", { className: "act-date", textContent: c.date }),
        el("span", { className: "act-change", textContent: `${c.fromSize ?? "-"} → ${c.toSize}` }),
      ]),
      el("p", { className: "act-line" }, [
        el("span", { className: "k", textContent: "Reason" }),
        el("span", { className: "v", textContent: c.reason }),
      ]),
      el("p", { className: "act-line" }, [
        el("span", { className: "k", textContent: "Items cut" }),
        el("span", { className: "v", textContent: c.itemsCutLabels.length ? c.itemsCutLabels.join("; ") : "none" }),
      ]),
      el("p", { className: "act-line" }, [
        el("span", { className: "k", textContent: "Approved by" }),
        el("span", { className: "v", textContent: c.approvedBy ?? "-" }),
      ]),
    ]),
  );
  // Wide content scrolls inside its own box, so the page itself never grows past the screen.
  body.append(el("div", { className: "table-wrap" }, [el("ol", { className: "activity" }, rows)]));
  return node;
}

/**
 * Existing project dashboard: header with the name, size and track; then the cards.
 * Every number comes from project.yml, thresholds.ts, or the given `today`.
 */
export function mountStatus(root: HTMLElement, project: Project, today: string): void {
  const s = status(project, today);
  const alert = scopeAlert(project);
  const header = el("header", { className: "dash-head" }, [
    el("h2", { className: "dash-name", textContent: s.name }),
    el("p", { className: "pills" }, [
      el("span", { className: "pill", textContent: `Size ${s.size}` }),
      el("span", { className: "pill", textContent: TRACK_LABELS[s.track] }),
    ]),
  ]);
  const grid = el("div", { className: "bento" }, [
    openItemsCard(project),
    sizeCard(s),
    deliverablesCard(s),
    alertCard(alert),
    phasesCard(project),
    historyCard(s),
  ]);
  root.replaceChildren(header, grid);
}
