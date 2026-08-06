import { describe, expect, it } from "vitest";
import {
  isModerationNsfw,
  parseModerationOutputs,
  type ModerationOutput,
} from "./wavespeed.shared";

describe("WaveSpeed moderation shared helpers", () => {
  it("flags sexual as NSFW", () => {
    expect(isModerationNsfw([{ sexual: true }])).toBe(true);
  });

  it("flags sexual/minors as NSFW", () => {
    expect(isModerationNsfw([{ "sexual/minors": true }])).toBe(true);
  });

  it("does not flag violence-only output as NSFW", () => {
    expect(isModerationNsfw([{ violence: true }])).toBe(false);
  });

  it("does not flag harassment/hate-only output as NSFW", () => {
    expect(isModerationNsfw([{ harassment: true, hate: true }])).toBe(false);
  });

  it("treats all-false output as safe", () => {
    const output: ModerationOutput = {
      harassment: false,
      hate: false,
      sexual: false,
      "sexual/minors": false,
      violence: false,
    };
    expect(isModerationNsfw([output])).toBe(false);
  });

  it("flags NSFW when any item in the array is sexual", () => {
    expect(isModerationNsfw([{ violence: true }, { sexual: true }])).toBe(true);
  });

  it("empty array has no NSFW flags (caller must not use empty as success)", () => {
    // isModerationNsfw only answers "any sexual flag?"; empty means no flags, not safe.
    // parseModerationOutputs throws on empty/missing outputs so callers never get here on success.
    expect(isModerationNsfw([])).toBe(false);
  });

  it("parses outputs from { data: { outputs } } shape", () => {
    expect(
      parseModerationOutputs({
        code: 200,
        data: {
          status: "completed",
          outputs: [
            {
              harassment: false,
              hate: false,
              sexual: true,
              "sexual/minors": false,
              violence: false,
            },
          ],
        },
      }),
    ).toEqual([
      {
        harassment: false,
        hate: false,
        sexual: true,
        "sexual/minors": false,
        violence: false,
      },
    ]);
  });

  it("parses outputs from top-level { outputs } shape", () => {
    expect(parseModerationOutputs({ outputs: [{ sexual: false }] })).toEqual([
      { sexual: false },
    ]);
  });

  it("throws when status is present and not completed", () => {
    expect(() =>
      parseModerationOutputs({
        data: {
          status: "processing",
          outputs: [{ sexual: false }],
        },
      }),
    ).toThrow(/incomplete: status=processing/);
  });

  it("throws when outputs missing or empty", () => {
    expect(() => parseModerationOutputs({ data: {} })).toThrow(
      /empty or missing outputs/,
    );
    expect(() => parseModerationOutputs({ data: { outputs: [] } })).toThrow(
      /empty or missing outputs/,
    );
    expect(() => parseModerationOutputs({ outputs: "nope" })).toThrow(
      /empty or missing outputs/,
    );
    expect(() => parseModerationOutputs(null)).toThrow(/invalid response body/);
  });

  it("throws when outputs array has no valid items", () => {
    expect(() => parseModerationOutputs({ outputs: [null, "x", 1] })).toThrow(
      /no valid outputs/,
    );
  });
});
