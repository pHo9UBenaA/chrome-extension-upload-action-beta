import { GaxiosError, GaxiosOptions } from "npm:gaxios";

import type { PublishResponse } from "./interfaces.ts";
import type { ExtensionId } from "./types.ts";
import { WebStoreError } from "./error.ts";
import { requestWithRetry } from "./network.ts";

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

  try {
    const data = await requestWithRetry<PublishResponse>(options, {
      maxRetries: 3,
    });

    // Check for specific successful status values
    const successStatuses = ["OK", "ITEM_PENDING_REVIEW"];
    const hasSuccessStatus = data.status.some((status) =>
      successStatuses.includes(status)
    );

    if (hasSuccessStatus) {
      return;
    }

    throw new WebStoreError(
      "Failed to publish item",
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
      "Failed to publish item",
      status || 0,
      data,
    );
  }
};
