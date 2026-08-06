import {
  createUserSource,
  getUserSourceByUserId,
} from "@/lib/model/userSource";
import { getCity, getCountry } from "../cf.server";

const USER_SOURCE_COOKIE_NAME = "user_source_data";

interface UserSourceCookieData {
  firstVisitAt?: number;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  referrer?: string;
  landingUrl?: string;
  deviceType?: string;
  browser?: string;
  os?: string;
}

function sanitizeString(value: unknown, maxLength = 500): string {
  if (typeof value !== "string") return "";
  // Trim and limit length to prevent excessive data
  return value.trim().slice(0, maxLength);
}

function parseCookieValue(
  cookieHeader: string | null,
  name: string,
): UserSourceCookieData | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.split("=");
    if (cookieName === name) {
      try {
        const value = decodeURIComponent(valueParts.join("="));
        const parsed = JSON.parse(value);

        // Validate and sanitize each field explicitly
        const validated: UserSourceCookieData = {
          firstVisitAt:
            typeof parsed.firstVisitAt === "number" &&
            parsed.firstVisitAt > 0 &&
            parsed.firstVisitAt < Date.now() + 86400000
              ? parsed.firstVisitAt
              : undefined,
          utmSource: sanitizeString(parsed.utmSource, 100),
          utmMedium: sanitizeString(parsed.utmMedium, 100),
          utmCampaign: sanitizeString(parsed.utmCampaign, 200),
          utmContent: sanitizeString(parsed.utmContent, 200),
          utmTerm: sanitizeString(parsed.utmTerm, 200),
          referrer: sanitizeString(parsed.referrer, 500),
          landingUrl: sanitizeString(parsed.landingUrl, 500),
          deviceType: sanitizeString(parsed.deviceType, 50),
          browser: sanitizeString(parsed.browser, 100),
          os: sanitizeString(parsed.os, 100),
        };
        return validated;
      } catch {
        return null;
      }
    }
  }
  return null;
}

export async function createUserSourceForNewUser(
  userId: string,
  _request: Request,
  headers: Headers,
): Promise<void> {
  // 1. Check if record already exists (prevent duplicates)
  const existing = await getUserSourceByUserId(userId);
  if (existing) {
    return;
  }

  // 2. Get geographic info from Cloudflare cf properties
  const country = getCountry() || "";
  const city = getCity() || "";

  // 3. Get IP address from Cloudflare headers
  const ipAddress =
    headers.get("cf-connecting-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "";

  // 4. Parse cookie data collected by frontend
  const cookieData = parseCookieValue(
    headers.get("cookie"),
    USER_SOURCE_COOKIE_NAME,
  );

  // 5. Create user_source record
  await createUserSource({
    userId,
    firstVisitAt: cookieData?.firstVisitAt
      ? new Date(cookieData.firstVisitAt)
      : new Date(),
    utmSource: cookieData?.utmSource || "",
    utmMedium: cookieData?.utmMedium || "",
    utmCampaign: cookieData?.utmCampaign || "",
    utmContent: cookieData?.utmContent || "",
    utmTerm: cookieData?.utmTerm || "",
    referrer: cookieData?.referrer || "",
    landingUrl: cookieData?.landingUrl || "",
    deviceType: cookieData?.deviceType || "",
    browser: cookieData?.browser || "",
    os: cookieData?.os || "",
    country,
    city,
    ipAddress,
  });
}
