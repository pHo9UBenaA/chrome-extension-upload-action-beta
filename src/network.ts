/**
 * Network utilities for retry logic and timeout configuration
 */

import { GaxiosError, GaxiosOptions, request } from "npm:gaxios";

const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds
const RETRY_MULTIPLIER = 2;

// Retryable HTTP status codes
const RETRYABLE_STATUS_CODES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
];

type RetryOptions = {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  multiplier?: number;
};

/**
 * Adds timeout configuration to request options
 */
export const withTimeout = (
  options: GaxiosOptions,
  timeout: number = DEFAULT_TIMEOUT,
): GaxiosOptions => {
  return {
    ...options,
    timeout,
    retry: false, // Disable built-in retry to use our custom logic
  };
};

/**
 * Determines if an error is retryable
 */
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof GaxiosError) {
    // Check for network errors
    if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT") {
      return true;
    }

    // Check for retryable status codes
    if (
      error.response?.status &&
      RETRYABLE_STATUS_CODES.includes(error.response.status)
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Calculates the delay for exponential backoff
 */
const calculateRetryDelay = (
  attemptNumber: number,
  options: RetryOptions,
): number => {
  const {
    initialDelay = INITIAL_RETRY_DELAY,
    maxDelay = MAX_RETRY_DELAY,
    multiplier = RETRY_MULTIPLIER,
  } = options;

  const delay = Math.min(
    initialDelay * Math.pow(multiplier, attemptNumber),
    maxDelay,
  );

  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.3 * delay;

  return Math.floor(delay + jitter);
};

/**
 * Performs a request with retry logic and exponential backoff
 */
export const requestWithRetry = async <T>(
  options: GaxiosOptions,
  retryOptions?: RetryOptions,
): Promise<T> => {
  const maxRetries = retryOptions?.maxRetries ?? MAX_RETRIES;
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await request<T>(withTimeout(options));
      return response.data;
    } catch (error) {
      lastError = error;

      // Don't retry if it's the last attempt or not retryable
      if (attempt === maxRetries || !isRetryableError(error)) {
        break;
      }

      const delay = calculateRetryDelay(attempt, retryOptions || {});
      console.log(
        `Request failed, retrying in ${delay}ms (attempt ${
          attempt + 1
        }/${maxRetries})`,
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};
