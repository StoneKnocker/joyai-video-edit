import { replaceAppNamePlaceholders } from "~/lib/content-placeholder";
import { getPublicEnv } from "~/lib/env.server";
import resources from "~/locales";
import type { BlogPost } from "~/types/blog";

async function getAllContentPosts() {
  const contentModule = await import("content-collections");
  return (contentModule.allPosts || []) as BlogPost[];
}

export type BlogCopy = {
  articleEyebrow: string;
  backToList: string;
  description: string;
  emptyDescription: string;
  emptyTitle: string;
  readMore: string;
  title: string;
};

type TranslationCopy = {
  blog?: BlogCopy;
  navigation?: {
    home: string;
  };
};

export async function getBlogPosts(locale: string) {
  const posts = await getAllContentPosts();
  const { APP_NAME } = getPublicEnv();

  return posts
    .filter((post) => post.kind === "blog" && post.lang === locale && post.slug)
    .map((post) => replaceAppNamePlaceholders(post, APP_NAME))
    .sort((a, b) => {
      const aTime = new Date(a.publishedAt || a.lastModified).getTime();
      const bTime = new Date(b.publishedAt || b.lastModified).getTime();
      return bTime - aTime;
    });
}

export async function getBlogPostBySlug(locale: string, slug: string) {
  const posts = await getBlogPosts(locale);
  return posts.find((post) => post.slug === slug) || null;
}

export function getBlogCopy(locale: string) {
  const translation = resources[locale]?.translation as
    | TranslationCopy
    | undefined;
  const copy = translation?.blog;

  if (!copy) {
    throw new Error(`No blog copy found for locale: ${locale}`);
  }

  return replaceAppNamePlaceholders(copy, getPublicEnv().APP_NAME);
}

export function getBlogLabels(locale: string) {
  const translation = resources[locale]?.translation as
    | TranslationCopy
    | undefined;
  const copy = getBlogCopy(locale);

  return {
    articleEyebrow: copy.articleEyebrow,
    backToList: copy.backToList,
    blog: copy.title,
    home: translation?.navigation?.home || "Home",
  };
}

export async function getRequiredBlogPost(locale: string, slug: string) {
  const post = await getBlogPostBySlug(locale, slug);
  if (!post) {
    throw new Response("Blog article not found", { status: 404 });
  }

  return post;
}
