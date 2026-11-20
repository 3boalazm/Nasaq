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
