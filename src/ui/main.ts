// Tokens first: style.css uses the variables they define.
import "./tokens.css";
import "./style.css";
import { mountApp } from "./app";
import { initLanguage } from "./i18n";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app element is missing");
initLanguage();
mountApp(root);
