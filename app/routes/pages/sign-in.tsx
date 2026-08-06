import { useTranslation } from "react-i18next";
import { redirect, useSearchParams } from "react-router";
import { LoginForm, loginPanelClassName } from "~/components/login-form";
import { cn, getLocalizedPath, getSafeRedirectPath } from "~/lib/utils";
import { getCurrentSession } from "~/middlewares/auth-guard";
import { getLocale } from "~/middlewares/i18next";
import type { Route } from "./+types/sign-in";

export async function loader({ request, context }: Route.LoaderArgs) {
  // Session already resolved by root setAuth middleware
  const session = getCurrentSession();

  if (session?.user) {
    const url = new URL(request.url);
    const fallback = getLocalizedPath(getLocale(context), "/");
    throw redirect(
      getSafeRedirectPath(url.searchParams.get("redirectTo"), fallback),
    );
  }

  return null;
}

export default function LoginPage() {
  const { i18n } = useTranslation();
  const [searchParams] = useSearchParams();

  const postLoginPath = getSafeRedirectPath(
    searchParams.get("redirectTo"),
    getLocalizedPath(i18n.language, "/"),
  );

  const handleAuthenticated = () => {
    window.location.href = postLoginPath;
  };

  return (
    <main className="landing-theme flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <div
        className={cn(
          loginPanelClassName,
          // Page form sits on the page background — no card surface.
          "w-full max-w-[400px] bg-transparent shadow-none",
        )}
      >
        <LoginForm
          idPrefix="page"
          googleMode="redirect"
          redirectTo={postLoginPath}
          onAuthenticated={handleAuthenticated}
        />
      </div>
    </main>
  );
}
