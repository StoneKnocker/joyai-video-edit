import { ArrowLeftIcon, ShieldAlert } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { type LoaderFunctionArgs, useSearchParams } from "react-router";
import { Link } from "@/components/i18n-link";

import { Button } from "~/components/ui/button";
import { serverAuth } from "~/lib/auth/auth.server";

export const meta = () => [{ title: "Authentication Error" }];

export async function loader({ request }: LoaderFunctionArgs) {
  return serverAuth.handler(request);
}

export default function BetterError() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // Dual insurance for popup OAuth: if better-auth still lands here instead of
  // errorCallbackURL, close the window so the opener's closed-poll can settle.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.opener || window.opener.closed) return;
    const timer = setTimeout(() => {
      try {
        window.close();
      } catch {
        // ignore
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto flex min-h-screen items-center px-6 py-12">
      <div className="mx-auto flex max-w-sm flex-col items-center text-center">
        <p className="rounded-full bg-muted p-3 font-medium">
          <ShieldAlert className="h-6 w-6" />
        </p>

        <h1 className="mt-2 font-semibold text-xl md:text-2xl">
          {t("authError.title")}
        </h1>

        <p className="mt-2 text-muted-foreground">
          {error_description
            ? error_description
            : t("authError.defaultDescription")}
        </p>

        <div className="mt-6 flex w-full shrink-0 items-center justify-center space-x-3">
          <Button variant="outline" asChild>
            <Link to="/sign-in">
              <ArrowLeftIcon className="size-4" />
              {t("authError.goToSignIn")}
            </Link>
          </Button>

          <Button asChild>
            <Link to="/">{t("authError.takeMeHome")}</Link>
          </Button>
        </div>

        <p className="mt-6 text-muted-foreground text-xs underline decoration-1 decoration-muted-foreground/30 decoration-wavy underline-offset-2">
          {t("authError.errorCode")} {error}
        </p>
      </div>
    </div>
  );
}
