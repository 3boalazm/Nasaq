import { scopeAlert, status, type OpenItem, type ProjectStatus, type ScopeAlert } from "../core/status";
import { DELIVERABLES_BANDS, DURATION_DAYS_BANDS } from "../core/thresholds";
import type { Item, Project, Size } from "../core/types";
import { el } from "./dom";
import { sizeName, trackName } from "./labels";
import { bind, ltr, pluralText, t, translate } from "./i18n";
import type { MessageKey } from "./i18n/en";

export type Line = [label: string, value: string];

function itemText(it: OpenItem): string {
  return `${it.title} (${it.phase}, ${it.priority})`;
}

/** Label and value pairs for the status summary. Pure, so it can be tested without the DOM. */
export function statusLines(s: ProjectStatus): Line[] {
  const days = !s.hasDeadline
    ? t("dash.noDeadline")
    : s.overdue
      ? t("dash.overdue")
      : t("dash.daysCounting", { d: pluralText("day", s.daysLeft) });
  const list = (items: OpenItem[]): string => (items.length ? items.map(itemText).join(t("reasons.sep")) : t("dash.none"));
  return [
    [t("dash.line.project"), s.name],
    [t("dash.line.track"), trackName(s.track)],
    [t("dash.line.size"), s.size],
    [t("dash.line.start"), s.startDate],
    [t("dash.line.deadline"), s.deadline ?? t("dash.notSet")],
    [t("dash.line.daysLeft"), days],
    [t("dash.line.phase"), s.currentPhase ?? t("dash.noPhase")],
    [t("dash.line.deliverables"), String(s.deliverables)],
    [t("dash.line.openMust"), list(s.openMust)],
    [t("dash.line.openNice"), list(s.openNice)],
    [t("dash.line.changes"), String(s.sizeHistory.length)],
  ];
}

/**
 * The reasons the scope alert gives, written from the same thresholds as core, in the current language.
 * Core's own English reasons are not shown on the page.
 */
export function scopeReasons(project: Project, a: ScopeAlert): string[] {
  if (project.size === "L") return [];
  const size: Size = project.size;
  const out: string[] = [];
  const maxDeliverables = DELIVERABLES_BANDS[size].max;
  if (a.deliverables > maxDeliverables) {
    out.push(t("alert.deliv", { n: a.deliverables, size, max: maxDeliverables }));
  }
  const maxDays = DURATION_DAYS_BANDS[size].max;
  if (a.duration !== null && a.duration > maxDays) {
    out.push(t("alert.days", { n: a.duration, size, max: maxDays }));
  }
  return out;
}

/**
 * Scope alert text, or null when there is no alert. The alert never changes the size.
 * Pass the project to get the reasons in the current language.
 */
export function alertMessage(a: ScopeAlert, project?: Project): string | null {
  if (!a.alert) return null;
  const reasons = project ? scopeReasons(project, a) : a.reasons;
  return t("alert.text", { reasons: reasons.join(t("reasons.sep")), size: a.suggestedSize ?? "" });
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

/** A card: a section with a translated heading. `body` gets the content. */
function card(id: string, titleKey: MessageKey, extra: string[] = []): { node: HTMLElement; body: HTMLElement } {
  const body = el("div", { className: "card-body" });
  const heading = translate(el("h3", { className: "card-head" }), titleKey);
  heading.id = `${id}-title`;
  const node = el("section", { className: ["card", ...extra].join(" "), id }, [heading, body]);
  node.setAttribute("aria-labelledby", `${id}-title`);
  return { node, body };
}

/** A text node whose content follows the language. */
function live<K extends keyof HTMLElementTagNameMap>(tag: K, props: Partial<HTMLElementTagNameMap[K]>, text: () => string): HTMLElementTagNameMap[K] {
  const node = el(tag, props);
  bind(() => {
    node.textContent = text();
  });
  return node;
}

function openItemsCard(project: Project): HTMLElement {
  const items = project.phases.flatMap((ph) =>
    ph.items.filter((it) => it.status === "todo" || it.status === "doing").map((it) => ({ it, phase: ph.name })),
  );
  const total = project.phases.reduce((n, ph) => n + ph.items.filter((it) => it.status !== "cut").length, 0);
  const done = project.phases.reduce((n, ph) => n + ph.items.filter((it) => it.status === "done").length, 0);
  const { node, body } = card("card-open", "dash.card.open", ["card-wide-2"]);
  const bar = el("progress", { max: Math.max(total, 1), value: done, className: "progress-bar" });
  bind(() => bar.setAttribute("aria-label", t("dash.openAria", { done, total })));
  body.append(live("p", { className: "big-line" }, () => t("dash.openDone", { done, total })), bar);
  if (items.length === 0) {
    body.append(translate(el("p", { className: "hint" }), "dash.noOpen"));
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
            el("span", { className: "check-title", textContent: it.title, dir: "auto" }),
            live("span", { className: "check-meta" }, () =>
              `${phase} · ${it.priority === "must" ? t("dash.priority.must") : t("dash.priority.nice")}`,
            ),
          ]),
        ),
      ),
    );
  }
  return node;
}

function sizeCard(s: ProjectStatus): HTMLElement {
  const { node, body } = card("card-size", "dash.card.size");
  body.append(
    el("p", { className: "big", textContent: s.size }),
    live("p", { className: "big-sub" }, () => sizeName(s.size)),
    live("p", { className: "meta" }, () => t("dash.since", { date: ltr(s.startDate) })),
    live("p", { className: "meta" }, () =>
      !s.hasDeadline ? t("dash.noDeadlineCard") : s.overdue ? t("dash.overdueCard") : t("dash.left", { d: pluralText("day", s.daysLeft) }),
    ),
  );
  return node;
}

function deliverablesCard(s: ProjectStatus): HTMLElement {
  const { node, body } = card("card-deliverables", "dash.card.deliverables");
  const limit = deliverableLimit(s.size);
  body.append(el("p", { className: "big", textContent: String(s.deliverables) }));
  if (limit === null) {
    body.append(live("p", { className: "meta" }, () => t("dash.delivNote", { min: DELIVERABLES_BANDS.L.min })));
    return node;
  }
  body.append(live("p", { className: "meta" }, () => t("dash.delivLimit", { size: s.size, limit })));
  const bar = el("div", { className: "segments" });
  bar.setAttribute("aria-hidden", "true");
  for (let i = 0; i < limit; i++) {
    bar.append(el("span", { className: i < s.deliverables ? "seg on" : "seg" }));
  }
  body.append(bar);
  if (s.deliverables > limit) {
    body.append(live("p", { className: "meta alert-text" }, () => t("dash.delivOver", { n: s.deliverables - limit })));
  }
  return node;
}

function alertCard(project: Project, alert: ScopeAlert): HTMLElement {
  if (!alert.alert) {
    const { node, body } = card("card-scope", "dash.card.scope");
    body.append(translate(el("p", { className: "big-line" }), "dash.within"));
    return node;
  }
  const { node, body } = card("card-scope", "dash.card.scope", ["card-alert"]);
  body.append(live("p", { id: "scope-alert", className: "alert-text", role: "alert" }, () => alertMessage(alert, project) ?? ""));
  return node;
}

function phasesCard(project: Project): HTMLElement {
  const { node, body } = card("card-phases", "dash.card.phases");
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
      live("p", { className: "meta" }, () => t("dash.phaseMeta", { done: c.done, open: c.open, cut: c.cut })),
    ]);
  });
  body.append(el("div", { className: "phase-list" }, rows));
  return node;
}

function historyCard(s: ProjectStatus): HTMLElement {
  // Full width, so it never sits alone in a row of the grid.
  const { node, body } = card("card-history", "dash.card.history", ["card-wide"]);
  if (s.historyRows.length === 0) {
    body.append(translate(el("p", { className: "hint" }), "dash.noHistory"));
    return node;
  }
  // Newest first.
  const rows = [...s.historyRows].reverse().map((c) =>
    el("li", { className: "activity-item" }, [
      el("p", { className: "act-head" }, [
        el("span", { className: "act-date ltr", textContent: ltr(c.date) }),
        el("span", { className: "act-change ltr", textContent: `${c.fromSize ?? "-"} → ${c.toSize}` }),
      ]),
      el("p", { className: "act-line" }, [
        translate(el("span", { className: "k" }), "dash.reason"),
        el("span", { className: "v", textContent: c.reason }),
      ]),
      el("p", { className: "act-line" }, [
        translate(el("span", { className: "k" }), "dash.itemsCut"),
        live("span", { className: "v" }, () => (c.itemsCutLabels.length ? c.itemsCutLabels.join(t("reasons.sep")) : t("dash.none"))),
      ]),
      el("p", { className: "act-line" }, [
        translate(el("span", { className: "k" }), "dash.approvedBy"),
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
    el("h2", { className: "dash-name", textContent: s.name, dir: "auto" }),
    el("p", { className: "pills" }, [
      live("span", { className: "pill" }, () => t("dash.pill.size", { size: s.size })),
      live("span", { className: "pill" }, () => trackName(s.track)),
    ]),
  ]);
  const grid = el("div", { className: "bento" }, [
    openItemsCard(project),
    sizeCard(s),
    deliverablesCard(s),
    alertCard(project, alert),
    phasesCard(project),
    historyCard(s),
  ]);
  root.replaceChildren(header, grid);
}
