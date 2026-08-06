import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { getServerSession } from "~/lib/auth/auth.server";
import { getSessionFromAls } from "~/middlewares/auth-guard";

/**
 * Parse guestId from cookie header.
 * Matches the cookie format set by client-side getGuestId() in app/lib/utils.ts
 */
function getGuestIdFromCookie(cookieHeader: string | null): string {
  if (!cookieHeader) return "";

  const match = cookieHeader.match(/guestId=([^;]+)/);
  return match?.[1] ?? "";
}

/**
 * Get client IP from request headers
 */
function getClientIp(req: Request): string {
  // Cloudflare sets this header
  const cfConnectingIp = req.headers.get("CF-Connecting-IP");
  if (cfConnectingIp) return cfConnectingIp;

  // Standard proxy headers
  const forwardedFor = req.headers.get("X-Forwarded-For");
  if (forwardedFor) {
    // X-Forwarded-For: client, proxy1, proxy2
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  return "";
}

export async function createContext({
  req,
  resHeaders,
}: FetchCreateContextFnOptions) {
  // Prefer session already resolved by root setAuth middleware (one getSession per request)
  const fromAls = getSessionFromAls();
  const session = fromAls !== undefined ? fromAls : await getServerSession(req);
  const guestId = getGuestIdFromCookie(req.headers.get("cookie"));
  const guestIp = getClientIp(req);

  return {
    req,
    resHeaders,
    session,
    user: session?.user ?? null,
    guestId,
    guestIp,
  };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
