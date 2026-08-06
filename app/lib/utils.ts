import { type ClassValue, clsx } from "clsx";
import { format, parseISO } from "date-fns";
import { nanoid } from "nanoid";
import { twMerge } from "tailwind-merge";
import { i18nConfig } from "~/lib/config";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate canonical URL for SEO purposes.
 * Handles locale-specific URLs, excluding default locale from path.
 */
export function getCanonicalUrl(
  locale: string,
  path: string,
  appUrl?: string,
): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const defaultLocale = i18nConfig.defaultLanguage;
  const baseUrl =
    appUrl ??
    (typeof window !== "undefined" ? window.ENV?.APP_URL : undefined) ??
    "";
  const localizedPath =
    locale === defaultLocale
      ? cleanPath
      : cleanPath === "/"
        ? `/${locale}`
        : `/${locale}${cleanPath}`;

  if (!baseUrl) {
    return localizedPath;
  }

  return new URL(localizedPath, baseUrl).toString();
}

/**
 * Generate hreflang alternate link tags for all supported languages.
 * Includes x-default pointing to the default locale.
 */
export function getHreflangTags(
  path: string,
  appUrl?: string,
): Array<{
  tagName: "link";
  rel: "alternate";
  hrefLang: string;
  href: string;
}> {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const tags = i18nConfig.supportLanguages.map((lang) => ({
    tagName: "link" as const,
    rel: "alternate" as const,
    hrefLang: lang,
    href: getCanonicalUrl(lang, cleanPath, appUrl),
  }));
  tags.push({
    tagName: "link" as const,
    rel: "alternate" as const,
    hrefLang: "x-default",
    href: getCanonicalUrl(i18nConfig.defaultLanguage, cleanPath, appUrl),
  });
  return tags;
}

export function getLocalizedPath(locale: string, path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedLocale = i18nConfig.supportLanguages.includes(locale)
    ? locale
    : i18nConfig.defaultLanguage;

  return normalizedLocale === i18nConfig.defaultLanguage
    ? cleanPath
    : cleanPath === "/"
      ? `/${normalizedLocale}`
      : `/${normalizedLocale}${cleanPath}`;
}

/**
 * Resolve a post-login redirect target safely.
 * Only same-origin relative paths are allowed (blocks open redirects).
 */
export function getSafeRedirectPath(
  redirectTo: string | null | undefined,
  fallback = "/user/creations",
): string {
  if (!redirectTo) return fallback;

  let candidate = redirectTo.trim();
  try {
    candidate = decodeURIComponent(candidate);
  } catch {
    return fallback;
  }

  // Relative path only: /foo — reject //evil.com, https:, javascript:, etc.
  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.startsWith("/\\") ||
    candidate.includes("\\") ||
    candidate.includes("\0") ||
    /[\r\n]/.test(candidate)
  ) {
    return fallback;
  }

  return candidate;
}

export function formatDate(
  date: Date | string,
  formatString = "yyyy-MM-dd",
): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, formatString);
}

/** Convert a kebab-case plan id (e.g. "pro-monthly") to a display label ("Pro Monthly"). */
export function formatPlanLabel(planId: string): string {
  return planId
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function getGuestId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  let guestId = localStorage.getItem("guestId");
  if (guestId) {
    return guestId;
  }

  guestId = nanoid();
  localStorage.setItem("guestId", guestId);

  // biome-ignore lint/suspicious/noDocumentCookie: Cookie Store API is not universally available yet.
  document.cookie = `guestId=${guestId}; path=/; max-age=${30 * 24 * 60 * 60};`;

  return guestId;
}
