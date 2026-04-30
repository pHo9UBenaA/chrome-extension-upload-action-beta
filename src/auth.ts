import { GaxiosError, GaxiosOptions, request } from "gaxios";

import type { AccessTokenResponse } from "./interfaces.ts";
import { WebStoreError } from "./error.ts";

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
    const response = await request<AccessTokenResponse>(options);

    if (response.status === 200) {
      return response.data;
    }

    throw new WebStoreError(
      "Failed to get access token",
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
