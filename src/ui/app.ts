import { mountIntakeForm } from "./form";
import { mountExisting } from "./existing";
import { el, type SaveFn } from "./dom";
import { bind, lang, resetBindings, setLanguage, t, translate, type Lang } from "./i18n";

export interface AppOptions {
  save?: SaveFn;
  today?: string;
}

const LANGS: readonly Lang[] = ["en", "ar"];

/** Page with the language switch, two tabs (New project and Existing project), and their panels. */
export function mountApp(root: HTMLElement, opts: AppOptions = {}): void {
  resetBindings();
  const tabNew = el("button", { type: "button" });
  const tabExisting = el("button", { type: "button" });
  const panelNew = el("section");
  const panelExisting = el("section");

  const tabs: Array<[HTMLButtonElement, HTMLElement, "tab.new" | "tab.existing"]> = [
    [tabNew, panelNew, "tab.new"],
    [tabExisting, panelExisting, "tab.existing"],
  ];
  for (const [tab, panel, key] of tabs) {
    translate(tab, key);
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

  // Language switch: a button group. The pressed button is the current language.
  const langButtons = LANGS.map((code) => {
    const button = el("button", { type: "button", className: "secondary lang-pill", lang: code });
    translate(button, code === "en" ? "lang.en" : "lang.ar");
    bind(() => button.setAttribute("aria-pressed", String(lang() === code)));
    button.addEventListener("click", () => setLanguage(code));
    return button;
  });
  const langGroup = el("div", { className: "lang-switch" }, langButtons);
  langGroup.setAttribute("role", "group");
  bind(() => langGroup.setAttribute("aria-label", t("lang.group")));

  const tabBar = el("nav", { className: "tabs" });
  tabBar.setAttribute("role", "tablist");
  tabBar.append(tabNew, tabExisting);

  const heading = translate(el("h1"), "app.name");
  const lead = translate(el("p", { className: "lead" }), "app.lead");
  const top = el("header", { className: "top" }, [heading, langGroup]);

  root.replaceChildren(top, lead, tabBar, panelNew, panelExisting);
}
