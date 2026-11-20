import { mountIntakeForm } from "./form";
import { mountExisting } from "./existing";
import type { SaveFn } from "./dom";

export interface AppOptions {
  save?: SaveFn;
  today?: string;
}

/** Page with two tabs: New project and Existing project. */
export function mountApp(root: HTMLElement, opts: AppOptions = {}): void {
  const tabNew = document.createElement("button");
  const tabExisting = document.createElement("button");
  const panelNew = document.createElement("section");
  const panelExisting = document.createElement("section");

  const tabs: Array<[HTMLButtonElement, HTMLElement, string]> = [
    [tabNew, panelNew, "New project"],
    [tabExisting, panelExisting, "Existing project"],
  ];
  for (const [tab, panel, label] of tabs) {
    tab.type = "button";
    tab.textContent = label;
    tab.setAttribute("role", "tab");
    panel.setAttribute("role", "tabpanel");
  }

  function select(active: HTMLElement): void {
    for (const [tab, panel] of tabs) {
      const on = panel === active;
      tab.setAttribute("aria-selected", String(on));
      tab.classList.toggle("active", on);
      panel.hidden = !on;
    }
  }
  tabNew.addEventListener("click", () => select(panelNew));
  tabExisting.addEventListener("click", () => select(panelExisting));

  mountIntakeForm(panelNew, opts.save);
  mountExisting(panelExisting, { ...(opts.save ? { save: opts.save } : {}), ...(opts.today ? { today: opts.today } : {}) });
  select(panelNew);

  const tabBar = document.createElement("nav");
  tabBar.className = "tabs";
  tabBar.setAttribute("role", "tablist");
  tabBar.append(tabNew, tabExisting);

  const heading = document.createElement("h1");
  heading.textContent = "Nasaq";
  const lead = document.createElement("p");
  lead.className = "lead";
  lead.textContent = "Set up a project folder for brand, UI/UX or development work.";

  root.replaceChildren(heading, lead, tabBar, panelNew, panelExisting);
}
