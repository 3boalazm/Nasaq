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

export function field(id: string, labelText: string, control: HTMLElement, hint?: string): HTMLElement {
  const label = el("label", { htmlFor: id }, [labelText]);
  const children: Array<Node | string> = [label, control];
  if (hint) children.push(el("small", { className: "hint" }, [hint]));
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
