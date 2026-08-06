import type { Resource } from "i18next";

// 自动加载所有翻译文件。`{{appName}}` 等占位符由 i18next defaultVariables
// 或调用方在 request 时用 getPublicEnv().APP_NAME 替换，不在此处硬编码品牌名。
const translationFiles = import.meta.glob("./json/**/*.json", { eager: true });

/**
 * 从文件路径中提取语言和命名空间
 * 路径格式: ./json/{lang}/{namespace}.json
 */
function extractLocaleInfo(
  filePath: string,
): { lang: string; namespace: string } | null {
  const regex = /^\.\/json\/([^/]+)\/([^/]+)\.json$/;
  const match = filePath.match(regex);

  if (!match) {
    return null;
  }

  const lang = match[1];
  const namespace = match[2];

  if (!lang || !namespace) {
    return null;
  }

  return { lang, namespace };
}

const resources: Resource = {};

for (const [filePath, module] of Object.entries(translationFiles)) {
  const localeInfo = extractLocaleInfo(filePath);

  if (!localeInfo) {
    continue;
  }

  const { lang, namespace } = localeInfo;

  if (!resources[lang]) {
    resources[lang] = {};
  }

  const langResources = resources[lang];

  if (langResources) {
    langResources[namespace] = (
      module as { default: Record<string, string> }
    ).default;
  }
}

export default resources;
