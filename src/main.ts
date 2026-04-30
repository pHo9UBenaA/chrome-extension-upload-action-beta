import * as core from "@actions/core";

import { requestAccessToken } from "./auth.ts";
import { publishPackage } from "./publish.ts";
import { uploadPackage } from "./upload.ts";
import { WebStoreError } from "./error.ts";
import { validateExtensionId } from "./validation.ts";

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

    // Mask sensitive values in logs
    core.setSecret(env.clientSecret);
    core.setSecret(env.refreshToken);

    core.info("Requesting access token...");
    const { access_token: accessToken } = await requestAccessToken(
      env.clientId,
      env.clientSecret,
      env.refreshToken,
    );

    // Mask access token in logs
    core.setSecret(accessToken);

    core.info(`Uploading extension ${env.extensionId}...`);
    const uploadResult = await uploadPackage(accessToken, env.extensionId, env.filePath);
    core.info("Upload successful");

    // Set outputs for downstream steps
    core.setOutput("item-id", uploadResult.item_id);
    core.setOutput("upload-state", uploadResult.uploadState);

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
      // Log details at debug level to avoid exposing sensitive info
      core.debug(`Error details: ${JSON.stringify(error.details)}`);
    } else if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed("Unexpected error during deployment");
    }
  }
};

main();
