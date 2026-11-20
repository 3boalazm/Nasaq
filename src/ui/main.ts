import "./style.css";
import { mountApp } from "./app";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app element is missing");
mountApp(root);
