import "jsr:@std/dotenv/load";
import * as core from "npm:@actions/core";

import { requestAccessToken } from "./auth.ts";
import { publishPackage } from "./publish.ts";
import type { ExtensionId } from "./types.ts";
import { uploadPackage } from "./upload.ts";
import { WebStoreError } from "./error.ts";
import { formatSecureErrorMessage } from "./security.ts";
import {
  validateExtensionId,
  validateFilePath,
  validateOAuthCredentials,
} from "./validation.ts";

const loadEnv = async () => {
  const clientId = Deno.env.get("CLIENT_ID");
  const clientSecret = Deno.env.get("CLIENT_SECRET");
  const refreshToken = Deno.env.get("REFRESH_TOKEN");
  const extensionId = Deno.env.get("EXTENSION_ID");
  const filePath = Deno.env.get("FILE_PATH");
  const shouldPublish = Deno.env.get("PUBLISH") === "true";

  if (
    !clientId || !clientSecret || !refreshToken || !extensionId ||
    !filePath || shouldPublish === undefined
  ) {
    throw new Error("Missing required environment variables");
  }

  // Validate OAuth credentials
  const credentialsResult = validateOAuthCredentials(
    clientId,
    clientSecret,
    refreshToken,
  );
  if (!credentialsResult.ok) {
    throw new Error(`Invalid credentials: ${credentialsResult.error}`);
  }

  // Validate extension ID
  const extensionIdResult = validateExtensionId(extensionId);
  if (!extensionIdResult.ok) {
    throw new Error(`Invalid extension ID: ${extensionIdResult.error}`);
  }

  // Validate file path
  const filePathResult = await validateFilePath(filePath);
  if (!filePathResult.ok) {
    throw new Error(`Invalid file path: ${filePathResult.error}`);
  }

  return {
    clientId: credentialsResult.data.clientId,
    clientSecret: credentialsResult.data.clientSecret,
    refreshToken: credentialsResult.data.refreshToken,
    extensionId: extensionIdResult.data as ExtensionId,
    filePath: filePathResult.data,
    shouldPublish,
  };
};

const main = async () => {
  try {
    const env = await loadEnv();

    const { access_token: accessToken } = await requestAccessToken(
      env.clientId,
      env.clientSecret,
      env.refreshToken,
    );

    await uploadPackage(accessToken, env.extensionId, env.filePath);

    if (!env.shouldPublish) {
      return;
    }

    await publishPackage(accessToken, env.extensionId);
  } catch (error: unknown) {
    if (error instanceof WebStoreError) {
      const secureMessage = formatSecureErrorMessage(
        error.message,
        error.code,
        error.details,
      );
      core.setFailed(secureMessage);
      return;
    }

    if (error instanceof Error) {
      core.setFailed(`Deployment failed: ${error.message}`);
      return;
    }

    core.setFailed("Unexpected error during deployment");
  }
};

main();
