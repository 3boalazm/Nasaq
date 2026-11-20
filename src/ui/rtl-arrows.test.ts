// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { arrowStep, choice, wireArrowKeys } from "./dom";

afterEach(() => {
  document.documentElement.dir = "";
  document.body.innerHTML = "";
});

describe("arrow keys follow the screen", () => {
  it("maps keys to steps: Left and Right swap in RTL, Up and Down stay", () => {
    expect(arrowStep("ArrowRight", false)).toBe(1);
    expect(arrowStep("ArrowLeft", false)).toBe(-1);
    expect(arrowStep("ArrowRight", true)).toBe(-1);
    expect(arrowStep("ArrowLeft", true)).toBe(1);
    expect(arrowStep("ArrowDown", true)).toBe(1);
    expect(arrowStep("ArrowUp", true)).toBe(-1);
    expect(arrowStep("Enter", true)).toBe(0);
  });

  function group(): HTMLElement {
    const g = document.createElement("fieldset");
    for (const v of ["a", "b", "c"]) g.append(choice("g", `g-${v}`, v, [v]));
    wireArrowKeys(g);
    document.body.append(g);
    return g;
  }
  const key = (node: HTMLElement, k: string): void => {
    node.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  };
  const checked = (g: HTMLElement): string => g.querySelector<HTMLInputElement>("input:checked")?.value ?? "";

  it("in LTR, ArrowRight moves to the next card", () => {
    const g = group();
    const first = g.querySelector<HTMLInputElement>("#g-a")!;
    first.checked = true;
    key(first, "ArrowRight");
    expect(checked(g)).toBe("b");
  });

  it("in RTL, ArrowLeft moves to the next card (the one on its left), and wraps around", () => {
    document.documentElement.dir = "rtl";
    const g = group();
    const last = g.querySelector<HTMLInputElement>("#g-c")!;
    last.checked = true;
    key(last, "ArrowLeft");
    expect(checked(g)).toBe("a");
    key(g.querySelector<HTMLInputElement>("#g-a")!, "ArrowRight");
    expect(checked(g)).toBe("c");
  });
});
