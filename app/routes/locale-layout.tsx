import { Outlet } from "react-router";
import { ErrorBoundary as NotFoundBoundary } from "@/routes/not-found";
import { i18nConfig } from "~/lib/config";
import type { Route } from "./+types/locale-layout";

export async function loader({ params, request }: Route.LoaderArgs) {
  const { locale } = params;

  if (locale && !i18nConfig.supportLanguages.includes(locale)) {
    // 路由参数占位符（如 :locale?）被爬虫当作字面量 URL 访问时，重定向到去掉该段的正确地址
    if (locale.startsWith(":")) {
      const url = new URL(request.url);
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (pathParts.length > 0) {
        pathParts.shift();
      }
      const newPath = `/${pathParts.join("/")}${url.search}${url.hash}`;

      return new Response(null, {
        status: 301,
        headers: { Location: newPath },
      });
    }

    throw new Response("Not found", { status: 404 });
  }

  return null;
}

export default function LocaleLayout() {
  return <Outlet />;
}

export function ErrorBoundary() {
  return <NotFoundBoundary />;
}
