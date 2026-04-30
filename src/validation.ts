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
