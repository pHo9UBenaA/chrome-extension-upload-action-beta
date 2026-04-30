/// <reference lib="deno.ns" />

import { GaxiosError, GaxiosOptions, request } from "gaxios";

import type { UploadResponse } from "./interfaces.ts";
import type { ExtensionId } from "./types.ts";
import { WebStoreError } from "./error.ts";
import { validateFilePath } from "./validation.ts";

const uploadURI = (extensionId: ExtensionId) => {
  return `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extensionId}`;
};

const buildOptions = async (
  accessToken: string,
  extensionId: ExtensionId,
  validatedPath: string,
): Promise<GaxiosOptions> => {
  const zipFile = await Deno.readFile(validatedPath);

  const options: GaxiosOptions = {
    url: uploadURI(extensionId),
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-goog-api-version": "2",
    },
    // Binary data must be included in the `body` instead of `data`
    body: zipFile,
  };

  return options;
};

export const uploadPackage = async (
  accessToken: string,
  extensionId: ExtensionId,
  zipFilePath: string,
): Promise<UploadResponse> => {
  // Validate file path before processing
  const validatedPath = validateFilePath(zipFilePath, Deno.cwd());
  const options = await buildOptions(accessToken, extensionId, validatedPath);

  try {
    const response = await request<UploadResponse>(options);

    if (response.data.uploadState === "SUCCESS") {
      return response.data;
    }

    throw new WebStoreError(
      "Failed to upload package",
      response.status,
      response.data,
    );
  } catch (error) {
    if (error instanceof WebStoreError) {
      throw error;
    }
    if (error instanceof GaxiosError) {
      throw new WebStoreError(
        `Network error: ${error.message}`,
        error.response?.status ?? 0,
        error.response?.data,
      );
    }
    throw error;
  }
};
