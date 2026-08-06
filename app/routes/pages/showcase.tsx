import { VideoShowcase } from "~/components/showcase/video-showcase";
import { getPublicEnv } from "~/lib/env.server";
import { getCanonicalUrl, getHreflangTags } from "~/lib/utils";
import { getLocale } from "~/middlewares/i18next";
import type { Route } from "./+types/showcase";

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const locale = loaderData?.locale ?? "en";
  const appName = loaderData?.appName ?? "VidRush AI";
  return [
    { title: `Video Showcases | ${appName}` },
    {
      name: "description",
      content: `Explore a curated collection of stunning AI-generated videos. Each clip demonstrates the creative power and versatility of ${appName}.`,
    },
    {
      tagName: "link",
      rel: "canonical",
      href: getCanonicalUrl(locale, "/showcase", loaderData?.appUrl),
    },
    ...getHreflangTags("/showcase", loaderData?.appUrl),
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

export default function ShowcaseRoute({ loaderData }: Route.ComponentProps) {
  const appName = loaderData.appName;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background pb-24 pt-28 text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle_at_top,_rgba(0,217,146,0.16),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(61,58,57,0.1)_1px,transparent_1px),linear-gradient(180deg,rgba(61,58,57,0.1)_1px,transparent_1px)] bg-[size:80px_80px] opacity-30" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <section className="mx-auto mb-14 max-w-3xl text-center">
          <p
            className="mb-4 font-semibold text-primary text-sm uppercase tracking-[0.24em] opacity-0"
            style={{ animation: "fade-in-up 0.6s ease-out 0.1s forwards" }}
          >
            Video Showcases
          </p>
          <h1
            className="text-balance font-display font-normal text-foreground text-4xl tracking-[-0.02em] opacity-0 sm:text-5xl"
            style={{ animation: "fade-in-up 0.6s ease-out 0.2s forwards" }}
          >
            A Curated Gallery of AI-Generated Videos
          </h1>
          <p
            className="mt-5 text-balance text-lg leading-8 text-muted-foreground opacity-0"
            style={{ animation: "fade-in-up 0.6s ease-out 0.3s forwards" }}
          >
            Explore stunning clips made with {appName} — from cinematic scenes
            to artistic animations. Tap any thumbnail to play.
          </p>
        </section>

        <div
          className="opacity-0"
          style={{ animation: "fade-in-up 0.6s ease-out 0.45s forwards" }}
        >
          <VideoShowcase />
        </div>
      </div>
    </main>
  );
}
