import { ZodError } from "zod";

export type ActionResult<T = void> =
  | {
      success: true;
      data?: T;
      message?: string;
    }
  | {
      success: false;
      error: string;
      fieldErrors?: Record<string, string[]>;
    };

/**
 * Transforms a ZodError into a clean fieldErrors record mapping field names to array of error messages.
 */
export function formatZodErrors(error: ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!fieldErrors[path]) {
      fieldErrors[path] = [];
    }
    fieldErrors[path].push(issue.message);
  }
  return fieldErrors;
}
