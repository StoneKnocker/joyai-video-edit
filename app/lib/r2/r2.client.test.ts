import { afterEach, describe, expect, test, vi } from "vitest";
import { generateUploadFilePath } from "./r2.client";

describe("generateUploadFilePath", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("keeps upload paths unique when files are prepared in the same millisecond", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_780_000_000_000);
    vi.stubGlobal("crypto", {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce("first-id")
        .mockReturnValueOnce("second-id"),
    });

    const firstPath = generateUploadFilePath("user-1", "front.PNG");
    const secondPath = generateUploadFilePath("user-1", "back.PNG");

    expect(firstPath).toBe("uploads/user-1/1780000000000-first-id.png");
    expect(secondPath).toBe("uploads/user-1/1780000000000-second-id.png");
    expect(firstPath).not.toBe(secondPath);
  });
});
