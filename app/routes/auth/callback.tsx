import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Loading } from "~/components/ui/loading";
import { fetchAuthSession } from "~/lib/auth/auth-session";
import { notifyOAuthOpener } from "~/lib/auth/oauth-popup";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

function closePopupSoon(ms = 300) {
  setTimeout(() => {
    try {
      window.close();
    } catch {
      // ignore
    }
  }, ms);
}

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const handleCallback = async () => {
      const state = searchParams.get("state") ?? "";
      const isPopup =
        searchParams.get("popup") === "1" ||
        searchParams.get("popup") === "true";
      const error = searchParams.get("error");
      const errorDescription = searchParams.get("error_description");

      // Non-popup landings (e.g. bookmarked URL): send user home.
      if (!isPopup) {
        window.location.replace("/");
        return;
      }

      if (error) {
        notifyOAuthOpener({
          type: "error",
          state,
          message: errorDescription || error || "Authentication failed",
        });
        closePopupSoon();
        return;
      }

      try {
        const session = await fetchAuthSession();
        if (session?.user) {
          notifyOAuthOpener({ type: "success", state });
        } else {
          notifyOAuthOpener({
            type: "error",
            state,
            message: "Authentication failed",
          });
        }
      } catch (err) {
        console.error("OAuth callback error:", err);
        notifyOAuthOpener({
          type: "error",
          state,
          message: getErrorMessage(err, "Authentication failed"),
        });
      }

      closePopupSoon();
    };

    void handleCallback();
  }, [searchParams]);

  return <Loading fullScreen text="Completing sign-in..." size="lg" />;
}
