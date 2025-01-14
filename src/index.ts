import "jsr:@std/dotenv/load";
import * as core from "npm:@actions/core";
import { getAccessToken } from "./auth.ts";
import { WebStoreError } from "./errors.ts";
import type { AccessTokenRequestBody } from "./interfaces.ts";
import { publish } from "./publish.ts";
import type { ExtensionId } from "./types.ts";
import { uploadPackage } from "./upload.ts";

const MissingEnvironmentErrorMessage = "Missing required environment variables";

const getAccessTokenRequestBody = (): AccessTokenRequestBody => {
  const clientId = Deno.env.get("CLIENT_ID");
  const clientSecret = Deno.env.get("CLIENT_SECRET");
  const refreshToken = Deno.env.get("REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error(MissingEnvironmentErrorMessage);
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    grant_type: "refresh_token",
  };
};

const getExtensionId = (): ExtensionId => {
  const extensionId = Deno.env.get("EXTENSION_ID");

  if (!extensionId) {
    throw new Error(MissingEnvironmentErrorMessage);
  }

  return extensionId as ExtensionId;
};

const getFilePath = (): string => {
  const filePath = Deno.env.get("FILE_PATH");

  if (!filePath) {
    throw new Error(MissingEnvironmentErrorMessage);
  }

  return filePath;
};

const getShouldPublish = (): boolean => {
  const shouldPublish = Deno.env.get("PUBLISH");

  if (!shouldPublish) {
    throw new Error(MissingEnvironmentErrorMessage);
  }

  return shouldPublish === "true" ? true : false;
};

const main = async () => {
  const requestBody = getAccessTokenRequestBody();

  try {
    const accessToken = await getAccessToken(requestBody);
    const extensionId = getExtensionId();
    const filePath = getFilePath();
    const shouldPublish = getShouldPublish();

    core.info("Uploading package...");
    await uploadPackage(accessToken, extensionId, filePath);
    core.info("Package uploaded successfully!");

    if (!shouldPublish) {
      core.info("Skipping publication as --publish flag was not provided.");
      return;
    }

    core.info("Publishing...");
    await publish(accessToken, extensionId);
    core.info("Published successfully!");
  } catch (error) {
    if (error instanceof WebStoreError) {
      core.setFailed(
        `Unexpected error during deployment: ${error.message}. Code: ${error.code}. Details: ${
          JSON.stringify(error.details)
        }`,
      );
      return;
    }

    core.setFailed(
      `Unexpected error during deployment: ${JSON.stringify(error)}`,
    );
  }
};

main();
