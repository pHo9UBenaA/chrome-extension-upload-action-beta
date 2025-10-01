/// <reference lib="deno.ns" />

import { GaxiosOptions, request } from "npm:gaxios";

import type { UploadResponse } from "./interfaces.ts";
import type { ExtensionId } from "./types.ts";
import { WebStoreError } from "./error.ts";

const uploadURI = (extensionId: ExtensionId) => {
  return `https://www.googleapis.com/upload/chromewebstore/v1.1/items/${extensionId}`;
};

const buildOptions = async (
  accessToken: string,
  extensionId: ExtensionId,
  zipFilePath: string,
): Promise<GaxiosOptions> => {
  const zipFile = await Deno.readFile(zipFilePath);

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
): Promise<void> => {
  const options = await buildOptions(accessToken, extensionId, zipFilePath);
  const response = await request<UploadResponse>(options);

  if (response.data.uploadState === "SUCCESS") {
    return;
  }

  throw new WebStoreError(
    "Failed to upload package",
    response.status,
    response.data,
  );
};
