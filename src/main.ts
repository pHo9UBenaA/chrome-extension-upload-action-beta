import "jsr:@std/dotenv/load";
import * as core from "npm:@actions/core";

import { requestAccessToken } from "./auth.ts";
import { publish } from "./publish.ts";
import type { ExtensionId } from "./types.ts";
import { uploadPackage } from "./upload.ts";
import { WebStoreError } from "./error.ts";

const loadEnv = () => {
  const clientId = Deno.env.get("CLIENT_ID");
  const clientSecret = Deno.env.get("CLIENT_SECRET");
  const refreshToken = Deno.env.get("REFRESH_TOKEN");
  const extensionId = Deno.env.get("EXTENSION_ID");
  const filePath = Deno.env.get("FILE_PATH");
  const shouldPublish = Deno.env.get("PUBLISH") === "true";

  if (
    !clientId || !clientSecret || !refreshToken || !extensionId ||
    !filePath || !shouldPublish
  ) {
    throw new Error("Missing required environment variables");
  }

  return {
    clientId,
    clientSecret,
    refreshToken,
    extensionId: extensionId as ExtensionId,
    filePath,
    shouldPublish,
  };
};

const main = async () => {
  try {
    const env = loadEnv();

    const { access_token: accessToken } = await requestAccessToken(
      env.clientId,
      env.clientSecret,
      env.refreshToken,
    );

    await uploadPackage(accessToken, env.extensionId, env.filePath);

    if (!env.shouldPublish) {
      return;
    }

    await publish(accessToken, env.extensionId);
  } catch (error: unknown) {
    if (error instanceof WebStoreError) {
      core.setFailed(
        `${error.message}: Code: ${error.code}. Details: ${
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
