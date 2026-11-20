import { readProjectYaml, TOO_LARGE_MESSAGE } from "../core/readProject";
import { MAX_PROJECT_YAML_BYTES } from "../core/thresholds";
import { todayIso } from "../core/intake";
import type { Project } from "../core/types";
import { el, saveBlob, type SaveFn } from "./dom";
import { mountStatus } from "./status";
import { mountRescope } from "./rescope";

export interface ExistingOptions {
  save?: SaveFn;
  /** Fixed "today" for tests. Defaults to the local date. */
  today?: string;
}

/** Reads an uploaded File as text. Uses File.text() when present, else FileReader. */
export function readFileText(file: Blob): Promise<string> {
  if (typeof file.text === "function") return file.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

/** "Existing project" panel: upload project.yml, see the dashboard, rescope. */
export function mountExisting(root: HTMLElement, opts: ExistingOptions = {}): void {
  const save = opts.save ?? saveBlob;
  const today = opts.today ?? todayIso();
  const uploadError = el("p", { id: "up-error", className: "errors", role: "alert" });
  const upload = el("input", { id: "up-file", type: "file", accept: ".yml,.yaml" });
  const body = el("div", { id: "existing-body" });

  // The drop zone is a large card around the real file input. After a good upload it shrinks to a compact row.
  const dropZone = el("div", { className: "dropzone card", id: "up-zone" }, [
    el("h2", { className: "card-head", textContent: "Upload project.yml" }),
    el("p", { className: "hint", textContent: "Choose the project.yml from your project folder. Nothing is stored in the browser." }),
    el("label", { htmlFor: "up-file", className: "dropzone-label", textContent: "project.yml" }),
    upload,
  ]);

  function show(project: Project): void {
    dropZone.classList.add("compact");
    const statusBox = el("div", { id: "status-box", className: "dashboard" });
    const rescopeBox = el("div", { id: "rescope-box", className: "card card-wide" });
    body.replaceChildren(statusBox, rescopeBox);
    mountStatus(statusBox, project, today);
    mountRescope(rescopeBox, project, {
      save,
      today,
      onRescoped: (next) => show(next),
    });
  }

  function fail(message: string): void {
    uploadError.textContent = message;
    body.replaceChildren();
  }

  async function load(file: File | undefined): Promise<void> {
    uploadError.textContent = "";
    if (!file) return;
    // Refuse oversized files before reading them into memory.
    if (file.size > MAX_PROJECT_YAML_BYTES) {
      fail(TOO_LARGE_MESSAGE);
      return;
    }
    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      fail("The file could not be read. Choose the project.yml again.");
      return;
    }
    const result = readProjectYaml(text);
    if (!result.ok) {
      fail(result.error);
      return;
    }
    try {
      show(result.project);
    } catch {
      fail("This project.yml could not be shown. Check that it came from Nasaq.");
    }
  }

  upload.addEventListener("change", () => void load(upload.files?.[0]));

  // Dropping a project.yml on the card works the same as choosing it.
  dropZone.addEventListener("dragover", (e) => e.preventDefault());
  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    const dropped = e.dataTransfer?.files;
    if (!dropped || dropped.length === 0) return;
    void load(dropped[0]);
  });

  root.replaceChildren(el("h2", { className: "section-title", textContent: "Existing project" }), dropZone, uploadError, body);
}
