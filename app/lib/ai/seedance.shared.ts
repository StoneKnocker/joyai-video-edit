import { z } from "zod";

export const SEEDANCE_MODEL = "bytedance/seedance-2";

export const seedanceModeSchema = z.enum([
  "text-to-video",
  "image-to-video",
  "multi-reference",
]);

export const seedanceResolutionSchema = z.enum(["480p", "720p", "1080p", "4k"]);

export const seedanceAspectRatioSchema = z.enum([
  "adaptive",
  "16:9",
  "9:16",
  "4:3",
  "3:4",
  "21:9",
  "1:1",
]);

const urlSchema = z.string().url();

const seedanceBaseInputSchema = z.object({
  mode: seedanceModeSchema,
  prompt: z.string().trim().min(3).max(20_000),
  resolution: seedanceResolutionSchema,
  aspectRatio: seedanceAspectRatioSchema,
  duration: z.number().int().min(4).max(15),
  generateAudio: z.boolean(),
  webSearch: z.boolean().optional(),
  nsfwChecker: z.boolean().optional(),
});

const seedanceCreateTaskInputUnion = z.discriminatedUnion("mode", [
  seedanceBaseInputSchema.extend({
    mode: z.literal("text-to-video"),
  }),
  seedanceBaseInputSchema.extend({
    mode: z.literal("image-to-video"),
    firstFrameUrl: urlSchema,
    lastFrameUrl: urlSchema.optional(),
  }),
  seedanceBaseInputSchema.extend({
    mode: z.literal("multi-reference"),
    referenceImageUrls: z.array(urlSchema).max(9).optional(),
    referenceVideoUrls: z.array(urlSchema).max(3).optional(),
    referenceAudioUrls: z.array(urlSchema).max(3).optional(),
    /**
     * Total duration (seconds) of all reference videos. Billing-only — not sent to KIE.
     * Required for accurate with-video pricing: cost = rate × (input + output).
     */
    referenceVideoDurationSeconds: z.number().nonnegative().max(15).optional(),
  }),
]);

/** Multi-reference requires at least one image or video (audio alone is invalid). */
export const seedanceCreateTaskInputSchema =
  seedanceCreateTaskInputUnion.superRefine((input, ctx) => {
    if (input.mode !== "multi-reference") return;

    const imageCount = input.referenceImageUrls?.length ?? 0;
    const videoCount = input.referenceVideoUrls?.length ?? 0;
    if (imageCount + videoCount === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one reference image or video is required",
        path: ["referenceImageUrls"],
      });
    }
  });

export type SeedanceCreateTaskInput = z.infer<
  typeof seedanceCreateTaskInputUnion
>;

export interface SeedanceKieInput {
  prompt: string;
  first_frame_url?: string;
  last_frame_url?: string;
  reference_image_urls?: string[];
  reference_video_urls?: string[];
  reference_audio_urls?: string[];
  generate_audio: boolean;
  resolution: "480p" | "720p" | "1080p" | "4k";
  aspect_ratio: "adaptive" | "16:9" | "9:16" | "4:3" | "3:4" | "21:9" | "1:1";
  duration: number;
  web_search: boolean;
  nsfw_checker: boolean;
}

export interface ParsedSeedanceResult {
  resultUrls: string[];
  firstFrameUrls: string[];
  lastFrameUrls: string[];
}

/** Persisted generation result (R2 keys), used by user_task.resultData */
export const taskResultVideoSchema = z.object({
  key: z.string().min(1),
  contentType: z.string().optional(),
});

export const taskResultFrameSchema = z.object({
  key: z.string().min(1),
  role: z.enum(["first", "last", "unknown"]),
});

export const taskResultDataSchema = z.object({
  videos: z.array(taskResultVideoSchema).default([]),
  frames: z.array(taskResultFrameSchema).optional(),
  posterKey: z.string().optional(),
  /** Transient while non-terminal: R2 persist retry counter */
  persistAttempts: z.number().int().nonnegative().optional(),
});

/** Pre-redesign shape: string URL/key arrays */
const legacyTaskResultDataSchema = z.object({
  videos: z.array(z.string()),
  images: z.array(z.string()).optional(),
});

export type TaskResultData = z.infer<typeof taskResultDataSchema>;

export function emptyTaskResultData(): TaskResultData {
  return { videos: [] };
}

export function getPersistAttempts(resultData: unknown): number {
  const parsed = taskResultDataSchema.safeParse(resultData);
  return parsed.success ? (parsed.data.persistAttempts ?? 0) : 0;
}

/** Extract video/image keys for UI consumers (typed + legacy). */
export function getTaskResultMedia(resultData: unknown): {
  videoKeys: string[];
  posterKey?: string;
  imageKeys: string[];
} {
  const typed = taskResultDataSchema.safeParse(resultData);
  if (typed.success) {
    const videoKeys = typed.data.videos.map((item) => item.key);
    const imageKeys = (typed.data.frames ?? []).map((item) => item.key);
    return {
      videoKeys,
      imageKeys,
      posterKey: typed.data.posterKey ?? imageKeys[0],
    };
  }

  const legacy = legacyTaskResultDataSchema.safeParse(resultData);
  if (legacy.success) {
    const imageKeys = legacy.data.images ?? [];
    return {
      videoKeys: legacy.data.videos,
      imageKeys,
      posterKey: imageKeys[0],
    };
  }

  return { videoKeys: [], imageKeys: [] };
}

/**
 * KIE Seedance 2.0 per-second credit rates.
 *
 * Formula (KIE docs):
 * - No video input:  rate_no_video × output_seconds
 * - With video input: rate_with_video × (input_seconds + output_seconds)
 *
 * generate_audio does not change the rate.
 */
const CREDIT_RATE_PER_SECOND: Record<
  SeedanceCreateTaskInput["resolution"],
  { withVideo: number; noVideo: number }
> = {
  "480p": { withVideo: 11.5, noVideo: 19 },
  "720p": { withVideo: 25, noVideo: 41 },
  "1080p": { withVideo: 62, noVideo: 102 },
  "4k": { withVideo: 128, noVideo: 208 },
};

/** KIE max total reference video duration (seconds). Used as conservative fallback. */
export const MAX_REFERENCE_VIDEO_DURATION_SECONDS = 15;

export type SeedanceCreditCostParams = {
  resolution: SeedanceCreateTaskInput["resolution"];
  /** Output video duration in seconds (4–15). */
  duration: number;
  /** True when the request includes one or more reference videos. */
  hasReferenceVideo: boolean;
  /**
   * Total duration of all reference videos in seconds.
   * When hasReferenceVideo and missing/0, falls back to max (15s) so we never undercharge.
   */
  referenceVideoDurationSeconds?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringArray(value: unknown): string[] {
  if (typeof value === "string" && value.length > 0) {
    return [value];
  }
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter(
    (item): item is string => typeof item === "string" && item.length > 0,
  );
}

function parseResultJson(payload: Record<string, unknown>) {
  const { resultJson } = payload;
  if (!resultJson) {
    return {};
  }

  if (isRecord(resultJson)) {
    return resultJson;
  }

  if (typeof resultJson !== "string") {
    return {};
  }

  try {
    const parsed: unknown = JSON.parse(resultJson);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Calculate user-facing credit cost for a Seedance generation.
 * Maps 1:1 to KIE Seedance 2.0 rates (ceil so fractional rates never undercharge).
 */
export function calculateSeedanceCreditCost(
  params: SeedanceCreditCostParams,
): number {
  const { resolution, duration, hasReferenceVideo } = params;
  const rates = CREDIT_RATE_PER_SECOND[resolution];

  if (hasReferenceVideo) {
    const reported = params.referenceVideoDurationSeconds ?? 0;
    // Missing/zero duration would undercharge; use max allowed input as floor.
    const inputSeconds =
      reported > 0
        ? Math.min(reported, MAX_REFERENCE_VIDEO_DURATION_SECONDS)
        : MAX_REFERENCE_VIDEO_DURATION_SECONDS;
    const billableSeconds = inputSeconds + duration;
    return Math.ceil(rates.withVideo * billableSeconds);
  }

  return Math.ceil(rates.noVideo * duration);
}

/** Derive credit params from a validated create-task input. */
export function getSeedanceCreditCostFromInput(
  input: SeedanceCreateTaskInput,
): number {
  const hasReferenceVideo =
    input.mode === "multi-reference" &&
    (input.referenceVideoUrls?.length ?? 0) > 0;

  return calculateSeedanceCreditCost({
    resolution: input.resolution,
    duration: input.duration,
    hasReferenceVideo,
    referenceVideoDurationSeconds:
      input.mode === "multi-reference"
        ? input.referenceVideoDurationSeconds
        : undefined,
  });
}

export function buildSeedanceInput(
  input: SeedanceCreateTaskInput,
): SeedanceKieInput {
  const base: SeedanceKieInput = {
    prompt: input.prompt,
    generate_audio: input.generateAudio,
    resolution: input.resolution,
    aspect_ratio: input.aspectRatio,
    duration: input.duration,
    web_search: input.webSearch ?? false,
    nsfw_checker: input.nsfwChecker ?? true,
  };

  if (input.mode === "image-to-video") {
    return {
      ...base,
      first_frame_url: input.firstFrameUrl,
      ...(input.lastFrameUrl ? { last_frame_url: input.lastFrameUrl } : {}),
    };
  }

  if (input.mode === "multi-reference") {
    return {
      ...base,
      ...((input.referenceImageUrls?.length ?? 0) > 0
        ? { reference_image_urls: input.referenceImageUrls ?? [] }
        : {}),
      ...((input.referenceVideoUrls?.length ?? 0) > 0
        ? { reference_video_urls: input.referenceVideoUrls ?? [] }
        : {}),
      ...((input.referenceAudioUrls?.length ?? 0) > 0
        ? { reference_audio_urls: input.referenceAudioUrls ?? [] }
        : {}),
    };
  }

  return base;
}

export function parseKieSeedanceResult(
  payload: Record<string, unknown>,
): ParsedSeedanceResult {
  const parsed = parseResultJson(payload);

  return {
    resultUrls: stringArray(parsed.resultUrls),
    firstFrameUrls: stringArray(parsed.firstFrameUrl ?? parsed.firstFrameUrls),
    lastFrameUrls: stringArray(parsed.lastFrameUrl ?? parsed.lastFrameUrls),
  };
}
