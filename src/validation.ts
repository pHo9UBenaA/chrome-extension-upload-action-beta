import { resolve } from "jsr:@std/path";

import type { ExtensionId } from "./types.ts";

/**
 * Validates Chrome extension ID format
 */
export const validateExtensionId = (id: string): ExtensionId => {
  const trimmed = id.trim();
  if (!/^[a-z]{32}$/.test(trimmed)) {
    throw new Error(
      "Invalid extension ID format. Must be 32 lowercase letters.",
    );
  }
  return trimmed as ExtensionId;
};

/**
 * Validates file path is within workspace and is a .zip file
 */
export const validateFilePath = (filePath: string, cwd: string): string => {
  const resolved = resolve(cwd, filePath);

  if (!resolved.startsWith(cwd)) {
    throw new Error("File path must be within workspace");
  }

  if (!resolved.endsWith(".zip")) {
    throw new Error("File must be a .zip file");
  }

  return resolved;
};
