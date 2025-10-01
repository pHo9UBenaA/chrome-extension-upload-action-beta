import * as core from "npm:@actions/core";

import { requestAccessToken } from "./auth.ts";
import { publishPackage } from "./publish.ts";
import type { ExtensionId } from "./types.ts";
import { uploadPackage } from "./upload.ts";
import { WebStoreError } from "./error.ts";

/**
 * Validates Chrome extension ID format
 */
const validateExtensionId = (id: string): ExtensionId => {
  const trimmed = id.trim();
  if (!/^[a-z]{32}$/.test(trimmed)) {
    throw new Error(
      "Invalid extension ID format. Must be 32 lowercase letters.",
    );
  }
  return trimmed as ExtensionId;
};

/**
 * Loads and validates environment variables
 */
const loadEnv = () => {
  const clientId: string | undefined = Deno.env.get("CLIENT_ID");
  const clientSecret: string | undefined = Deno.env.get("CLIENT_SECRET");
  const refreshToken: string | undefined = Deno.env.get("REFRESH_TOKEN");
  const extensionId: string | undefined = Deno.env.get("EXTENSION_ID");
  const filePath: string | undefined = Deno.env.get("FILE_PATH");
  const shouldPublish: boolean | undefined = Deno.env.get("PUBLISH") === "true";

  if (
    !clientId || !clientSecret || !refreshToken || !extensionId ||
    !filePath || shouldPublish === undefined
  ) {
    throw new Error("Missing required environment variables");
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    extensionId: validateExtensionId(extensionId),
    filePath,
    shouldPublish,
  };
};

const main = async () => {
  try {
    const env = loadEnv();

    core.info("Requesting access token...");
    const { access_token: accessToken } = await requestAccessToken(
      env.clientId,
      env.clientSecret,
      env.refreshToken,
    );

    core.info(`Uploading extension ${env.extensionId}...`);
    await uploadPackage(accessToken, env.extensionId, env.filePath);
    core.info("Upload successful");

    if (!env.shouldPublish) {
      core.info("Skipping publish (publish=false)");
      return;
    }

    core.info("Publishing extension...");
    await publishPackage(accessToken, env.extensionId);
    core.info("Publish successful");
  } catch (error: unknown) {
    if (error instanceof WebStoreError) {
      core.setFailed(`${error.message} (Code: ${error.code})`);
    } else if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("Unexpected error during deployment");
    }
  }
};

main();
