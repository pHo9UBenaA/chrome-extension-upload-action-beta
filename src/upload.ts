/// <reference lib="deno.ns" />

import { GaxiosError, request } from "npm:gaxios";
import { WebStoreError } from "./errors.ts";
import type { AccessTokenResponse, UploadResponse } from "./interfaces.ts";
import type { ExtensionId } from "./types.ts";

export const uploadPackage = async (
  accessToken: AccessTokenResponse,
  extensionId: ExtensionId,
  zipFilePath: string,
): Promise<void> => {
  const zipFile = await Deno.readFile(zipFilePath);

  try {
    const response = await request<UploadResponse>({
      url:
        `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extensionId}`,
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken.access_token}`,
        "x-goog-api-version": "2",
      },
      body: zipFile,
    });

    if (response.data.uploadState !== "SUCCESS") {
      throw new WebStoreError(
        "Failed to upload package",
        response.status,
        response.data,
      );
    }
  } catch (error) {
    if (error instanceof GaxiosError) {
      throw new WebStoreError(
        "Failed to upload package",
        error.response?.status || 500,
        error.response?.data,
      );
    }
    throw error;
  }
};
