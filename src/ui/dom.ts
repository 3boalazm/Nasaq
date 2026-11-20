import { translate } from "./i18n";
import type { MessageKey } from "./i18n/en";

/** Small helpers for building DOM without innerHTML. */

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  children: Array<Node | string> = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}

/** A labelled control. The label (and optional hint) are message keys, so they follow the language. */
export function field(id: string, labelKey: MessageKey, control: HTMLElement, hintKey?: MessageKey): HTMLElement {
  const label = translate(el("label", { htmlFor: id }), labelKey);
  const children: Array<Node | string> = [label, control];
  if (hintKey) children.push(translate(el("small", { className: "hint" }), hintKey));
  return el("div", { className: "field" }, children);
}

/** Downloads a Blob through a temporary link. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export type SaveFn = (blob: Blob, filename: string) => void;

/**
 * A selection card: a real radio input with the card as its label. Arrow keys work because the
 * radios share a name. `children` is the card content; the label text is the card's accessible name.
 */
export function choice(name: string, id: string, value: string, children: Array<Node | string>, className = ""): HTMLLabelElement {
  const input = el("input", { type: "radio", name, id, value });
  return el("label", { className: `choice ${className}`.trim(), htmlFor: id }, [input, ...children]);
}

/** The value of the checked radio in a group named `name`, or "" when none is checked. */
export function checkedValue(root: ParentNode, name: string): string {
  return root.querySelector<HTMLInputElement>(`input[name="${name}"]:checked`)?.value ?? "";
}

/** Sets the radio in a group by value. Does not fire events. */
export function setChecked(root: ParentNode, name: string, value: string): void {
  for (const radio of Array.from(root.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`))) {
    radio.checked = radio.value === value;
  }
}

/**
 * Steps for an arrow key inside a radio group: +1 next, -1 previous, 0 for other keys.
 * Up and Down keep their order. Left and Right follow the screen: in Arabic (RTL) the first card is on the right.
 */
export function arrowStep(key: string, rtl: boolean): number {
  switch (key) {
    case "ArrowDown":
      return 1;
    case "ArrowUp":
      return -1;
    case "ArrowRight":
      return rtl ? -1 : 1;
    case "ArrowLeft":
      return rtl ? 1 : -1;
    default:
      return 0;
  }
}

/** Makes arrow keys move between the radios of a group (wrapping), and select the one reached. */
export function wireArrowKeys(group: HTMLElement): void {
  group.addEventListener("keydown", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.type !== "radio") return;
    const step = arrowStep(event.key, document.documentElement.dir === "rtl");
    if (step === 0) return;
    const radios = Array.from(group.querySelectorAll<HTMLInputElement>('input[type="radio"]:not(:disabled)'));
    const index = radios.indexOf(target);
    if (index < 0) return;
    event.preventDefault();
    const next = radios[(index + step + radios.length) % radios.length]!;
    next.checked = true;
    next.focus();
    next.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
