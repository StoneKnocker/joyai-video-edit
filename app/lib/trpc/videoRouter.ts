import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createKieSeedanceTask, queryKieJob } from "~/lib/ai/kie.server";
import {
  calculateSeedanceCreditCost,
  getSeedanceCreditCostFromInput,
  getTaskResultMedia,
  MAX_REFERENCE_VIDEO_DURATION_SECONDS,
  SEEDANCE_MODEL,
  seedanceCreateTaskInputSchema,
  seedanceResolutionSchema,
  type SeedanceCreateTaskInput,
} from "~/lib/ai/seedance.shared";
import { moderateImage, moderateText } from "~/lib/ai/wavespeed.server";
import {
  isModerationNsfw,
  type ModerationOutput,
} from "~/lib/ai/wavespeed.shared";
import { TASK_STATUS } from "~/lib/consts";
import { serverEnv } from "~/lib/env.server";
import {
  getTaskByIdForUser,
  isTaskTerminal,
  markTaskSubmitted,
  touchTaskUpdatedAt,
} from "~/lib/model/userTask";
import { getTotalAvailableCredits } from "~/lib/model/userBalance";
import { applyKieJobToTask } from "~/lib/service/kieCallbackService";
import { createTask, setTaskFailed } from "~/lib/service/taskService";
import { authedProcedure, router } from "./init";

/** Provider accepted the job but local task was already terminalized (recovery race). */
class TaskSubmissionAbortedError extends Error {
  readonly providerTaskId: string;

  constructor(taskId: string, providerTaskId: string) {
    super("video task submission aborted");
    this.name = "TaskSubmissionAbortedError";
    this.providerTaskId = providerTaskId;
    this.cause = { taskId, providerTaskId };
  }
}

/** Dev may set KIE_CALLBACK_BASE_URL (ngrok); prod leaves it unset → APP_URL. */
function getKieCallbackUrl() {
  const baseUrl = serverEnv.KIE_CALLBACK_BASE_URL ?? serverEnv.APP_URL;
  return new URL("/api/ai/kie/callback", baseUrl).toString();
}

/** Collect image URLs from a Seedance input for pre-generation moderation. */
function getSeedanceImageUrls(input: SeedanceCreateTaskInput): string[] {
  if (input.mode === "image-to-video") {
    return [input.firstFrameUrl, input.lastFrameUrl].filter(
      (url): url is string => typeof url === "string" && url.length > 0,
    );
  }
  if (input.mode === "multi-reference") {
    return input.referenceImageUrls ?? [];
  }
  return [];
}

/**
 * Rate-limit trade-off: moderate all images when ≤2; otherwise only first + last.
 * Middle reference images are skipped intentionally.
 */
function selectImagesForModeration(urls: string[]): string[] {
  if (urls.length <= 2) return urls;
  return [urls[0]!, urls[urls.length - 1]!];
}

function toTaskStatusResponse(task: {
  id: string;
  status: string;
  mode: string;
  resultData: unknown;
  errorMessage: string;
}) {
  const media = getTaskResultMedia(task.resultData);
  return {
    taskId: task.id,
    status: task.status,
    mode: task.mode,
    resultData: task.resultData,
    videoKeys: media.videoKeys,
    posterKey: media.posterKey,
    errorMessage: task.errorMessage,
  };
}

export const videoRouter = router({
  getCreditsForSettings: authedProcedure
    .input(
      z.object({
        resolution: seedanceResolutionSchema,
        duration: z.number().int().min(4).max(15),
        hasReferenceVideo: z.boolean(),
        referenceVideoDurationSeconds: z
          .number()
          .nonnegative()
          .max(MAX_REFERENCE_VIDEO_DURATION_SECONDS)
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const credits = await getTotalAvailableCredits(ctx.user.id);
      const creditCost = calculateSeedanceCreditCost({
        resolution: input.resolution,
        duration: input.duration,
        hasReferenceVideo: input.hasReferenceVideo,
        referenceVideoDurationSeconds: input.referenceVideoDurationSeconds,
      });

      return {
        creditCost,
        balance: credits.total,
        hasEnoughCredits: credits.total >= creditCost,
      };
    }),

  createSeedanceTask: authedProcedure
    .input(seedanceCreateTaskInputSchema)
    .mutation(async ({ ctx, input }) => {
      const creditCost = getSeedanceCreditCostFromInput(input);
      const credits = await getTotalAvailableCredits(ctx.user.id);

      if (credits.total < creditCost) {
        throw new TRPCError({
          code: "PAYMENT_REQUIRED",
          message: "Insufficient credits",
        });
      }

      // Pre-moderate prompt and reference images before creating the task.
      // Reference videos/audio are skipped (moderation API is image-only).
      // >2 images: only first + last are checked to cut API volume (rate limits).
      // Serial calls only — WaveSpeed rate-limits concurrent requests.
      // Text is moderated independently first; if NSFW, image checks are skipped.
      // Fail-closed: any leg failing means safety cannot be guaranteed, so we
      // block creation rather than silently letting potentially NSFW content through.
      const imageUrls = selectImagesForModeration(getSeedanceImageUrls(input));
      const fulfilledOutputs: ModerationOutput[] = [];
      const failures: unknown[] = [];

      // Text is always moderated independently first.
      try {
        const textOutputs = await moderateText(input.prompt);
        fulfilledOutputs.push(...textOutputs);
      } catch (err) {
        failures.push(err);
      }

      // Short-circuit on NSFW: skip remaining image checks if text already flagged.
      if (!isModerationNsfw(fulfilledOutputs)) {
        for (const url of imageUrls) {
          try {
            const outputs = await moderateImage(url, input.prompt);
            fulfilledOutputs.push(...outputs);
            // Early stop on NSFW — no need to burn more rate-limited calls.
            if (isModerationNsfw(outputs)) break;
          } catch (err) {
            failures.push(err);
          }
        }
      }

      // NSFW hit takes priority — report the real reason even if other legs failed.
      if (isModerationNsfw(fulfilledOutputs)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Content moderation blocked: inappropriate content detected",
        });
      }

      // No NSFW found, but some legs failed → block so a broken moderation
      // service can never become a silent bypass.
      if (failures.length > 0) {
        console.error(
          "[video.createSeedanceTask] moderation service failed, failing closed",
          failures,
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Content moderation unavailable, please try again",
        });
      }

      const taskId = await createTask({
        userId: ctx.user.id,
        mode: input.mode,
        model: SEEDANCE_MODEL,
        provider: "kie",
        prompt: input.prompt,
        input,
        creditCost,
      });

      try {
        // Lease: refresh updatedAt so recovery won't fail+refund mid-create.
        const leased = await touchTaskUpdatedAt(taskId);
        if (!leased) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "video task is no longer active",
          });
        }

        const providerTask = await createKieSeedanceTask({
          callbackUrl: getKieCallbackUrl(),
          input,
        });

        const submitted = await markTaskSubmitted(taskId, providerTask.taskId);
        if (!submitted) {
          // Recovery (or another path) already terminalized the task while
          // provider create was in flight — do not resurrect a refunded task.
          // Provider job may be orphaned; lease keeps this path rare.
          console.error(
            "[video.createSeedanceTask] markTaskSubmitted aborted (task already terminal or submitted)",
            { taskId, providerTaskId: providerTask.taskId },
          );
          throw new TaskSubmissionAbortedError(taskId, providerTask.taskId);
        }

        return {
          taskId,
          providerTaskId: providerTask.taskId,
          status: TASK_STATUS.PROCESSING,
          creditCost,
        };
      } catch (error) {
        if (error instanceof TaskSubmissionAbortedError) {
          throw new TRPCError({
            code: "CONFLICT",
            message: error.message,
          });
        }
        if (error instanceof TRPCError) {
          throw error;
        }
        await setTaskFailed(
          taskId,
          error instanceof Error ? error.message : "video task creation failed",
          "provider_create_failed",
        );
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "video task creation failed",
        });
      }
    }),

  getTaskStatus: authedProcedure
    .input(z.object({ taskId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const task = await getTaskByIdForUser(input.taskId, ctx.user.id);

      if (!task) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Task not found" });
      }

      if (!isTaskTerminal(task.status) && task.providerTaskId) {
        try {
          const providerState = await queryKieJob(task.providerTaskId);
          await applyKieJobToTask({
            taskId: task.id,
            body: providerState.raw,
          });
          const refreshed = await getTaskByIdForUser(input.taskId, ctx.user.id);
          if (refreshed) {
            return toTaskStatusResponse(refreshed);
          }
        } catch (error) {
          console.warn("[video.getTaskStatus] KIE sync failed", error);
        }
      }

      return toTaskStatusResponse(task);
    }),
});
