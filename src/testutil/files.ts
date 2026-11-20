// Reads files from the repository for tests. Uses the built-in fs module through process.getBuiltinModule,
// as the layout and contrast tests do, so no Node type package is needed.

interface NodeFs {
  readFileSync(path: URL, encoding: "utf8"): string;
  readdirSync(path: URL): string[];
  existsSync(path: URL): boolean;
  statSync(path: URL): { size: number };
}

const nodeProcess = (globalThis as { process?: { getBuiltinModule?: (id: string) => unknown } }).process;
const fs = nodeProcess?.getBuiltinModule?.("node:fs") as NodeFs | undefined;

function need(): NodeFs {
  if (!fs) throw new Error("node:fs is not available in this test environment");
  return fs;
}

/** Text of a file, given a URL relative to the calling test module. */
export function readText(url: URL): string {
  return need().readFileSync(url, "utf8");
}

export function listDir(url: URL): string[] {
  return need().readdirSync(url);
}

export function exists(url: URL): boolean {
  return need().existsSync(url);
}

export function sizeOf(url: URL): number {
  return need().statSync(url).size;
}
