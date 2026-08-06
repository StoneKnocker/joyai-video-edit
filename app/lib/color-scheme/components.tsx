/**
 * Color scheme implementation based on React Router's official website solution
 * @see https://github.com/remix-run/react-router-website
 *
 * System/light/dark via cookie + prefers-color-scheme.
 * Theme is read-only from root loader (no UI switcher currently).
 */

import { useLayoutEffect, useMemo } from "react";
import { useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";

export type ColorScheme = "light" | "dark" | "system";

/**
 * Color scheme from the root loader (cookie / default).
 */
export function useColorScheme(): ColorScheme {
  const rootLoaderData = useRouteLoaderData<typeof rootLoader>("root");
  return rootLoaderData?.colorScheme ?? "system";
}

/**
 * Applies color scheme on the document element and theme-color meta tags.
 */
export function ColorSchemeScript({ nonce }: { nonce: string }) {
  const colorScheme = useColorScheme();

  // biome-ignore lint/correctness/useExhaustiveDependencies: false positive
  const script = useMemo(
    () =>
      `let colorScheme = ${JSON.stringify(colorScheme)}; if (colorScheme === "system") { let media = window.matchMedia("(prefers-color-scheme: dark)"); if (media.matches) document.documentElement.classList.add("dark"); }`,
    [],
    // we don't want this script to ever change
  );

  if (typeof document !== "undefined") {
    // biome-ignore lint/correctness/useHookAtTopLevel: false positive
    useLayoutEffect(() => {
      if (colorScheme === "light") {
        document.documentElement.classList.remove("dark");
      } else if (colorScheme === "dark") {
        document.documentElement.classList.add("dark");
      } else if (colorScheme === "system") {
        function check(media: MediaQueryList | MediaQueryListEvent) {
          if (media.matches) {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }

        const media = window.matchMedia("(prefers-color-scheme: dark)");
        check(media);

        media.addEventListener("change", check);
        return () => media.removeEventListener("change", check);
      } else {
        console.error("Impossible color scheme state:", colorScheme);
      }
    }, [colorScheme]);
  }

  return (
    <>
      <meta
        name="theme-color"
        media="(prefers-color-scheme: light)"
        content={colorScheme === "dark" ? "#09090b" : "#ffffff"}
      />
      <meta
        name="theme-color"
        media="(prefers-color-scheme: dark)"
        content={colorScheme === "light" ? "#ffffff" : "#09090b"}
      />
      <script
        nonce={nonce}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: false positive
        dangerouslySetInnerHTML={{
          __html: script,
        }}
      />
    </>
  );
}
