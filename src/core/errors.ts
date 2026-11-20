/** Values a translated message can use, such as a field name or a size. */
export type ErrorParams = Readonly<Record<string, string | number>>;

/**
 * An error with a stable code. The page translates by code (src/ui/i18n) and never shows the English
 * message. The message stays for tests and logs, and its wording does not change.
 */
export class CodedError extends Error {
  readonly code: string;
  readonly params: ErrorParams;

  constructor(code: string, message: string, params: ErrorParams = {}) {
    super(message);
    this.name = "CodedError";
    this.code = code;
    this.params = params;
  }
}
