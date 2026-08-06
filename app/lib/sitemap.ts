import { getLocalizedPath } from "~/lib/utils";
import { i18nConfig } from "./config";

type ContentPost = {
  lang?: string;
  lastModified?: string;
  kind?: string;
  publishedAt?: string;
  slug?: string;
};

type SitemapEntry = {
  lastmod?: string;
  loc: string;
};

const staticPublicPaths = [
  "/",
  "/blog",
  "/privacy-policy",
  "/cookie-policy",
  "/terms-and-conditions",
  "/refund-policy",
] as const;

function normalizeBaseUrl(baseUrl: string) {
  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

function toAbsoluteUrl(baseUrl: string, locale: string, path: string) {
  return new URL(
    getLocalizedPath(locale, path),
    normalizeBaseUrl(baseUrl),
  ).toString();
}

function toLastmod(dateValue?: string) {
  if (!dateValue) {
    return undefined;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

async function getAllContentPosts() {
  const contentModule = await import("content-collections");
  return (contentModule.allPosts || []) as ContentPost[];
}

export async function getSitemapEntries(baseUrl: string) {
  const staticEntries: SitemapEntry[] = i18nConfig.supportLanguages.flatMap(
    (locale) =>
      staticPublicPaths.map((path) => ({
        loc: toAbsoluteUrl(baseUrl, locale, path),
      })),
  );

  const posts = await getAllContentPosts();
  const blogEntries: SitemapEntry[] = posts
    .filter((post) => post.kind === "blog" && post.lang && post.slug)
    .map((post) => ({
      loc: toAbsoluteUrl(baseUrl, post.lang as string, `/blog/${post.slug}`),
      lastmod: toLastmod(post.publishedAt || post.lastModified),
    }));

  return [...staticEntries, ...blogEntries];
}

export function buildSitemapXml(entries: SitemapEntry[]) {
  const urlset = entries
    .map((entry) => {
      const lastmodTag = entry.lastmod
        ? `<lastmod>${entry.lastmod}</lastmod>`
        : "";

      return `<url><loc>${entry.loc}</loc>${lastmodTag}</url>`;
    })
    .join("");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urlset,
    "</urlset>",
  ].join("");
}
