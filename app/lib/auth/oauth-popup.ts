import { fetchAuthSession } from "./auth-session";

export const OAUTH_POPUP_CHANNEL = "vidrush:oauth-popup" as const;

export type OAuthPopupMessage =
  | {
      channel: typeof OAUTH_POPUP_CHANNEL;
      type: "success";
      state: string;
    }
  | {
      channel: typeof OAUTH_POPUP_CHANNEL;
      type: "error";
      state: string;
      message: string;
    };

export type OAuthPopupResult =
  | { status: "success" }
  | { status: "error"; message: string }
  | { status: "cancelled" }
  | { status: "blocked" };

export type OpenOAuthPopupOptions = {
  provider?: string;
  /** Max time to wait for popup completion. Default 5 minutes. */
  timeoutMs?: number;
  /** Override for tests / non-browser environments. */
  fetchSession?: () => Promise<{ user?: unknown } | null>;
  openWindow?: typeof window.open;
};

const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const CLOSED_POLL_MS = 400;
const NOTIFY_KEY_PREFIX = "oauth-popup-notified:";

export function createOAuthState(): string {
  return crypto.randomUUID();
}

export function parseOAuthPopupMessage(
  data: unknown,
): OAuthPopupMessage | null {
  if (!data || typeof data !== "object") return null;

  const msg = data as Record<string, unknown>;
  if (msg.channel !== OAUTH_POPUP_CHANNEL) return null;
  if (typeof msg.state !== "string" || msg.state.length === 0) return null;

  if (msg.type === "success") {
    return {
      channel: OAUTH_POPUP_CHANNEL,
      type: "success",
      state: msg.state,
    };
  }

  if (msg.type === "error") {
    const message =
      typeof msg.message === "string" && msg.message.length > 0
        ? msg.message
        : "Authentication failed";
    return {
      channel: OAUTH_POPUP_CHANNEL,
      type: "error",
      state: msg.state,
      message,
    };
  }

  return null;
}

/**
 * Validate a raw postMessage event against expected origin + state.
 * Pure helper — safe to unit test without a browser.
 */
export function matchOAuthPopupMessage(
  data: unknown,
  expectedState: string,
  expectedOrigin: string,
  actualOrigin: string,
): OAuthPopupMessage | null {
  if (actualOrigin !== expectedOrigin) return null;
  const message = parseOAuthPopupMessage(data);
  if (!message || message.state !== expectedState) return null;
  return message;
}

export function buildOAuthCallbackUrl(state: string, origin?: string): string {
  const base = origin ?? window.location.origin;
  const url = new URL("/auth/callback", base);
  url.searchParams.set("popup", "1");
  url.searchParams.set("state", state);
  return url.toString();
}

export function buildOAuthPopupPath(
  state: string,
  provider = "google",
): string {
  const params = new URLSearchParams({
    state,
    provider,
  });
  return `/auth/popup?${params.toString()}`;
}

/**
 * Notify the opener window (if any). Idempotent per state+type in this tab
 * via sessionStorage, so React Strict Mode double-effects do not double-post.
 */
export function notifyOAuthOpener(
  payload:
    | { type: "success"; state: string }
    | {
        type: "error";
        state: string;
        message: string;
      },
): boolean {
  if (!payload.state) return false;

  const message: OAuthPopupMessage =
    payload.type === "success"
      ? {
          channel: OAUTH_POPUP_CHANNEL,
          type: "success",
          state: payload.state,
        }
      : {
          channel: OAUTH_POPUP_CHANNEL,
          type: "error",
          state: payload.state,
          message: payload.message,
        };

  try {
    const key = `${NOTIFY_KEY_PREFIX}${message.state}:${message.type}`;
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage may be unavailable (private mode quirks, etc.)
  }

  if (typeof window === "undefined") return false;
  if (!window.opener || window.opener.closed) return false;

  window.opener.postMessage(message, window.location.origin);
  return true;
}

/**
 * Open a same-origin OAuth popup and wait until success, error, cancel, or block.
 *
 * Success is never trusted from postMessage alone — the opener always re-checks
 * session via fetchSession / getSession. If postMessage is lost but the cookie
 * was set, popup.closed + getSession still resolves success.
 */
export function openOAuthPopup(
  options: OpenOAuthPopupOptions = {},
): Promise<OAuthPopupResult> {
  const {
    provider = "google",
    timeoutMs = DEFAULT_TIMEOUT_MS,
    fetchSession = fetchAuthSession,
    openWindow = window.open.bind(window),
  } = options;

  const state = createOAuthState();
  const popup = openWindow(
    buildOAuthPopupPath(state, provider),
    "oauth_popup",
    "width=500,height=600,scrollbars=yes,resizable=yes",
  );

  if (!popup) {
    return Promise.resolve({ status: "blocked" });
  }

  return new Promise<OAuthPopupResult>((resolve) => {
    let settled = false;
    let closedTimer: ReturnType<typeof setInterval> | undefined;
    let timeoutTimer: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      window.removeEventListener("message", onMessage);
      if (closedTimer !== undefined) clearInterval(closedTimer);
      if (timeoutTimer !== undefined) clearTimeout(timeoutTimer);
    };

    const resolveOnce = (result: OAuthPopupResult) => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve(result);
    };

    const finishSuccess = async () => {
      if (settled) return;
      try {
        const session = await fetchSession();
        if (session?.user) {
          resolveOnce({ status: "success" });
          return;
        }
        resolveOnce({
          status: "error",
          message: "Session not established",
        });
      } catch {
        resolveOnce({
          status: "error",
          message: "Session not established",
        });
      }
    };

    const onMessage = (event: MessageEvent) => {
      const message = matchOAuthPopupMessage(
        event.data,
        state,
        window.location.origin,
        event.origin,
      );
      if (!message) return;

      if (message.type === "success") {
        void finishSuccess();
        return;
      }

      resolveOnce({ status: "error", message: message.message });
    };

    window.addEventListener("message", onMessage);

    closedTimer = setInterval(() => {
      if (!popup.closed) return;
      // Stop polling immediately; session check may take a tick.
      if (closedTimer !== undefined) {
        clearInterval(closedTimer);
        closedTimer = undefined;
      }
      void (async () => {
        if (settled) return;
        try {
          const session = await fetchSession();
          if (session?.user) {
            resolveOnce({ status: "success" });
            return;
          }
        } catch {
          // treat as cancel below
        }
        resolveOnce({ status: "cancelled" });
      })();
    }, CLOSED_POLL_MS);

    timeoutTimer = setTimeout(() => {
      try {
        popup.close();
      } catch {
        // ignore
      }
      resolveOnce({ status: "cancelled" });
    }, timeoutMs);
  });
}
