import { GaxiosOptions, request } from "npm:gaxios";

import type { PublishResponse } from "./interfaces.ts";
import type { ExtensionId } from "./types.ts";
import { WebStoreError } from "./error.ts";

const publishURI = (extensionId: ExtensionId) => {
  return `https://www.googleapis.com/chromewebstore/v1.1/items/${extensionId}/publish`;
};

const buildOptions = (
  accessToken: string,
  extensionId: ExtensionId,
): GaxiosOptions => {
  return {
    url: publishURI(extensionId),
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-goog-api-version": "2",
      "Content-Length": "0",
    },
  };
};

export const publish = async (
  accessToken: string,
  extensionId: ExtensionId,
): Promise<void> => {
  const options = buildOptions(accessToken, extensionId);
  const response = await request<PublishResponse>(options);

  if (response.data.status.includes("OK")) {
    return;
  }

  throw new WebStoreError(
    "Failed to publish item",
    response.status,
    response.data,
  );
};
