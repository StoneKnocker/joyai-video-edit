import { describe, expect, test } from "vitest";
import {
  addPortraitAsset,
  getPendingAssetsForGeneration,
  getSuccessfulUrls,
  mapAssetsForEndFrameToggle,
  mergeUploadedUrls,
  removeAssetById,
  type UploadedAsset,
} from "./asset-state";
import { validateMediaFile } from "./media-validation";

const portrait = {
  id: "p1",
  country: "Japan",
  age: 24,
  gender: "female" as const,
  occupation: "Designer",
  url: "https://cdn.example.com/portrait.webp",
};

describe("video workspace asset state", () => {
  test("does not select a portrait when the image asset limit blocks insertion", () => {
    const existingAssets: UploadedAsset[] = Array.from(
      { length: 9 },
      (_, i) => ({
        id: `image-${i}`,
        name: `Image ${i}`,
        url: `https://cdn.example.com/${i}.webp`,
        kind: "image",
        progress: 100,
        status: "success",
      }),
    );

    const result = addPortraitAsset({
      assets: existingAssets,
      portrait,
      selectedPortrait: null,
      maxImageFiles: 9,
    });

    expect(result.assets).toBe(existingAssets);
    expect(result.selectedPortrait).toBeNull();
    expect(result.error).toBe("You can upload up to 9 image files.");
  });

  test("clears the selected portrait when its asset is removed", () => {
    const portraitAsset: UploadedAsset = {
      id: "portrait:p1",
      name: "Japan 24 Designer",
      url: portrait.url,
      kind: "image",
      progress: 100,
      status: "success",
      previewUrl: portrait.url,
    };

    const result = removeAssetById({
      assets: [portraitAsset],
      id: portraitAsset.id,
      selectedPortrait: portrait,
    });

    expect(result.assets).toEqual([]);
    expect(result.selectedPortrait).toBeNull();
    expect(result.previewUrlToRevoke).toBeUndefined();
  });

  test("does not upload pending assets for text-to-video generation", () => {
    const pendingImage: UploadedAsset = {
      id: "pending-image",
      name: "unused.png",
      url: "",
      kind: "image",
      progress: 0,
      status: "pending",
    };

    expect(
      getPendingAssetsForGeneration({
        assets: [pendingImage],
        activeTab: "text-to-video",
        addEndFrame: false,
      }),
    ).toEqual([]);
  });

  test("uploads all pending images when image-to-video end frame is off (multi-upload)", () => {
    const readyImage: UploadedAsset = {
      id: "ready-image",
      name: "ready.png",
      url: "https://cdn.example.com/ready.png",
      kind: "image",
      progress: 100,
      status: "success",
    };
    const pendingA: UploadedAsset = {
      id: "pending-a",
      name: "a.png",
      url: "",
      kind: "image",
      progress: 0,
      status: "pending",
    };
    const pendingB: UploadedAsset = {
      id: "pending-b",
      name: "b.png",
      url: "",
      kind: "image",
      progress: 0,
      status: "pending",
    };
    const unusedPendingVideo: UploadedAsset = {
      id: "unused-pending-video",
      name: "unused.mp4",
      url: "",
      kind: "video",
      progress: 0,
      status: "pending",
    };

    expect(
      getPendingAssetsForGeneration({
        assets: [readyImage, pendingA, pendingB, unusedPendingVideo],
        activeTab: "image-to-video",
        addEndFrame: false,
      }),
    ).toEqual([pendingA, pendingB]);
  });

  test("uploads only slotted pending frames when image-to-video end frame is enabled", () => {
    const firstFrame: UploadedAsset = {
      id: "first-frame",
      name: "first.png",
      url: "https://cdn.example.com/first.png",
      kind: "image",
      progress: 100,
      status: "success",
      frameSlot: "first",
    };
    const endFrame: UploadedAsset = {
      id: "end-frame",
      name: "end.png",
      url: "",
      kind: "image",
      progress: 0,
      status: "pending",
      frameSlot: "last",
    };
    const extraFrame: UploadedAsset = {
      id: "extra-frame",
      name: "extra.png",
      url: "",
      kind: "image",
      progress: 0,
      status: "pending",
    };

    expect(
      getPendingAssetsForGeneration({
        assets: [firstFrame, endFrame, extraFrame],
        activeTab: "image-to-video",
        addEndFrame: true,
      }),
    ).toEqual([endFrame]);
  });

  test("mapAssetsForEndFrameToggle keeps images beyond the two dual slots", () => {
    const images: UploadedAsset[] = [
      {
        id: "i1",
        name: "1.png",
        url: "https://cdn.example.com/1.png",
        kind: "image",
        progress: 100,
        status: "success",
      },
      {
        id: "i2",
        name: "2.png",
        url: "https://cdn.example.com/2.png",
        kind: "image",
        progress: 100,
        status: "success",
      },
      {
        id: "i3",
        name: "3.png",
        url: "https://cdn.example.com/3.png",
        kind: "image",
        progress: 100,
        status: "success",
      },
    ];

    const dual = mapAssetsForEndFrameToggle({
      assets: images,
      addEndFrame: true,
    });
    expect(dual).toHaveLength(3);
    expect(dual.find((a) => a.id === "i1")?.frameSlot).toBe("first");
    expect(dual.find((a) => a.id === "i2")?.frameSlot).toBe("last");
    expect(dual.find((a) => a.id === "i3")?.frameSlot).toBeUndefined();

    const single = mapAssetsForEndFrameToggle({
      assets: dual,
      addEndFrame: false,
    });
    expect(single).toHaveLength(3);
    expect(single.every((a) => a.frameSlot === undefined)).toBe(true);
  });

  test("mergeUploadedUrls applies just-uploaded urls without waiting for React state", () => {
    const portrait: UploadedAsset = {
      id: "portrait:p1",
      name: "portrait",
      url: "https://cdn.example.com/portrait.webp",
      kind: "image",
      progress: 100,
      status: "success",
    };
    const pending: UploadedAsset = {
      id: "pending-1",
      name: "ref.png",
      url: "",
      kind: "image",
      progress: 0,
      status: "pending",
    };

    const merged = mergeUploadedUrls(
      [portrait, pending],
      new Map([["pending-1", "https://cdn.example.com/ref.png"]]),
    );

    expect(getSuccessfulUrls(merged, "image")).toEqual([
      "https://cdn.example.com/portrait.webp",
      "https://cdn.example.com/ref.png",
    ]);
    // Stale pre-merge assets would only return the portrait
    expect(getSuccessfulUrls([portrait, pending], "image")).toEqual([
      "https://cdn.example.com/portrait.webp",
    ]);
  });
});

describe("media validation", () => {
  test("accepts KIE-supported extensions and rejects others", () => {
    const png = new File([new Uint8Array([1])], "a.png", {
      type: "image/png",
    });
    const webm = new File([new Uint8Array([1])], "a.webm", {
      type: "video/webm",
    });
    const mp4 = new File([new Uint8Array([1])], "a.mp4", {
      type: "video/mp4",
    });
    const m4a = new File([new Uint8Array([1])], "a.m4a", {
      type: "audio/mp4",
    });

    expect(validateMediaFile(png, "image")).toBeNull();
    expect(validateMediaFile(mp4, "video")).toBeNull();
    expect(validateMediaFile(webm, "video")).toMatch(/unsupported format/i);
    expect(validateMediaFile(m4a, "audio")).toMatch(/unsupported format/i);
  });

  test("rejects oversized files", () => {
    const big = new File([new Uint8Array([1])], "big.png", {
      type: "image/png",
    });
    Object.defineProperty(big, "size", { value: 31 * 1024 * 1024 });
    expect(validateMediaFile(big, "image")).toMatch(/too large/i);
  });
});
