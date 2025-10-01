/// <reference lib="deno.ns" />

import { GaxiosError, GaxiosOptions } from "npm:gaxios";

import type { UploadResponse } from "./interfaces.ts";
import type { ExtensionId } from "./types.ts";
import { WebStoreError } from "./error.ts";
import { validateFilePath } from "./validation.ts";
import { requestWithRetry } from "./network.ts";

const uploadURI = (extensionId: ExtensionId) => {
  return `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extensionId}`;
};

const buildOptions = async (
  accessToken: string,
  extensionId: ExtensionId,
  zipFilePath: string,
): Promise<GaxiosOptions> => {
  // Validate file path before reading
  const validationResult = await validateFilePath(zipFilePath);
  if (!validationResult.ok) {
    throw new Error(`File validation failed: ${validationResult.error}`);
  }

  const zipFile = await Deno.readFile(validationResult.data);

  const options: GaxiosOptions = {
    url: uploadURI(extensionId),
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-goog-api-version": "2",
    },
    // バイナリデータのため`data`ではなく`body`に含める
    body: zipFile,
  };

  return options;
};

export const uploadPackage = async (
  accessToken: string,
  extensionId: ExtensionId,
  zipFilePath: string,
): Promise<void> => {
  const options = await buildOptions(accessToken, extensionId, zipFilePath);

  try {
    const data = await requestWithRetry<UploadResponse>(options, {
      maxRetries: 3,
    });

    if (data.uploadState === "SUCCESS") {
      return;
    }

    throw new WebStoreError(
      "Failed to upload package",
      400,
      data,
    );
  } catch (error) {
    if (error instanceof WebStoreError) {
      throw error;
    }

    const status = error instanceof GaxiosError
      ? error.response?.status
      : undefined;
    const data = error instanceof GaxiosError
      ? error.response?.data
      : error instanceof Error
      ? error.message
      : "Unknown error";

    throw new WebStoreError(
      "Failed to upload package",
      status || 0,
      data,
    );
  }
};
