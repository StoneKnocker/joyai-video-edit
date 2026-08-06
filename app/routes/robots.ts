/// <reference path="../../worker-configuration.d.ts" />
import { serverEnv } from "~/lib/env.server";

export async function loader() {
  const appUrl = serverEnv.APP_URL;
  const body = [
    "User-Agent: *",
    "Allow: /",
    "Disallow: /admin",
    "Disallow: /settings",
    "Disallow: /user/",
    "Disallow: /api/",
    "Disallow: /*?*",
    "Disallow: /*.json$",
    "Disallow: /404",
    "Disallow: /500",
    "",
    `Sitemap: ${appUrl}/sitemap.xml`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
