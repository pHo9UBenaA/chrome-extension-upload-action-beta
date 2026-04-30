/// <reference lib="deno.ns" />

import { assertEquals, assertThrows } from "@std/assert";

import { validateExtensionId, validateFilePath } from "./validation.ts";
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

// validateFilePath tests

Deno.test("validateFilePath - valid .zip file in workspace", () => {
  const cwd = Deno.cwd();
  const result = validateFilePath("./test.zip", cwd);
  assertEquals(result.endsWith("test.zip"), true);
});

Deno.test("validateFilePath - valid nested .zip file", () => {
  const cwd = Deno.cwd();
  const result = validateFilePath("./dist/extension.zip", cwd);
  assertEquals(result.endsWith("extension.zip"), true);
});

Deno.test("validateFilePath - invalid: not a .zip file", () => {
  const cwd = Deno.cwd();
  assertThrows(
    () => validateFilePath("./test.tar.gz", cwd),
    Error,
    "File must be a .zip file",
  );
});

Deno.test("validateFilePath - invalid: outside workspace", () => {
  const cwd = Deno.cwd();
  assertThrows(
    () => validateFilePath("/etc/passwd", cwd),
    Error,
    "File path must be within workspace",
  );
});

Deno.test("validateFilePath - invalid: path traversal attempt", () => {
  const cwd = Deno.cwd();
  assertThrows(
    () => validateFilePath("../../../etc/passwd.zip", cwd),
    Error,
    "File path must be within workspace",
  );
});
