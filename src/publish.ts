import { GaxiosError, request } from "npm:gaxios";
import { WebStoreError } from "./errors.ts";
import type { AccessTokenResponse, PublishResponse } from "./interfaces.ts";
import type { ExtensionId } from "./types.ts";

export const publish = async (
  accessToken: AccessTokenResponse,
  extensionId: ExtensionId,
): Promise<void> => {
  try {
    const response = await request<PublishResponse>({
      url:
        `https://www.googleapis.com/chromewebstore/v1.1/items/${extensionId}/publish`,
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-goog-api-version": "2",
        "Content-Length": "0",
      },
    });

    if (!response.data.status.includes("OK")) {
      throw new WebStoreError(
        "Failed to publish item",
        response.status,
        response.data,
      );
    }
  } catch (error) {
    if (error instanceof GaxiosError) {
      throw new WebStoreError(
        "Failed to publish item",
        error.response?.status || 500,
        error.response?.data,
      );
    }
    throw error;
  }
};
