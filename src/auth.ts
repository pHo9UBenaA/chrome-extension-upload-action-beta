import { GaxiosError, request } from "npm:gaxios";
import { WebStoreError } from "./errors.ts";
import type {
  AccessTokenRequestBody,
  AccessTokenResponse,
} from "./interfaces.ts";

export const getAccessToken = async (
  body: AccessTokenRequestBody,
): Promise<AccessTokenResponse> => {
  try {
    const response = await request<AccessTokenResponse>({
      url: "https://accounts.google.com/o/oauth2/token",
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: new URLSearchParams({ ...body }).toString(),
    });

    return response.data;
  } catch (error) {
    if (error instanceof GaxiosError) {
      throw new WebStoreError(
        "Failed to get access token",
        error.response?.status || 500,
        error.response?.data,
      );
    }
    throw error;
  }
};
