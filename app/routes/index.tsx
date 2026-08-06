import { JoyaiLanding } from "~/components/landing/joyai-landing";
import { getPublicEnv } from "~/lib/env.server";
import { buildSocialMeta } from "~/lib/seo";
import { getCanonicalUrl, getHreflangTags } from "~/lib/utils";
import { getLocale } from "~/middlewares/i18next";
import type { Route } from "./+types/index";

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const appName = loaderData?.appName ?? "JoyAI Video Edit";
  const locale = loaderData?.locale ?? "en";
  const appUrl = loaderData?.appUrl;
  const title = `${appName} — Real-Time Open-Ended Video Editing`;
  const description =
    "Join the waiting list for JoyAI Video Edit: real-time, instruction-guided open-ended streaming video editing with natural language—no fixed duration, no future frames required.";
  const canonicalUrl = getCanonicalUrl(locale, "/", appUrl);

  return [
    { title },
    { name: "description", content: description },
    {
      tagName: "link",
      rel: "canonical",
      href: canonicalUrl,
    },
    ...getHreflangTags("/", appUrl),
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

export default function HomeRoute() {
  return (
    <main className="min-h-screen bg-background">
      <JoyaiLanding />
    </main>
  );
}
