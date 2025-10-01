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

export const publishPackage = async (
  accessToken: string,
  extensionId: ExtensionId,
): Promise<void> => {
  const options = buildOptions(accessToken, extensionId);
  const response = await request<PublishResponse>(options);

  // Check for successful status values
  const successStatuses = ["OK", "ITEM_PENDING_REVIEW"];
  const hasSuccessStatus = response.data.status.some((status) =>
    successStatuses.includes(status)
  );

  if (hasSuccessStatus) {
    return;
  }

  throw new WebStoreError(
    "Failed to publish item",
    response.status,
    response.data,
  );
};
