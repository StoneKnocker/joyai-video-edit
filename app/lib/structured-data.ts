import { getCanonicalUrl } from "~/lib/utils";
import type { LandingPageContent } from "~/types/landingpage";
import type { PricingPageContent } from "~/types/pricing";

type JsonLdNode = Record<string, unknown>;

interface SchemaContext {
  appName: string;
  appUrl?: string;
  locale: string;
  path?: string;
}

function getBaseUrl(appUrl?: string) {
  return appUrl || "";
}

function toAbsoluteUrl(pathOrUrl: string, appUrl?: string) {
  const baseUrl = getBaseUrl(appUrl);

  if (!baseUrl) {
    return pathOrUrl;
  }

  return new URL(pathOrUrl, baseUrl).toString();
}

/** Strip HTML tags and light markdown markers for plain-text schema fields. */
function stripMarkup(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function getHomeUrl(context: SchemaContext) {
  return getCanonicalUrl(context.locale, context.path || "/", context.appUrl);
}

function organizationSchema(context: SchemaContext): JsonLdNode {
  const homeUrl = getHomeUrl(context);

  return {
    "@type": "Organization",
    "@id": `${homeUrl}#organization`,
    name: context.appName,
    url: homeUrl,
    logo: toAbsoluteUrl("/logo.png", context.appUrl),
  };
}

function websiteSchema(context: SchemaContext): JsonLdNode {
  const homeUrl = getHomeUrl(context);

  return {
    "@type": "WebSite",
    "@id": `${homeUrl}#website`,
    name: context.appName,
    url: homeUrl,
    publisher: {
      "@id": `${homeUrl}#organization`,
    },
  };
}

function softwareApplicationSchema({
  context,
  description,
  offers,
}: {
  context: SchemaContext;
  description: string;
  offers?: JsonLdNode[];
}): JsonLdNode {
  const homeUrl = getHomeUrl(context);

  return {
    "@type": "SoftwareApplication",
    "@id": `${homeUrl}#software`,
    name: context.appName,
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Web",
    url: homeUrl,
    description: stripMarkup(description),
    offers:
      offers && offers.length > 0
        ? offers
        : {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            url: homeUrl,
          },
    publisher: {
      "@id": `${homeUrl}#organization`,
    },
  };
}

function faqPageSchema({
  id,
  items,
}: {
  id: string;
  items: Array<{ question: string; answer: string }>;
}): JsonLdNode | null {
  const visibleItems = items
    .map((item) => ({
      question: stripMarkup(item.question),
      answer: stripMarkup(item.answer),
    }))
    .filter((item) => item.question && item.answer);

  if (!visibleItems.length) {
    return null;
  }

  return {
    "@type": "FAQPage",
    "@id": id,
    mainEntity: visibleItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

function makeGraph(nodes: Array<JsonLdNode | null>): JsonLdNode {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}

export function buildHomeStructuredData({
  appName,
  appUrl,
  contentData,
  locale,
  path,
}: SchemaContext & {
  contentData: LandingPageContent;
}) {
  const context = { appName, appUrl, locale, path };

  return makeGraph([
    organizationSchema(context),
    websiteSchema(context),
    softwareApplicationSchema({
      context,
      description: contentData.meta.description,
    }),
  ]);
}

function pricingOffers({
  appName,
  appUrl,
  contentData,
  locale,
}: SchemaContext & {
  contentData: PricingPageContent;
}) {
  const pricingUrl = getCanonicalUrl(locale, "/pricing", appUrl);
  const subscriptionOffers = contentData.subscriptionPlans
    .map((plan) => {
      const yearlyPrice = plan.cycles.yearly.price;

      if (typeof yearlyPrice !== "number") {
        return null;
      }

      return {
        "@type": "Offer",
        name: `${appName} ${plan.name}`,
        description: stripMarkup(plan.description),
        price: String(yearlyPrice),
        priceCurrency: "USD",
        url: pricingUrl,
        category: "subscription",
      };
    })
    .filter(Boolean) as JsonLdNode[];
  const creditPackOffers = contentData.creditPacks.map((pack) => ({
    "@type": "Offer",
    name: `${appName} ${pack.name}`,
    description: stripMarkup(pack.description || `${pack.credits} credits`),
    price: String(pack.price),
    priceCurrency: "USD",
    url: pricingUrl,
    category: "credit pack",
  }));

  return [...subscriptionOffers, ...creditPackOffers];
}

export function buildPricingStructuredData({
  appName,
  appUrl,
  contentData,
  locale,
}: SchemaContext & {
  contentData: PricingPageContent;
}) {
  const context = { appName, appUrl, locale };
  const pricingUrl = getCanonicalUrl(locale, "/pricing", appUrl);

  return makeGraph([
    organizationSchema(context),
    softwareApplicationSchema({
      context,
      description: contentData.meta.description,
      offers: pricingOffers({ appName, appUrl, contentData, locale }),
    }),
    faqPageSchema({
      id: `${pricingUrl}#faq`,
      items: contentData.faq.items,
    }),
  ]);
}
