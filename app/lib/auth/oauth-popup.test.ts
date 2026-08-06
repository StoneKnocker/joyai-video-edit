import { afterEach, describe, expect, test, vi } from "vitest";
import {
  buildOAuthCallbackUrl,
  buildOAuthPopupPath,
  matchOAuthPopupMessage,
  OAUTH_POPUP_CHANNEL,
  openOAuthPopup,
  parseOAuthPopupMessage,
} from "./oauth-popup";

describe("parseOAuthPopupMessage", () => {
  test("parses success messages", () => {
    expect(
      parseOAuthPopupMessage({
        channel: OAUTH_POPUP_CHANNEL,
        type: "success",
        state: "abc",
      }),
    ).toEqual({
      channel: OAUTH_POPUP_CHANNEL,
      type: "success",
      state: "abc",
    });
  });

  test("parses error messages with fallback text", () => {
    expect(
      parseOAuthPopupMessage({
        channel: OAUTH_POPUP_CHANNEL,
        type: "error",
        state: "abc",
      }),
    ).toEqual({
      channel: OAUTH_POPUP_CHANNEL,
      type: "error",
      state: "abc",
      message: "Authentication failed",
    });

    expect(
      parseOAuthPopupMessage({
        channel: OAUTH_POPUP_CHANNEL,
        type: "error",
        state: "abc",
        message: "Nope",
      }),
    ).toMatchObject({ message: "Nope" });
  });

  test("rejects unknown channel, type, or empty state", () => {
    expect(parseOAuthPopupMessage(null)).toBeNull();
    expect(parseOAuthPopupMessage({ type: "success", state: "x" })).toBeNull();
    expect(
      parseOAuthPopupMessage({
        channel: OAUTH_POPUP_CHANNEL,
        type: "other",
        state: "x",
      }),
    ).toBeNull();
    expect(
      parseOAuthPopupMessage({
        channel: OAUTH_POPUP_CHANNEL,
        type: "success",
        state: "",
      }),
    ).toBeNull();
  });
});

describe("matchOAuthPopupMessage", () => {
  const payload = {
    channel: OAUTH_POPUP_CHANNEL,
    type: "success" as const,
    state: "s1",
  };

  test("accepts matching origin and state", () => {
    expect(
      matchOAuthPopupMessage(
        payload,
        "s1",
        "https://app.test",
        "https://app.test",
      ),
    ).toEqual(payload);
  });

  test("rejects wrong origin or state", () => {
    expect(
      matchOAuthPopupMessage(
        payload,
        "s1",
        "https://app.test",
        "https://evil.test",
      ),
    ).toBeNull();
    expect(
      matchOAuthPopupMessage(
        payload,
        "other",
        "https://app.test",
        "https://app.test",
      ),
    ).toBeNull();
  });
});

describe("URL builders", () => {
  test("buildOAuthPopupPath includes state and provider", () => {
    expect(buildOAuthPopupPath("st", "google")).toBe(
      "/auth/popup?state=st&provider=google",
    );
  });

  test("buildOAuthCallbackUrl includes popup and state", () => {
    const url = buildOAuthCallbackUrl("st", "https://app.test");
    expect(url).toBe("https://app.test/auth/callback?popup=1&state=st");
  });
});

describe("openOAuthPopup", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  test("returns blocked when window.open fails", async () => {
    const result = await openOAuthPopup({
      openWindow: () => null,
      fetchSession: async () => null,
    });
    expect(result).toEqual({ status: "blocked" });
  });

  test("resolves success from matching postMessage after session check", async () => {
    const popup = { closed: false, close: vi.fn() };
    const openWindow = vi.fn(() => popup as unknown as Window);
    const listeners = new Map<string, Set<(event: MessageEvent) => void>>();

    vi.stubGlobal("window", {
      location: { origin: "https://app.test" },
      open: openWindow,
      addEventListener: (
        type: string,
        listener: (event: MessageEvent) => void,
      ) => {
        const set = listeners.get(type) ?? new Set();
        set.add(listener);
        listeners.set(type, set);
      },
      removeEventListener: (
        type: string,
        listener: (event: MessageEvent) => void,
      ) => {
        listeners.get(type)?.delete(listener);
      },
    });

    const pending = openOAuthPopup({
      openWindow,
      fetchSession: async () => ({ user: { id: "u1" } }),
      timeoutMs: 10_000,
    });

    const openedUrl = openWindow.mock.calls.at(0)?.at(0);
    const state = extractStateFromOpenUrl(String(openedUrl ?? ""));
    const onMessage = [...(listeners.get("message") ?? [])][0];
    expect(onMessage).toBeTypeOf("function");

    onMessage?.({
      origin: "https://app.test",
      data: {
        channel: OAUTH_POPUP_CHANNEL,
        type: "success",
        state,
      },
    } as MessageEvent);

    await expect(pending).resolves.toEqual({ status: "success" });
  });

  test("resolves error from postMessage", async () => {
    const popup = { closed: false, close: vi.fn() };
    const openWindow = vi.fn(() => popup as unknown as Window);
    const listeners = new Map<string, Set<(event: MessageEvent) => void>>();

    vi.stubGlobal("window", {
      location: { origin: "https://app.test" },
      open: openWindow,
      addEventListener: (
        type: string,
        listener: (event: MessageEvent) => void,
      ) => {
        const set = listeners.get(type) ?? new Set();
        set.add(listener);
        listeners.set(type, set);
      },
      removeEventListener: (
        type: string,
        listener: (event: MessageEvent) => void,
      ) => {
        listeners.get(type)?.delete(listener);
      },
    });

    const pending = openOAuthPopup({
      openWindow,
      fetchSession: async () => ({ user: { id: "u1" } }),
      timeoutMs: 10_000,
    });

    const openedUrl = openWindow.mock.calls.at(0)?.at(0);
    const state = extractStateFromOpenUrl(String(openedUrl ?? ""));
    const onMessage = [...(listeners.get("message") ?? [])][0];
    onMessage?.({
      origin: "https://app.test",
      data: {
        channel: OAUTH_POPUP_CHANNEL,
        type: "error",
        state,
        message: "access_denied",
      },
    } as MessageEvent);

    await expect(pending).resolves.toEqual({
      status: "error",
      message: "access_denied",
    });
  });

  test("resolves cancelled when popup closes without session", async () => {
    vi.useFakeTimers();
    const popup = { closed: false, close: vi.fn() };
    const openWindow = vi.fn(() => popup as unknown as Window);

    vi.stubGlobal("window", {
      location: { origin: "https://app.test" },
      open: openWindow,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const pending = openOAuthPopup({
      openWindow,
      fetchSession: async () => null,
      timeoutMs: 60_000,
    });

    popup.closed = true;
    await vi.advanceTimersByTimeAsync(500);

    await expect(pending).resolves.toEqual({ status: "cancelled" });
  });

  test("closed popup with existing session resolves success", async () => {
    vi.useFakeTimers();
    const popup = { closed: false, close: vi.fn() };
    const openWindow = vi.fn(() => popup as unknown as Window);

    vi.stubGlobal("window", {
      location: { origin: "https://app.test" },
      open: openWindow,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const pending = openOAuthPopup({
      openWindow,
      fetchSession: async () => ({ user: { id: "u1" } }),
      timeoutMs: 60_000,
    });

    popup.closed = true;
    await vi.advanceTimersByTimeAsync(500);

    await expect(pending).resolves.toEqual({ status: "success" });
  });
});

function extractStateFromOpenUrl(url: string): string {
  const query = url.includes("?") ? url.slice(url.indexOf("?") + 1) : "";
  return new URLSearchParams(query).get("state") ?? "";
}
