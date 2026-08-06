import { cacheHeader } from "pretty-cache-header";
import { data } from "react-router";
import { isDevelopment } from "~/lib/env.server";
import resources from "~/locales";
import type { Route } from "./+types/locales";

export async function loader({ params }: Route.LoaderArgs) {
  const supportedLanguages = Object.keys(resources);
  const lng = params.lng;

  if (!lng || !supportedLanguages.includes(lng)) {
    return data({ error: "Invalid language" }, { status: 400 });
  }

  const namespaces = resources[lng];
  const supportedNamespaces = namespaces ? Object.keys(namespaces) : [];
  const ns = params.ns;

  if (!ns || !namespaces || !supportedNamespaces.includes(ns)) {
    return data({ error: "Invalid namespace" }, { status: 400 });
  }

  const headers = new Headers();

  // On production, we want to add cache headers to the response
  if (!isDevelopment) {
    headers.set(
      "Cache-Control",
      cacheHeader({
        maxAge: "5m", // Cache in the browser for 5 minutes
        sMaxage: "1d", // Cache in the CDN for 1 day
        // Serve stale content while revalidating for 7 days
        staleWhileRevalidate: "7d",
        // Serve stale content if there's an error for 7 days
        staleIfError: "7d",
      }),
    );
  }

  return data(namespaces[ns], { headers });
}
