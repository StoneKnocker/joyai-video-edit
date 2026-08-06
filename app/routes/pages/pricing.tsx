import { ArrowRight } from "lucide-react";
import FAQ from "~/components/faq";
import { SeedancePricing } from "~/components/landing/seedance-pricing";
import { StructuredData } from "~/components/structured-data";
import { replaceAppNamePlaceholders } from "~/lib/content-placeholder";
import { getPublicEnv } from "~/lib/env.server";
import { useSupportEmail } from "~/lib/public-env";
import { buildPricingStructuredData } from "~/lib/structured-data";
import resources from "~/locales";
import { getLocale } from "~/middlewares/i18next";
import type { PricingPageContent } from "~/types/pricing";

import type { Route } from "./+types/pricing";

export const meta: Route.MetaFunction = ({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>;
}) => {
  const contentData = loaderData.contentData;
  return [
    { title: contentData.meta.title },
    { name: "description", content: contentData.meta.description },
  ];
};

export const loader = async ({ context }: Route.LoaderArgs) => {
  const locale = getLocale(context);

  const raw = resources[locale]?.pricing as PricingPageContent | undefined;

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

export default function PricingRoute({ loaderData }: Route.ComponentProps) {
  const { appName, appUrl, contentData, locale } = loaderData;
  const supportEmail = useSupportEmail();
  const structuredData = buildPricingStructuredData({
    appName,
    appUrl,
    contentData,
    locale,
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      <StructuredData data={structuredData} />

      <div className="relative pt-24 pb-8">
        <SeedancePricing />
      </div>

      <FAQ
        title={contentData.faq.title}
        description={contentData.faq.description}
        items={contentData.faq.items}
      />

      <div className="mx-auto max-w-4xl px-4 pb-24 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <h3 className="mb-3 font-bold text-foreground text-xl">
            {contentData.page.unsureSection.title}
          </h3>
          <p className="mx-auto mb-5 max-w-2xl text-muted-foreground">
            {contentData.page.unsureSection.description}
          </p>
          <a
            href={`mailto:${supportEmail}`}
            className="inline-flex items-center gap-2 font-semibold text-primary transition-colors hover:text-primary/80"
          >
            {contentData.page.unsureSection.linkText}
            <ArrowRight size={16} />
          </a>
        </div>
      </div>
    </div>
  );
}
