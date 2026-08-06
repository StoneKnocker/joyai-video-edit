import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router";
import { Loading } from "~/components/ui/loading";
import { authClient } from "~/lib/auth/auth.client";
import {
  buildOAuthCallbackUrl,
  notifyOAuthOpener,
} from "~/lib/auth/oauth-popup";

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

export default function PopupAuth() {
  const [searchParams] = useSearchParams();
  const startedRef = useRef(false);

  useEffect(() => {
    // Guard against React Strict Mode double-invoke in the same mount cycle.
    if (startedRef.current) return;
    startedRef.current = true;

    const state = searchParams.get("state");
    const provider = (searchParams.get("provider") || "google") as "google";

    if (!state) {
      // Parent cannot correlate without state; close and let closed-poll treat as cancel.
      setTimeout(() => window.close(), 100);
      return;
    }

    const initiateOAuth = async () => {
      try {
        const callbackURL = buildOAuthCallbackUrl(state);
        await authClient.signIn.social({
          provider,
          callbackURL,
          errorCallbackURL: callbackURL,
        });
      } catch (err) {
        console.error("OAuth initiation failed:", err);
        notifyOAuthOpener({
          type: "error",
          state,
          message: getErrorMessage(err, "OAuth initiation failed"),
        });
        setTimeout(() => window.close(), 500);
      }
    };

    void initiateOAuth();
  }, [searchParams]);

  return <Loading fullScreen text="Signing in..." size="lg" />;
}
