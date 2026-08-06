import {
  CheckCircle2,
  Clock3,
  Loader2,
  ReceiptText,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "~/components/ui/button";
import { getTrpcErrorMessage } from "~/lib/trpc/error";
import { trpc } from "~/lib/trpc/trpc-provider";
import type { PaymentStatusResult } from "~/lib/trpc/types";
import { getLocalizedPath } from "~/lib/utils";
import type { Route } from "./+types/success";

const POLLING_TIMEOUT_MS = 30000;

export function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const publicId = url.searchParams.get("public_id");
  // PayPal may append token (order id) or subscription_id
  let sessionId = url.searchParams.get("checkout_id");
  if (!sessionId) {
    sessionId = url.searchParams.get("session");
  }
  if (!sessionId) {
    sessionId = url.searchParams.get("token");
  }
  if (!sessionId) {
    sessionId = url.searchParams.get("subscription_id");
  }

  return {
    publicId: publicId || null,
    sessionId,
  };
}

export default function PaymentSuccessPage({
  loaderData,
}: Route.ComponentProps) {
  const { publicId, sessionId } = loaderData;
  const [hasTimedOut, setHasTimedOut] = useState(false);
  const confirmAttempted = useRef(false);
  const { t, i18n } = useTranslation("paymentSuccess");
  const hasLookupKey = Boolean(publicId || sessionId);

  const confirmCheckoutMutation = trpc.payment.confirmCheckout.useMutation();

  const checkStatusQuery = trpc.payment.checkStatus.useQuery(
    {
      publicId: publicId ?? undefined,
      sessionId: sessionId ?? undefined,
    },
    {
      enabled: hasLookupKey,
      retry: false,
      refetchInterval: (query) => {
        const status = query.state.data?.status;

        if (hasTimedOut) {
          return false;
        }

        if (!status || status === "pending") {
          return 3000;
        }

        return false;
      },
    },
  );

  // PayPal return_url: actively capture/activate instead of waiting only on webhook
  useEffect(() => {
    if (!publicId || confirmAttempted.current) {
      return;
    }
    confirmAttempted.current = true;

    void confirmCheckoutMutation
      .mutateAsync({ publicId })
      .then(() => {
        void checkStatusQuery.refetch();
      })
      .catch((error) => {
        console.error("confirmCheckout failed:", error);
        // Still poll — webhook may fulfill later
        void checkStatusQuery.refetch();
      });
    // Only run once on mount for a given publicId
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicId]);

  const queryData: PaymentStatusResult | undefined =
    checkStatusQuery.data?.status === "paid"
      ? checkStatusQuery.data
      : confirmCheckoutMutation.data?.status === "paid"
        ? confirmCheckoutMutation.data
        : (checkStatusQuery.data ?? confirmCheckoutMutation.data);

  useEffect(() => {
    if (!hasLookupKey || hasTimedOut) {
      return;
    }

    if (checkStatusQuery.isError || queryData?.status === "paid") {
      return;
    }

    if (queryData?.status === "canceled" || queryData?.status === "not_found") {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setHasTimedOut(true);
    }, POLLING_TIMEOUT_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasLookupKey, hasTimedOut, checkStatusQuery.isError, queryData?.status]);

  const handleRefresh = () => {
    setHasTimedOut(false);
    if (publicId) {
      void confirmCheckoutMutation.mutateAsync({ publicId }).finally(() => {
        void checkStatusQuery.refetch();
      });
    } else {
      void checkStatusQuery.refetch();
    }
  };

  const handleGoHome = () => {
    window.location.href = getLocalizedPath(i18n.language, "/");
  };

  const handleGoPricing = () => {
    window.location.href = getLocalizedPath(i18n.language, "/pricing");
  };

  const handleGoCredits = () => {
    window.location.href = getLocalizedPath(i18n.language, "/user/credits");
  };

  const viewState = !hasLookupKey
    ? "error"
    : checkStatusQuery.isError
      ? "error"
      : queryData?.status === "paid"
        ? "success"
        : queryData?.status === "canceled" || queryData?.status === "not_found"
          ? "error"
          : hasTimedOut
            ? "timeout"
            : "loading";

  const summaryRows = [
    {
      label: t("summary.reference"),
      value: publicId ?? t("summary.unavailable"),
    },
    {
      label: t("summary.provider"),
      value: queryData?.provider
        ? queryData.provider.charAt(0).toUpperCase() +
          queryData.provider.slice(1)
        : t("summary.pendingValue"),
    },
    {
      label: t("summary.plan"),
      value: queryData?.planId
        ? queryData.planId
            .split("-")
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(" ")
        : t("summary.pendingValue"),
    },
    {
      label: t("summary.amount"),
      value:
        typeof queryData?.amount === "number"
          ? new Intl.NumberFormat(i18n.language, {
              style: "currency",
              currency: queryData.currency ?? "USD",
            }).format(queryData.amount / 100)
          : t("summary.pendingValue"),
    },
    {
      label: t("summary.credits"),
      value:
        typeof queryData?.creditsAmount === "number"
          ? String(queryData.creditsAmount)
          : t("summary.pendingValue"),
    },
  ];

  const statusEyebrow =
    viewState === "success"
      ? t("success.eyebrow")
      : viewState === "timeout"
        ? t("timeout.eyebrow")
        : viewState === "loading"
          ? t("loading.eyebrow")
          : t("error.eyebrow");

  const statusTitle =
    viewState === "success"
      ? t("success.title")
      : viewState === "timeout"
        ? t("timeout.title")
        : viewState === "loading"
          ? t("loading.title")
          : t("error.title");

  const statusDescription =
    viewState === "success"
      ? queryData?.creditType === "subscription"
        ? t("success.subscriptionDescription")
        : t("success.creditsDescription", {
            count: queryData?.creditsAmount ?? 0,
          })
      : viewState === "timeout"
        ? t("timeout.description")
        : viewState === "loading"
          ? t("loading.description")
          : !hasLookupKey
            ? t("error.missingReference")
            : queryData?.status === "canceled"
              ? t("error.canceledDescription")
              : queryData?.status === "not_found"
                ? t("error.notFoundDescription")
                : t("error.description");

  const statusIcon =
    viewState === "success" ? (
      <CheckCircle2 className="h-8 w-8 text-primary" />
    ) : viewState === "timeout" ? (
      <Clock3 className="h-8 w-8 text-amber-600" />
    ) : viewState === "loading" ? (
      <Loader2 className="h-8 w-8 animate-spin text-slate-700" />
    ) : (
      <XCircle className="h-8 w-8 text-destructive" />
    );

  if (!hasLookupKey) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-16">
        <div className="w-full rounded-3xl border bg-background p-8 shadow-sm">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <XCircle className="h-7 w-7 text-destructive" />
          </div>
          <p className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-[0.24em]">
            {t("error.eyebrow")}
          </p>
          <h1 className="font-semibold text-3xl tracking-tight">
            {t("error.title")}
          </h1>
          <p className="mt-3 text-base text-muted-foreground">
            {t("error.missingReference")}
          </p>
          <div className="mt-8">
            <Button onClick={handleGoPricing}>
              {t("error.returnToPlans")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_45%)]">
      <div className="mx-auto min-h-[70vh] max-w-5xl px-4 py-12 lg:py-16">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,360px)]">
          <section className="rounded-[28px] border bg-background p-8 shadow-sm">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="max-w-xl">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.24em]">
                  {statusEyebrow}
                </p>
                <h1 className="mt-3 font-semibold text-3xl tracking-tight sm:text-4xl">
                  {statusTitle}
                </h1>
                <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                  {statusDescription}
                </p>
                {viewState === "loading" && (
                  <p className="mt-3 text-muted-foreground text-sm">
                    {t("loading.note")}
                  </p>
                )}
                {checkStatusQuery.isError && (
                  <p className="mt-3 text-destructive text-sm">
                    {getTrpcErrorMessage(
                      checkStatusQuery.error,
                      t("error.description"),
                    )}
                  </p>
                )}
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border bg-muted/50">
                {statusIcon}
              </div>
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              {viewState === "success" && (
                <>
                  <Button onClick={handleGoHome}>
                    {t("success.primaryAction")}
                  </Button>
                  <Button variant="outline" onClick={handleGoCredits}>
                    {t("success.secondaryAction")}
                  </Button>
                </>
              )}

              {viewState === "loading" && (
                <Button variant="outline" onClick={handleGoCredits}>
                  {t("loading.secondaryAction")}
                </Button>
              )}

              {viewState === "timeout" && (
                <>
                  <Button onClick={handleGoCredits}>
                    {t("timeout.primaryAction")}
                  </Button>
                  <Button variant="outline" onClick={handleRefresh}>
                    {t("timeout.secondaryAction")}
                  </Button>
                </>
              )}

              {viewState === "error" && (
                <>
                  <Button onClick={handleRefresh}>
                    {t("error.refreshPage")}
                  </Button>
                  <Button variant="outline" onClick={handleGoPricing}>
                    {t("error.returnToPlans")}
                  </Button>
                </>
              )}
            </div>
          </section>

          <aside className="rounded-[28px] border bg-background p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted/60">
                <ReceiptText className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-[0.22em]">
                  {t("summary.eyebrow")}
                </p>
                <h2 className="mt-1 font-semibold text-xl">
                  {t("summary.title")}
                </h2>
              </div>
            </div>

            <dl className="mt-6 space-y-4">
              {summaryRows.map((row) => (
                <div
                  key={row.label}
                  className="/70 flex items-center justify-between gap-4 border-b pb-4 last:border-b-0 last:pb-0"
                >
                  <dt className="text-muted-foreground text-sm">{row.label}</dt>
                  <dd className="text-right text-sm">{row.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </div>
      </div>
    </div>
  );
}
