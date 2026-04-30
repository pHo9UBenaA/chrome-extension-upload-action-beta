/// <reference lib="deno.ns" />

import { assertEquals, assertThrows } from "jsr:@std/assert";

import { validateExtensionId } from "./validation.ts";

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
