import { extname } from "node:path";
import type { TaskResultData } from "~/lib/ai/seedance.shared";
import {
  getPersistAttempts,
  parseKieSeedanceResult,
} from "~/lib/ai/seedance.shared";
import { TASK_STATUS } from "~/lib/consts";
import {
  completeTask,
  getTaskById,
  getTaskByProviderTaskId,
  isTaskTerminal,
  markTaskProcessing,
  updateNonTerminalResultData,
} from "~/lib/model/userTask";
import { downloadAndUpload, getServerR2Url } from "~/lib/r2/r2.server";
import { setTaskFailed } from "~/lib/service/taskService";
import {
  extractKieCallbackPayload,
  mapKieJobState,
  verifyKieWebhookSignature,
} from "../ai/kie.shared";
import { serverEnv } from "../env.server";

/** Max R2 upload attempts before failing the task (callback + poll + cron). */
export const MAX_R2_PERSIST_ATTEMPTS = 5;

export type KieApplyOutcome = "completed" | "failed" | "processing" | "skipped";

export interface HandleKieCallbackParams {
  body: unknown;
  timestamp: string | null;
  signature: string | null;
}

export interface HandleKieCallbackResult {
  status: number;
  message: string;
}

function getExtensionFromUrl(url: string) {
  try {
    const pathname = new URL(url).pathname;
    const extension = extname(pathname).toLowerCase();
    return extension || ".bin";
  } catch {
    return ".bin";
  }
}

function getContentTypeFromExtension(extension: string) {
  switch (extension) {
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".png":
      return "image/png";
    default:
      return "application/octet-stream";
  }
}

async function persistKieResults(taskId: string, urls: string[], offset = 0) {
  const results: Array<{
    url: string;
    sourceUrl: string;
    key?: string;
    contentType: string;
  }> = [];

  for (const [index, url] of urls.entries()) {
    const extension = getExtensionFromUrl(url);
    const key = `kie/results/${taskId}/${offset + index + 1}${extension}`;
    const uploaded = await downloadAndUpload(url, key);
    results.push({
      url: uploaded ? getServerR2Url(key) : url,
      sourceUrl: url,
      key: uploaded ? key : undefined,
      contentType: getContentTypeFromExtension(extension),
    });
  }

  return results;
}

function buildTaskResultData(
  media: Awaited<ReturnType<typeof persistKieResults>>,
  frameMedia: Awaited<ReturnType<typeof persistKieResults>>,
  frameRoles: Array<"first" | "last" | "unknown">,
): TaskResultData {
  const videos: TaskResultData["videos"] = [];
  for (const item of media) {
    const key = item.key;
    if (!key) continue;
    if (item.contentType.startsWith("video/")) {
      videos.push({ key, contentType: item.contentType });
    }
  }

  // If provider returned non-video URLs in resultUrls, store as unknown frames
  const unexpectedImages = media
    .filter((item) => item.key && item.contentType.startsWith("image/"))
    .map((item) => ({
      key: item.key as string,
      role: "unknown" as const,
    }));

  const frames: NonNullable<TaskResultData["frames"]> = [
    ...frameMedia
      .map((item, index) =>
        item.key
          ? {
              key: item.key,
              role: frameRoles[index] ?? ("unknown" as const),
            }
          : null,
      )
      .filter(
        (item): item is { key: string; role: "first" | "last" | "unknown" } =>
          Boolean(item),
      ),
    ...unexpectedImages,
  ];

  const firstFrame = frames.find((f) => f.role === "first");
  const posterKey = firstFrame?.key ?? frames[0]?.key;

  return {
    videos,
    ...(frames.length > 0 ? { frames } : {}),
    ...(posterKey ? { posterKey } : {}),
  };
}

function getSeedanceResultPayload(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object") {
    return {};
  }

  if ("data" in body) {
    return (body as { data?: Record<string, unknown> }).data ?? {};
  }

  return body as Record<string, unknown>;
}

function getProcessingDurationMs(body: unknown): number | undefined {
  const payload = getSeedanceResultPayload(body);
  const costTime = payload.costTime;
  return typeof costTime === "number" && Number.isFinite(costTime)
    ? costTime
    : undefined;
}

function getFailCode(body: unknown): string {
  const payload = getSeedanceResultPayload(body);
  const code = payload.failCode;
  return typeof code === "string" ? code : "";
}

export async function completeKieTaskFromPayload({
  taskId,
  body,
  fallbackResultUrls,
}: {
  taskId: string;
  body: unknown;
  fallbackResultUrls?: string[];
}): Promise<KieApplyOutcome> {
  // Gate before expensive R2 IO — concurrent callback/poll/cron may already win.
  const task = await getTaskById(taskId);
  if (!task || isTaskTerminal(task.status)) {
    return "skipped";
  }

  const seedanceResult = parseKieSeedanceResult(getSeedanceResultPayload(body));
  const resultUrls =
    seedanceResult.resultUrls.length > 0
      ? seedanceResult.resultUrls
      : (fallbackResultUrls ?? []);

  if (resultUrls.length === 0) {
    await setTaskFailed(taskId, "KIE callback did not include result URLs");
    return "failed";
  }

  const results = await persistKieResults(taskId, resultUrls);

  const frameUrls: string[] = [];
  const frameRoles: Array<"first" | "last" | "unknown"> = [];
  for (const url of seedanceResult.firstFrameUrls) {
    frameUrls.push(url);
    frameRoles.push("first");
  }
  for (const url of seedanceResult.lastFrameUrls) {
    frameUrls.push(url);
    frameRoles.push("last");
  }

  const persistedFrames =
    frameUrls.length > 0
      ? await persistKieResults(taskId, frameUrls, results.length)
      : [];

  const resultData = buildTaskResultData(results, persistedFrames, frameRoles);

  if (resultData.videos.length === 0) {
    // R2/fetch may fail while KIE already succeeded. Retry until cap, then fail.
    const r2FailedForVideoLike = results.some(
      (item) =>
        !item.key &&
        (item.contentType.startsWith("video/") ||
          !item.contentType.startsWith("image/")),
    );
    if (r2FailedForVideoLike) {
      const attempts = getPersistAttempts(task.resultData) + 1;
      if (attempts >= MAX_R2_PERSIST_ATTEMPTS) {
        await setTaskFailed(
          taskId,
          "Failed to persist video results after retries",
          "r2_persist_exhausted",
        );
        return "failed";
      }

      console.warn(
        "[kie] R2 upload failed for video result; leaving task non-terminal for retry",
        {
          taskId,
          attempts,
          maxAttempts: MAX_R2_PERSIST_ATTEMPTS,
          sourceUrls: results
            .filter((item) => !item.key)
            .map((item) => item.sourceUrl),
        },
      );
      await updateNonTerminalResultData(taskId, {
        videos: [],
        persistAttempts: attempts,
      });
      return "processing";
    }

    await setTaskFailed(taskId, "KIE result did not include any video files");
    return "failed";
  }

  // Re-check terminal before write: another path may have finished during R2 IO
  const latest = await getTaskById(taskId);
  if (!latest || isTaskTerminal(latest.status)) {
    return "skipped";
  }

  const updated = await completeTask(taskId, resultData, {
    processingDurationMs: getProcessingDurationMs(body),
  });
  return updated ? "completed" : "skipped";
}

/**
 * Apply a KIE job payload (from callback, poll, or cron) to a local task.
 * Idempotent for terminal states.
 */
export async function applyKieJobToTask({
  taskId,
  body,
  fallbackResultUrls,
  failMessage,
}: {
  taskId: string;
  body: unknown;
  fallbackResultUrls?: string[];
  failMessage?: string;
}): Promise<KieApplyOutcome> {
  const existing = await getTaskById(taskId);
  if (!existing || isTaskTerminal(existing.status)) {
    return "skipped";
  }

  const payload = getSeedanceResultPayload(body);
  const state =
    typeof payload.state === "string"
      ? payload.state
      : typeof (body as { state?: string })?.state === "string"
        ? (body as { state: string }).state
        : undefined;

  if (!state) {
    return "skipped";
  }

  const localStatus = mapKieJobState(state);

  if (
    localStatus === TASK_STATUS.PROCESSING ||
    localStatus === TASK_STATUS.PENDING
  ) {
    // Only transition pending → processing. While still running, poll/callback
    // are pure reads for local DB; terminal success/fail is applied below /
    // on later polls. No updatedAt lease refresh needed here.
    if (existing.status === TASK_STATUS.PENDING) {
      await markTaskProcessing(taskId);
    }
    return "processing";
  }

  if (localStatus === TASK_STATUS.FAILED) {
    await setTaskFailed(
      taskId,
      failMessage ??
        (typeof payload.failMsg === "string" && payload.failMsg
          ? payload.failMsg
          : "video task processing failed"),
      getFailCode(body),
    );
    return "failed";
  }

  if (localStatus === TASK_STATUS.COMPLETED) {
    return completeKieTaskFromPayload({
      taskId,
      body,
      fallbackResultUrls,
    });
  }

  return "skipped";
}

export async function handleKieCallback({
  body,
  timestamp,
  signature,
}: HandleKieCallbackParams): Promise<HandleKieCallbackResult> {
  const isAuthorized = await verifyKieWebhookSignature({
    payload: body,
    timestamp,
    signature,
    secret: serverEnv.KIE_WEBHOOK_HMAC_KEY,
  });

  if (!isAuthorized) {
    return { status: 401, message: "Unauthorized" };
  }

  let payload: ReturnType<typeof extractKieCallbackPayload>;
  try {
    payload = extractKieCallbackPayload(body);
  } catch (error) {
    console.warn("[kie-callback] Invalid payload", error);
    return { status: 200, message: "OK" };
  }

  const task = await getTaskByProviderTaskId(payload.taskId);

  if (!task) {
    console.warn("[kie-callback] Unknown video task", {
      providerTaskId: payload.taskId,
    });
    return { status: 200, message: "OK" };
  }

  if (isTaskTerminal(task.status)) {
    return { status: 200, message: "OK" };
  }

  await applyKieJobToTask({
    taskId: task.id,
    body,
    fallbackResultUrls: payload.resultUrls,
    failMessage: payload.failMessage,
  });

  return { status: 200, message: "OK" };
}
