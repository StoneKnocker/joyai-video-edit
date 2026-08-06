import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("~/lib/env.server", () => ({
  isDevelopment: true,
  serverEnv: {
    SUBOTIZ_API_KEY: "test_secret_key",
    SUBOTIZ_API_BASE: undefined,
    SUBOTIZ_ENABLED: "true",
    CREEM_ENABLED: "false",
    PAYMENT_PROVIDER: "subotiz",
    APP_URL: "http://localhost:3000",
  },
}));

import { fallbackWebhookEventId, verifySubotizWebhook } from "./subotiz.server";

describe("Subotiz webhook signature", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("accepts a valid HMAC-SHA256 signature", () => {
    const timestamp = "1710000000000";
    const body = JSON.stringify({
      id: "1",
      type: "v2.trades.succeeded",
      data: {},
    });
    const signature = createHmac("sha256", "test_secret_key")
      .update(`${timestamp}.`)
      .update(body)
      .digest("hex");

    expect(verifySubotizWebhook(timestamp, body, signature)).toBe(true);
  });

  it("rejects an invalid signature", () => {
    const timestamp = "1710000000000";
    const body = '{"id":"1"}';
    expect(verifySubotizWebhook(timestamp, body, "deadbeef")).toBe(false);
  });

  it("rejects empty inputs", () => {
    expect(verifySubotizWebhook("", "{}", "abc")).toBe(false);
    expect(verifySubotizWebhook("1", "", "abc")).toBe(false);
  });

  it("builds a stable fallback event id", () => {
    const a = fallbackWebhookEventId("1", "body");
    const b = fallbackWebhookEventId("1", "body");
    const c = fallbackWebhookEventId("1", "other");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toHaveLength(40);
  });
});
