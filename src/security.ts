/**
 * Security utilities for input validation and error sanitization
 */

const SENSITIVE_PATTERNS = [
  /Bearer\s+[\w-]+\.[\w-]+\.[\w-]+/gi, // JWT tokens
  /(?:client_secret|refresh_token|access_token)[\s:=]+[\w-]+/gi,
  /(?:api[_-]?key|apikey)[\s:=]+[\w-]+/gi,
];

const MAX_ERROR_DETAIL_LENGTH = 200;

/**
 * Sanitizes error details to prevent information leakage
 * Removes sensitive tokens and limits detail length
 */
export const sanitizeErrorDetails = (details: unknown): string => {
  let sanitized: string;

  if (details === null || details === undefined) {
    return "No details available";
  }

  if (typeof details === "string") {
    sanitized = details;
  } else if (typeof details === "object") {
    try {
      sanitized = JSON.stringify(details, null, 2);
    } catch {
      return "Error details could not be serialized";
    }
  } else {
    sanitized = String(details);
  }

  // Remove sensitive patterns
  for (const pattern of SENSITIVE_PATTERNS) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  // Truncate if too long
  if (sanitized.length > MAX_ERROR_DETAIL_LENGTH) {
    sanitized = sanitized.substring(0, MAX_ERROR_DETAIL_LENGTH) + "...";
  }

  return sanitized;
};

/**
 * Formats error message for logging without exposing sensitive data
 */
export const formatSecureErrorMessage = (
  baseMessage: string,
  code?: number,
  details?: unknown,
): string => {
  const parts = [baseMessage];

  if (code !== undefined) {
    parts.push(`Code: ${code}`);
  }

  if (details !== undefined) {
    parts.push(`Details: ${sanitizeErrorDetails(details)}`);
  }

  return parts.join(". ");
};
