import i18next from "i18next";
import I18nextBrowserLanguageDetector from "i18next-browser-languagedetector";
import Fetch from "i18next-fetch-backend";
import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { I18nextProvider, initReactI18next } from "react-i18next";
import { HydratedRouter } from "react-router/dom";
import { i18nConfig } from "./lib/config";

async function main() {
  await i18next
    .use(initReactI18next)
    .use(Fetch)
    .use(I18nextBrowserLanguageDetector)
    .init({
      fallbackLng: i18nConfig.defaultLanguage,
      supportedLngs: i18nConfig.supportLanguages,
      // Here we only want to detect the language from the html tag
      // since the middleware already detected the language server-side
      detection: { order: ["htmlTag"], caches: [] },
      // Update this to the path where your locales will be served
      backend: { loadPath: "/api/locales/{{lng}}/{{ns}}" },
      interpolation: {
        defaultVariables: {
          // Set by root loader script before hydrate
          appName: window.ENV?.APP_NAME ?? "",
        },
      },
    });

  startTransition(() => {
    hydrateRoot(
      document,
      <I18nextProvider i18n={i18next}>
        <StrictMode>
          <HydratedRouter />
        </StrictMode>
      </I18nextProvider>,
    );
  });
}

main().catch((error) => console.error(error));
