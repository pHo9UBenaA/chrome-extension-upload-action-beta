/// <reference lib="deno.ns" />

import { assertEquals, assertThrows } from "jsr:@std/assert";

import { validateExtensionId } from "./validation.ts";
import { WebStoreError } from "./error.ts";

// validateExtensionId tests

Deno.test("validateExtensionId - valid ID (32 lowercase letters)", () => {
  const result = validateExtensionId("abcdefghijklmnopqrstuvwxyzabcdef");
  assertEquals(result, "abcdefghijklmnopqrstuvwxyzabcdef");
});

Deno.test("validateExtensionId - valid ID with whitespace trimmed", () => {
  const result = validateExtensionId("  abcdefghijklmnopqrstuvwxyzabcdef  ");
  assertEquals(result, "abcdefghijklmnopqrstuvwxyzabcdef");
});

Deno.test("validateExtensionId - invalid: too short", () => {
  assertThrows(
    () => validateExtensionId("abc"),
    Error,
    "Invalid extension ID format",
  );
});

Deno.test("validateExtensionId - invalid: too long", () => {
  assertThrows(
    () => validateExtensionId("abcdefghijklmnopqrstuvwxyzabcdefg"),
    Error,
    "Invalid extension ID format",
  );
});

Deno.test("validateExtensionId - invalid: uppercase letters", () => {
  assertThrows(
    () => validateExtensionId("ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEF"),
    Error,
    "Invalid extension ID format",
  );
});

Deno.test("validateExtensionId - invalid: contains numbers", () => {
  assertThrows(
    () => validateExtensionId("abcdefghijklmnopqrstuvwxyz123456"),
    Error,
    "Invalid extension ID format",
  );
});

Deno.test("validateExtensionId - invalid: empty string", () => {
  assertThrows(
    () => validateExtensionId(""),
    Error,
    "Invalid extension ID format",
  );
});

// WebStoreError tests

Deno.test("WebStoreError - stores message, code, and details", () => {
  const details = { error: "test error", info: { key: "value" } };
  const error = new WebStoreError("Upload failed", 400, details);

  assertEquals(error.message, "Upload failed");
  assertEquals(error.code, 400);
  assertEquals(error.details, details);
  assertEquals(error.name, "WebStoreError");
});

Deno.test("WebStoreError - is instance of Error", () => {
  const error = new WebStoreError("Test", 500, null);
  assertEquals(error instanceof Error, true);
  assertEquals(error instanceof WebStoreError, true);
});
