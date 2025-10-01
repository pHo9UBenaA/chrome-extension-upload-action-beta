/**
 * Input validation utilities
 */

import { resolve } from "jsr:@std/path";

const EXTENSION_ID_REGEX = /^[a-z]{32}$/;
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_FILE_EXTENSIONS = [".zip", ".crx"];

type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

/**
 * Validates Chrome extension ID format
 */
export const validateExtensionId = (id: string): ValidationResult<string> => {
  if (!id || typeof id !== "string") {
    return { ok: false, error: "Extension ID is required" };
  }

  const trimmed = id.trim();

  if (!EXTENSION_ID_REGEX.test(trimmed)) {
    return {
      ok: false,
      error: "Invalid extension ID format. Must be 32 lowercase letters",
    };
  }

  return { ok: true, data: trimmed };
};

/**
 * Validates and sanitizes file path to prevent traversal attacks
 */
export const validateFilePath = async (
  filePath: string,
  workingDir?: string,
): Promise<ValidationResult<string>> => {
  if (!filePath || typeof filePath !== "string") {
    return { ok: false, error: "File path is required" };
  }

  try {
    // Resolve to absolute path
    const absolutePath = resolve(workingDir || Deno.cwd(), filePath);

    // Check if file exists
    const fileInfo = await Deno.stat(absolutePath);

    if (!fileInfo.isFile) {
      return { ok: false, error: "Path is not a file" };
    }

    // Check file size
    if (fileInfo.size > MAX_FILE_SIZE) {
      return {
        ok: false,
        error:
          `File size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`,
      };
    }

    // Check file extension
    const hasValidExtension = ALLOWED_FILE_EXTENSIONS.some((ext) =>
      absolutePath.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      return {
        ok: false,
        error: `Invalid file type. Allowed extensions: ${
          ALLOWED_FILE_EXTENSIONS.join(", ")
        }`,
      };
    }

    return { ok: true, data: absolutePath };
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      return { ok: false, error: "File not found" };
    }
    if (error instanceof Deno.errors.PermissionDenied) {
      return { ok: false, error: "Permission denied to access file" };
    }
    return { ok: false, error: "Failed to validate file path" };
  }
};

/**
 * Validates OAuth credentials format (basic validation)
 */
export const validateOAuthCredentials = (
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): ValidationResult<
  { clientId: string; clientSecret: string; refreshToken: string }
> => {
  if (!clientId || !clientSecret || !refreshToken) {
    return { ok: false, error: "All OAuth credentials are required" };
  }

  if (
    clientId.length < 10 || clientSecret.length < 10 || refreshToken.length < 10
  ) {
    return { ok: false, error: "Invalid OAuth credential format" };
  }

  return {
    ok: true,
    data: { clientId, clientSecret, refreshToken },
  };
};
