import { describe, expect, test } from "vitest";
import { getSafeRedirectPath } from "./utils";

describe("getSafeRedirectPath", () => {
  test("returns fallback for empty values", () => {
    expect(getSafeRedirectPath(null)).toBe("/user/creations");
    expect(getSafeRedirectPath(undefined)).toBe("/user/creations");
    expect(getSafeRedirectPath("")).toBe("/user/creations");
    expect(getSafeRedirectPath("   ")).toBe("/user/creations");
  });

  test("allows same-origin relative paths", () => {
    expect(getSafeRedirectPath("/user/credits")).toBe("/user/credits");
    expect(getSafeRedirectPath("/pricing?plan=pro")).toBe("/pricing?plan=pro");
    expect(getSafeRedirectPath("/zh/user/creations")).toBe(
      "/zh/user/creations",
    );
  });

  test("blocks open redirects", () => {
    expect(getSafeRedirectPath("//evil.com")).toBe("/user/creations");
    expect(getSafeRedirectPath("https://evil.com")).toBe("/user/creations");
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/user/creations");
    expect(getSafeRedirectPath("/\\evil.com")).toBe("/user/creations");
    expect(getSafeRedirectPath("/%0d%0aLocation:%20https://evil.com")).toBe(
      "/user/creations",
    );
  });

  test("uses custom fallback", () => {
    expect(getSafeRedirectPath("//evil.com", "/home")).toBe("/home");
  });
});
