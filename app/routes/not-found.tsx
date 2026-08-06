import { useTranslation } from "react-i18next";
import { ErrorDisplay } from "~/components/error-boundary";
import enTranslation from "~/locales/json/en/translation.json";
import type { Route } from "./+types/not-found";

export const meta: Route.MetaFunction = () => [
  { title: enTranslation.notFoundPage.metaTitle },
];

export async function loader() {
  throw new Response("Not found", { status: 404 });
}

export async function action() {
  throw new Response("Not found", { status: 404 });
}

export default function NotFound() {
  return <ErrorBoundary />;
}

export function ErrorBoundary() {
  const { t } = useTranslation();

  return (
    <ErrorDisplay
      message={t("notFoundPage.title")}
      detail={t("notFoundPage.description")}
    />
  );
}
