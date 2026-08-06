import { redirect } from "react-router";
import { i18nConfig } from "./config";

/**
 * Regex to match language prefix at the start of URL path
 * Matches: /en, /en/, /en/page, /es?query
 * Does not match: /eng, /english, /api/en
 */
const LANGUAGE_PREFIX_REGEX = /^\/([a-z]{2})(\/|$|\?)/;

/**
 * Handles language prefix routing:
 * - /en/* → redirect to /* (default language uses clean URLs)
 * - /es/* → pass through (supported non-default language)
 * - /zh/* → 404 (unsupported language)
 */
async function handleLanguageRouting(request: Request) {
  const url = new URL(request.url);
  const match = url.pathname.match(LANGUAGE_PREFIX_REGEX);

  if (!match) return; // No language prefix, pass through

  const lang = match[1];
  const { supportLanguages, defaultLanguage } = i18nConfig;

  // Default language: redirect to clean URL without prefix
  if (lang === defaultLanguage) {
    const newPath = url.pathname.slice(3) || "/";
    url.pathname = newPath;
    throw redirect(url.toString(), 301);
  }

  // Supported non-default language: pass through
  if (lang && supportLanguages.includes(lang)) {
    return;
  }

  // Unsupported language: return 404
  throw new Response("Not Found", { status: 404 });
}

async function ensureSecure(request: Request) {
  const proto = request.headers.get("x-forwarded-proto");
  // this indirectly allows `http://localhost` because there is no
  // "x-forwarded-proto" in the local server headers
  if (proto === "http") {
    const secureUrl = new URL(request.url);
    secureUrl.protocol = "https:";
    throw redirect(secureUrl.toString());
  }
}

async function removeTrailingSlashes(request: Request) {
  const url = new URL(request.url);
  if (url.pathname.endsWith("/") && url.pathname !== "/") {
    url.pathname = url.pathname.slice(0, -1);
    throw redirect(url.toString());
  }
}

export async function requestMiddleware(request: Request) {
  await handleLanguageRouting(request);
  await ensureSecure(request);
  await removeTrailingSlashes(request);
}
