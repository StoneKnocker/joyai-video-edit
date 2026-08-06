import { i18nConfig } from "~/lib/config";
import { replaceAppNamePlaceholders } from "~/lib/content-placeholder";
import { getPublicEnv } from "~/lib/env.server";

interface LoaderArgs {
  params: { locale?: string };
}

export interface PolicyContent {
  title: string;
  content: string;
  lang: string;
  lastModified: string | Date;
  _meta?: {
    fileName?: string;
  };
}

export interface PolicyLoaderData {
  appName: string;
  content: PolicyContent | null;
}

export async function policyLoader({
  params,
  filePattern,
}: {
  params: LoaderArgs["params"];
  filePattern: string;
}): Promise<PolicyLoaderData> {
  const locale = params.locale || i18nConfig.defaultLanguage;
  const { APP_NAME: appName } = getPublicEnv();

  try {
    // Dynamic import to handle the generated module.
    const contentModule = await import("content-collections");

    if (!contentModule) {
      throw new Error("Content module not found");
    }

    // Find content for the specified locale.
    const allContent = (contentModule.allPosts || []) as PolicyContent[];
    const content = allContent.find(
      (item) =>
        item.lang === locale && item._meta?.fileName?.includes(filePattern),
    );

    if (!content) {
      return { appName, content: null };
    }

    return {
      appName,
      content: replaceAppNamePlaceholders(content, appName),
    };
  } catch (error) {
    console.error(`Failed to load ${filePattern} content:`, error);
    return { appName, content: null };
  }
}
