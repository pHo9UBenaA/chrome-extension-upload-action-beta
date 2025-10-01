import { GaxiosError, GaxiosOptions } from "npm:gaxios";

import type { AccessTokenResponse } from "./interfaces.ts";
import { WebStoreError } from "./error.ts";
import { requestWithRetry } from "./network.ts";

const TokenURI = "https://accounts.google.com/o/oauth2/token";

const buildOptions = (
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): GaxiosOptions => {
  const data = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  }).toString();

  return {
    url: TokenURI,
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data,
  };
};

export const requestAccessToken = async (
  clientId: string,
  clientSecret: string,
  refreshToken: string,
): Promise<AccessTokenResponse> => {
  const options = buildOptions(clientId, clientSecret, refreshToken);

  try {
    const data = await requestWithRetry<AccessTokenResponse>(options, {
      maxRetries: 2, // Fewer retries for auth requests
    });
    return data;
  } catch (error) {
    const status = error instanceof GaxiosError
      ? error.response?.status
      : undefined;
    const data = error instanceof GaxiosError
      ? error.response?.data
      : error instanceof Error
      ? error.message
      : "Unknown error";

    throw new WebStoreError(
      "Failed to get access token",
      status || 0,
      data,
    );
  }
};
