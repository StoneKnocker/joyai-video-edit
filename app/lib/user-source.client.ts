const USER_SOURCE_COOKIE_NAME = "user_source_data";
const COOKIE_MAX_AGE_DAYS = 30;

interface UserSourceData {
  firstVisitAt: number;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  referrer: string;
  landingUrl: string;
  deviceType: string;
  browser: string;
  os: string;
}

function getCookie(name: string): string | null {
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.split("=");
    if (cookieName === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }
  return null;
}

function setCookie(name: string, value: string, days: number): void {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is not universally available yet.
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getUtmParams(): Pick<
  UserSourceData,
  "utmSource" | "utmMedium" | "utmCampaign" | "utmContent" | "utmTerm"
> {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") || "",
    utmMedium: params.get("utm_medium") || "",
    utmCampaign: params.get("utm_campaign") || "",
    utmContent: params.get("utm_content") || "",
    utmTerm: params.get("utm_term") || "",
  };
}

function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    return "tablet";
  }
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) {
    return "mobile";
  }
  return "desktop";
}

function getBrowser(): string {
  const ua = navigator.userAgent;

  if (ua.includes("Firefox/")) return "Firefox";
  if (ua.includes("Edg/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  if (ua.includes("MSIE") || ua.includes("Trident/")) return "IE";

  return "Unknown";
}

function getOS(): string {
  const ua = navigator.userAgent;
  const platform = navigator.platform || "";

  if (ua.includes("Win")) return "Windows";
  if (ua.includes("Mac")) return "macOS";
  if (ua.includes("Linux") && !ua.includes("Android")) return "Linux";
  if (ua.includes("Android")) return "Android";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (ua.includes("CrOS")) return "ChromeOS";

  return platform || "Unknown";
}

function collectUserSourceData(): UserSourceData {
  const utmParams = getUtmParams();

  return {
    firstVisitAt: Date.now(),
    ...utmParams,
    referrer: document.referrer || "",
    landingUrl: window.location.pathname + window.location.search,
    deviceType: getDeviceType(),
    browser: getBrowser(),
    os: getOS(),
  };
}

/**
 * Initialize user source tracking.
 * Should be called once when the app loads.
 * Only stores data on first visit (cookie doesn't exist yet).
 */
export function initUserSourceTracking(): void {
  // Only run on client
  if (typeof window === "undefined") return;

  // Check if cookie already exists
  const existingCookie = getCookie(USER_SOURCE_COOKIE_NAME);
  if (existingCookie) {
    // Cookie exists, don't overwrite
    return;
  }

  // Collect and store user source data
  const data = collectUserSourceData();
  setCookie(USER_SOURCE_COOKIE_NAME, JSON.stringify(data), COOKIE_MAX_AGE_DAYS);
}
