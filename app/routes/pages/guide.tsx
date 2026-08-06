import { SeedanceGuide } from "~/components/guide/seedance-guide";
import { getPublicEnv } from "~/lib/env.server";
import { buildSocialMeta } from "~/lib/seo";
import { getCanonicalUrl, getHreflangTags } from "~/lib/utils";
import { getLocale } from "~/middlewares/i18next";
import type { Route } from "./+types/guide";

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const locale = loaderData?.locale ?? "en";
  const appUrl = loaderData?.appUrl;
  const appName = loaderData?.appName ?? "VidRush AI";
  const title = `${appName} Prompt Guide - Master Seedance 2.0 Video Generation`;
  const description = `Master the art of prompting to create stunning AI-generated videos on ${appName}. Prompt techniques, multimodal references, and real-world examples for Seedance 2.0.`;
  const canonicalUrl = getCanonicalUrl(locale, "/guide", appUrl);

  return [
    { title },
    { name: "description", content: description },
    {
      tagName: "link",
      rel: "canonical",
      href: canonicalUrl,
    },
    ...getHreflangTags("/guide", appUrl),
    ...buildSocialMeta({
      title,
      description,
      url: canonicalUrl,
      type: "website",
    }),
  ];
};

export const loader = async ({ context }: Route.LoaderArgs) => {
  const publicEnv = getPublicEnv();
  return {
    appName: publicEnv.APP_NAME,
    appUrl: publicEnv.APP_URL,
    locale: getLocale(context),
  };
};

export default function GuideRoute() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background pt-20 text-foreground">
      <SeedanceGuide />
    </main>
  );
}
