import { initReactI18next } from "react-i18next";
import { createI18nextMiddleware } from "remix-i18next";
import resources from "~/locales"; // Import your locales
import "i18next";
import { i18nConfig } from "~/lib/config";
import { getPublicEnv } from "~/lib/env.server";

export const [i18nextMiddleware, getLocale, getInstance] =
  createI18nextMiddleware({
    detection: {
      supportedLanguages: i18nConfig.supportLanguages, // Your supported languages, the fallback should be last
      fallbackLanguage: i18nConfig.defaultLanguage, // Your fallback language
      order: ["custom"],
      async findLocale(args: { request: Request }): Promise<string> {
        const url = new URL(args.request.url);
        const locale = url.pathname.split("/").at(1);

        // 如果路径中没有语言前缀，或者语言前缀不在支持的语言列表中，则使用英语
        if (!locale || !i18nConfig.supportLanguages.includes(locale)) {
          return i18nConfig.defaultLanguage;
        }

        return locale;
      },
    },
    i18next: {
      resources,
      interpolation: {
        defaultVariables: {
          appName: getPublicEnv().APP_NAME,
        },
      },
    },
    plugins: [initReactI18next], // Plugins you may need, like react-i18next
  });

// This adds type-safety to the `t` function
declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "translation";
    resources: typeof resources.en; // Use `en` as source of truth for the types
  }
}
