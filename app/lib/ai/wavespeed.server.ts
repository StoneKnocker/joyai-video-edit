import { serverEnv } from "~/lib/env.server";
import {
  parseModerationOutputs,
  type ModerationOutput,
} from "./wavespeed.shared";

const WAVESPEED_BASE_URL = "https://api.wavespeed.ai/api/v3";

function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${serverEnv.WAVESPEED_API_KEY}`,
  };
}

async function postSync(
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<ModerationOutput[]> {
  const response = await fetch(`${WAVESPEED_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...payload, enable_sync_mode: true }),
    signal: AbortSignal.timeout(120_000),
  });

  if (!response.ok) {
    throw new Error(
      `WaveSpeed moderation failed with status ${response.status}`,
    );
  }

  return parseModerationOutputs(await response.json());
}

/** Moderate a text prompt (sync mode blocks until the result is ready). */
export async function moderateText(text: string): Promise<ModerationOutput[]> {
  return postSync("/wavespeed-ai/content-moderator/text", { text });
}

/** Moderate an image URL, optionally with associated text for context. */
export async function moderateImage(
  image: string,
  text?: string,
): Promise<ModerationOutput[]> {
  return postSync("/wavespeed-ai/content-moderator/image", {
    image,
    ...(text ? { text } : {}),
  });
}
