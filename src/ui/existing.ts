import { readProjectYamlCoded } from "../core/readProject";
import { MAX_PROJECT_YAML_BYTES } from "../core/thresholds";
import { todayIso } from "../core/intake";
import type { Project } from "../core/types";
import { el, saveBlob, type SaveFn } from "./dom";
import { mountStatus } from "./status";
import { mountRescope } from "./rescope";
import { errorText, onLanguageChange, t, translate } from "./i18n";

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
  /** The current error, as a function so it can be shown again in the new language. */
  let errorMessage: (() => string) | null = null;
  const renderError = (): void => {
    uploadError.textContent = errorMessage ? errorMessage() : "";
  };
  onLanguageChange(renderError);
  const upload = el("input", { id: "up-file", type: "file", accept: ".yml,.yaml" });
  const body = el("div", { id: "existing-body" });

  // The drop zone is a large card around the real file input. After a good upload it shrinks to a compact row.
  const dropZone = el("div", { className: "dropzone card", id: "up-zone" }, [
    translate(el("h2", { className: "card-head" }), "existing.uploadTitle"),
    translate(el("p", { className: "hint" }), "existing.uploadHint"),
    translate(el("label", { htmlFor: "up-file", className: "dropzone-label" }), "existing.fileLabel"),
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

  function fail(message: () => string): void {
    errorMessage = message;
    renderError();
    body.replaceChildren();
  }

  async function load(file: File | undefined): Promise<void> {
    errorMessage = null;
    renderError();
    if (!file) return;
    // Refuse oversized files before reading them into memory.
    if (file.size > MAX_PROJECT_YAML_BYTES) {
      fail(() => errorText("too-large"));
      return;
    }
    let text: string;
    try {
      text = await readFileText(file);
    } catch {
      fail(() => t("existing.readFail"));
      return;
    }
    const result = readProjectYamlCoded(text);
    if (!result.ok) {
      fail(() => errorText(result.code, result.params));
      return;
    }
    try {
      show(result.project);
    } catch {
      fail(() => t("existing.showFail"));
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

  root.replaceChildren(translate(el("h2", { className: "section-title" }), "tab.existing"), dropZone, uploadError, body);
}
