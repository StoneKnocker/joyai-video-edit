import { describe, expect, it } from "vitest";
import {
  buildSeedanceInput,
  calculateSeedanceCreditCost,
  getSeedanceCreditCostFromInput,
  getTaskResultMedia,
  parseKieSeedanceResult,
  seedanceCreateTaskInputSchema,
} from "./seedance.shared";

describe("Seedance shared helpers", () => {
  it("calculates no-video cost as rate × output duration", () => {
    // 19 * 5 = 95
    expect(
      calculateSeedanceCreditCost({
        resolution: "480p",
        duration: 5,
        hasReferenceVideo: false,
      }),
    ).toBe(95);
    // 41 * 5 = 205
    expect(
      calculateSeedanceCreditCost({
        resolution: "720p",
        duration: 5,
        hasReferenceVideo: false,
      }),
    ).toBe(205);
    // 102 * 8 = 816
    expect(
      calculateSeedanceCreditCost({
        resolution: "1080p",
        duration: 8,
        hasReferenceVideo: false,
      }),
    ).toBe(816);
    // 208 * 4 = 832
    expect(
      calculateSeedanceCreditCost({
        resolution: "4k",
        duration: 4,
        hasReferenceVideo: false,
      }),
    ).toBe(832);
  });

  it("calculates with-video cost as rate × (input + output)", () => {
    // 11.5 * (3 + 5) = 92
    expect(
      calculateSeedanceCreditCost({
        resolution: "480p",
        duration: 5,
        hasReferenceVideo: true,
        referenceVideoDurationSeconds: 3,
      }),
    ).toBe(92);
    // 25 * (2 + 8) = 250
    expect(
      calculateSeedanceCreditCost({
        resolution: "720p",
        duration: 8,
        hasReferenceVideo: true,
        referenceVideoDurationSeconds: 2,
      }),
    ).toBe(250);
    // 62 * (5 + 10) = 930
    expect(
      calculateSeedanceCreditCost({
        resolution: "1080p",
        duration: 10,
        hasReferenceVideo: true,
        referenceVideoDurationSeconds: 5,
      }),
    ).toBe(930);
    // 128 * (1 + 4) = 640
    expect(
      calculateSeedanceCreditCost({
        resolution: "4k",
        duration: 4,
        hasReferenceVideo: true,
        referenceVideoDurationSeconds: 1,
      }),
    ).toBe(640);
  });

  it("ceils fractional credit totals", () => {
    // 11.5 * (1.1 + 5) = 11.5 * 6.1 = 70.15 → 71
    expect(
      calculateSeedanceCreditCost({
        resolution: "480p",
        duration: 5,
        hasReferenceVideo: true,
        referenceVideoDurationSeconds: 1.1,
      }),
    ).toBe(71);
  });

  it("uses max input duration when with-video but duration missing or zero", () => {
    // 11.5 * (15 + 5) = 230
    expect(
      calculateSeedanceCreditCost({
        resolution: "480p",
        duration: 5,
        hasReferenceVideo: true,
      }),
    ).toBe(230);
    expect(
      calculateSeedanceCreditCost({
        resolution: "480p",
        duration: 5,
        hasReferenceVideo: true,
        referenceVideoDurationSeconds: 0,
      }),
    ).toBe(230);
  });

  it("caps reported input duration at 15s", () => {
    // 11.5 * (15 + 5) = 230 even if client reports 20
    expect(
      calculateSeedanceCreditCost({
        resolution: "480p",
        duration: 5,
        hasReferenceVideo: true,
        referenceVideoDurationSeconds: 20,
      }),
    ).toBe(230);
  });

  it("does not factor generateAudio into cost", () => {
    // Pricing is independent of generate_audio; same no-video 720p/5s.
    expect(
      calculateSeedanceCreditCost({
        resolution: "720p",
        duration: 5,
        hasReferenceVideo: false,
      }),
    ).toBe(205);
  });

  it("derives cost from create-task input including multi-reference videos", () => {
    expect(
      getSeedanceCreditCostFromInput({
        mode: "text-to-video",
        prompt: "A cinematic city flyover",
        resolution: "720p",
        aspectRatio: "16:9",
        duration: 5,
        generateAudio: true,
      }),
    ).toBe(205);

    expect(
      getSeedanceCreditCostFromInput({
        mode: "multi-reference",
        prompt: "Blend these references",
        resolution: "480p",
        aspectRatio: "9:16",
        duration: 5,
        generateAudio: false,
        referenceImageUrls: ["https://cdn.example.com/a.png"],
        referenceVideoUrls: ["https://cdn.example.com/a.mp4"],
        referenceVideoDurationSeconds: 3,
      }),
    ).toBe(92);

    // Image-only multi-reference uses no-video rate
    expect(
      getSeedanceCreditCostFromInput({
        mode: "multi-reference",
        prompt: "Use this image",
        resolution: "480p",
        aspectRatio: "9:16",
        duration: 5,
        generateAudio: false,
        referenceImageUrls: ["https://cdn.example.com/a.png"],
      }),
    ).toBe(95);
  });

  it("builds text-to-video input without media reference fields", () => {
    expect(
      buildSeedanceInput({
        mode: "text-to-video",
        prompt: "A cinematic city flyover",
        resolution: "1080p",
        aspectRatio: "adaptive",
        duration: 5,
        generateAudio: false,
      }),
    ).toEqual({
      prompt: "A cinematic city flyover",
      generate_audio: false,
      resolution: "1080p",
      aspect_ratio: "adaptive",
      duration: 5,
      web_search: false,
      nsfw_checker: true,
    });
  });

  it("builds image-to-video input with first and optional last frame only", () => {
    expect(
      buildSeedanceInput({
        mode: "image-to-video",
        prompt: "Animate the subject",
        resolution: "720p",
        aspectRatio: "16:9",
        duration: 8,
        generateAudio: true,
        firstFrameUrl: "https://cdn.example.com/first.png",
        lastFrameUrl: "https://cdn.example.com/last.png",
      }),
    ).toMatchObject({
      first_frame_url: "https://cdn.example.com/first.png",
      last_frame_url: "https://cdn.example.com/last.png",
    });
  });

  it("builds multi-reference input without first or last frame fields", () => {
    const input = buildSeedanceInput({
      mode: "multi-reference",
      prompt: "Blend these references",
      resolution: "480p",
      aspectRatio: "9:16",
      duration: 4,
      generateAudio: false,
      referenceImageUrls: ["https://cdn.example.com/a.png"],
      referenceVideoUrls: ["https://cdn.example.com/a.mp4"],
      referenceAudioUrls: ["https://cdn.example.com/a.mp3"],
      referenceVideoDurationSeconds: 3.5,
    });

    expect(input).toMatchObject({
      reference_image_urls: ["https://cdn.example.com/a.png"],
      reference_video_urls: ["https://cdn.example.com/a.mp4"],
      reference_audio_urls: ["https://cdn.example.com/a.mp3"],
    });
    // Billing field must not leak to KIE payload
    expect(input).not.toHaveProperty("referenceVideoDurationSeconds");
    expect(input).not.toHaveProperty("reference_video_duration_seconds");
    expect(input).not.toHaveProperty("first_frame_url");
    expect(input).not.toHaveProperty("last_frame_url");
  });

  it("rejects multi-reference without image or video references", () => {
    const empty = seedanceCreateTaskInputSchema.safeParse({
      mode: "multi-reference",
      prompt: "Only audio is not enough",
      resolution: "480p",
      aspectRatio: "9:16",
      duration: 5,
      generateAudio: false,
      referenceAudioUrls: ["https://cdn.example.com/a.mp3"],
    });
    expect(empty.success).toBe(false);

    const none = seedanceCreateTaskInputSchema.safeParse({
      mode: "multi-reference",
      prompt: "No media at all",
      resolution: "480p",
      aspectRatio: "9:16",
      duration: 5,
      generateAudio: false,
    });
    expect(none.success).toBe(false);

    const withImage = seedanceCreateTaskInputSchema.safeParse({
      mode: "multi-reference",
      prompt: "Use this image",
      resolution: "480p",
      aspectRatio: "9:16",
      duration: 5,
      generateAudio: false,
      referenceImageUrls: ["https://cdn.example.com/a.png"],
    });
    expect(withImage.success).toBe(true);
  });

  it("parses Seedance result URLs and optional frame URLs", () => {
    expect(
      parseKieSeedanceResult({
        resultJson: JSON.stringify({
          resultUrls: ["https://example.com/video.mp4"],
          firstFrameUrl: "https://example.com/first.webp",
          lastFrameUrl: "https://example.com/last.webp",
        }),
      }),
    ).toEqual({
      resultUrls: ["https://example.com/video.mp4"],
      firstFrameUrls: ["https://example.com/first.webp"],
      lastFrameUrls: ["https://example.com/last.webp"],
    });
  });

  it("reads typed task resultData and legacy string arrays via schema", () => {
    expect(
      getTaskResultMedia({
        videos: [{ key: "kie/results/a/1.mp4", contentType: "video/mp4" }],
        frames: [{ key: "kie/results/a/2.webp", role: "first" }],
        posterKey: "kie/results/a/2.webp",
        persistAttempts: 2,
      }),
    ).toEqual({
      videoKeys: ["kie/results/a/1.mp4"],
      imageKeys: ["kie/results/a/2.webp"],
      posterKey: "kie/results/a/2.webp",
    });

    expect(
      getTaskResultMedia({
        videos: ["legacy/video.mp4"],
        images: ["legacy/frame.webp"],
      }),
    ).toEqual({
      videoKeys: ["legacy/video.mp4"],
      imageKeys: ["legacy/frame.webp"],
      posterKey: "legacy/frame.webp",
    });

    expect(getTaskResultMedia(null)).toEqual({
      videoKeys: [],
      imageKeys: [],
    });
  });
});
