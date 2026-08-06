import { VideoWorkspace } from "~/components/video-workspace";
import { StructuredData } from "~/components/structured-data";
import { SeedanceLandingSections } from "~/components/landing/seedance-landing-sections";
import { replaceAppNamePlaceholders } from "~/lib/content-placeholder";
import { getPublicEnv } from "~/lib/env.server";
import { buildSocialMeta } from "~/lib/seo";
import { buildHomeStructuredData } from "~/lib/structured-data";
import { getCanonicalUrl, getHreflangTags } from "~/lib/utils";
import resources from "~/locales";
import { getLocale } from "~/middlewares/i18next";
import type { LandingPageContent } from "~/types/landingpage";
import type { Route } from "./+types/index";

export const meta: Route.MetaFunction = ({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) => {
  const contentData = loaderData.contentData;
  const locale = loaderData.locale;
  const canonicalUrl = getCanonicalUrl(locale, "/", loaderData.appUrl);

  return [
    { title: contentData.meta.title },
    { name: "description", content: contentData.meta.description },
    {
      tagName: "link",
      rel: "canonical",
      href: canonicalUrl,
    },
    ...getHreflangTags("/", loaderData.appUrl),
    ...buildSocialMeta({
      title: contentData.meta.title,
      description: contentData.meta.description,
      url: canonicalUrl,
      type: "website",
    }),
  ];
};

export const loader = async ({ context }: Route.LoaderArgs) => {
  const locale = getLocale(context);
  const raw = resources[locale]?.index as LandingPageContent | undefined;

  if (!raw) {
    throw new Error(`No content data found for locale: ${locale}`);
  }

  const publicEnv = getPublicEnv();
  const contentData = replaceAppNamePlaceholders(raw, publicEnv.APP_NAME);

  return {
    appName: publicEnv.APP_NAME,
    appUrl: publicEnv.APP_URL,
    contentData,
    locale,
  };
};

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  const { appName, appUrl, contentData, locale } = loaderData;
  const structuredData = buildHomeStructuredData({
    appName,
    appUrl,
    contentData,
    locale,
  });

  return (
    <div className="landing-theme relative flex w-full flex-col overflow-hidden bg-background text-foreground">
      <StructuredData data={structuredData} />

      <section className="relative px-4 pt-8 pb-2 text-center sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,_rgba(0,217,146,0.12),transparent_60%)]" />
        <div className="relative mx-auto max-w-3xl">
          <h1 className="text-balance font-display font-extrabold text-[34px] leading-[1.2] tracking-[-0.07em] text-foreground sm:text-[44px] sm:leading-[1.3] sm:tracking-[-0.04em] md:text-[56px] md:font-bold md:leading-[1.2]">
            {contentData.hero.title}
          </h1>
          <p className="mx-auto mt-4 text-base text-muted-foreground leading-snug sm:text-lg sm:leading-6">
            {contentData.hero.description}
          </p>
        </div>
      </section>

      <VideoWorkspace />
      <SeedanceLandingSections />
    </div>
  );
}
