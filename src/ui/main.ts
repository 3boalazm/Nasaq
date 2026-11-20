import "./style.css";
import { mountIntakeForm } from "./form";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("#app element is missing");
mountIntakeForm(root);
