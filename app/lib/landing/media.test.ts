import { describe, expect, it } from "vitest";
import {
  allLandingImageUrls,
  LANDING_CDN_BASE,
  landingImages,
  showcaseVideoUrl,
} from "./media";

describe("landing media inventory", () => {
  it("hosts all images on project CDN under /landing", () => {
    expect(LANDING_CDN_BASE).toBe("https://cdn.joyaivideoedit.com/landing");
    expect(allLandingImageUrls.length).toBeGreaterThanOrEqual(6);
    for (const url of allLandingImageUrls) {
      expect(url.startsWith("https://cdn.joyaivideoedit.com/landing/")).toBe(
        true,
      );
      expect(url.endsWith(".webp")).toBe(true);
    }
    expect(landingImages.teaser).toContain("teaser.webp");
    expect(landingImages.cases).toHaveLength(5);
  });

  it("includes a showcase video URL from research sources", () => {
    expect(showcaseVideoUrl).toMatch(/^https:\/\//);
    expect(showcaseVideoUrl).toContain("user-attachments");
  });
});
