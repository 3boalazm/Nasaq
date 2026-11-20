import type { ProjectStatus, OpenItem, ScopeAlert } from "../core/status";
import { el } from "./dom";

export type Line = [label: string, value: string];

function itemText(it: OpenItem): string {
  return `${it.title} (${it.phase}, ${it.priority})`;
}

/** Label and value pairs for the status card. Pure, so it can be tested without the DOM. */
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

/** Status card: the lines, the change history, and the alert if any. */
export function mountStatus(root: HTMLElement, s: ProjectStatus, alert: ScopeAlert): void {
  const dl = el("dl", { className: "status" });
  for (const [label, value] of statusLines(s)) {
    dl.append(el("dt", { textContent: label }), el("dd", { textContent: value }));
  }
  const children: Array<Node | string> = [el("h2", { textContent: "Status" }), dl];

  const msg = alertMessage(alert);
  if (msg) children.push(el("p", { id: "scope-alert", className: "warning", role: "alert", textContent: msg }));

  if (s.historyRows.length > 0) {
    const rows = s.historyRows.map((c) =>
      el("tr", {}, [
        el("td", { textContent: c.date }),
        el("td", { textContent: `${c.fromSize ?? "-"} → ${c.toSize}` }),
        el("td", { textContent: c.reason }),
        el("td", { textContent: c.itemsCutLabels.length ? c.itemsCutLabels.join("; ") : "none" }),
        el("td", { textContent: c.approvedBy ?? "-" }),
      ]),
    );
    const table = el("table", { className: "history" }, [
      el("thead", {}, [
        el("tr", {}, ["Date", "From → to", "Reason", "Items cut", "Approved by"].map((h) => el("th", { textContent: h }))),
      ]),
      el("tbody", {}, rows),
    ]);
    // Wide tables scroll inside their own box, so the page itself never grows past the screen.
    children.push(el("h3", { textContent: "Size history" }), el("div", { className: "table-wrap" }, [table]));
  }
  root.replaceChildren(...children);
}
