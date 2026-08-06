import { CalendarClock, CreditCard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { LoadingButton } from "~/components/ui/loading";
import { getTrpcErrorMessage } from "~/lib/trpc/error";
import { trpc } from "~/lib/trpc/trpc-provider";
import { formatPlanLabel } from "~/lib/utils";

function formatDate(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso));
}

/**
 * Shows current subscription + cancel-at-period-end for Subotiz.
 * Renders nothing when the user has no active plan.
 */
export function SubscriptionManage() {
  const { t, i18n } = useTranslation();
  const utils = trpc.useUtils();
  const subQuery = trpc.payment.getActiveSubscription.useQuery();
  const cancelMutation = trpc.payment.cancelSubscription.useMutation({
    onSuccess: async (result) => {
      toast.success(
        t("credits.subscription.cancelSuccess", {
          date: formatDate(result.periodEnd, i18n.language),
        }),
      );
      await utils.payment.getActiveSubscription.invalidate();
    },
    onError: (error) => {
      toast.error(
        getTrpcErrorMessage(error, t("credits.subscription.cancelFailed")),
      );
    },
  });

  const sub = subQuery.data?.subscription;
  if (subQuery.isPending) {
    return (
      <Card className="mb-8 border-slate-200 bg-white/80 backdrop-blur-sm">
        <CardContent className="py-8">
          <div className="h-16 animate-pulse rounded-md bg-slate-100" />
        </CardContent>
      </Card>
    );
  }

  if (!sub) {
    return null;
  }

  const periodLabel = formatDate(sub.periodEnd, i18n.language);
  const planLabel = formatPlanLabel(sub.planId);

  const handleCancel = () => {
    const ok = window.confirm(
      t("credits.subscription.cancelConfirm", {
        date: periodLabel,
      }),
    );
    if (!ok) return;
    cancelMutation.mutate();
  };

  return (
    <Card className="mb-8 border-slate-200 bg-white/80 backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardDescription className="flex items-center gap-2 text-slate-500">
          <CreditCard className="h-4 w-4" />
          {t("credits.subscription.title")}
        </CardDescription>
        <CardTitle className="font-bold text-2xl text-slate-900">
          {planLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-slate-600 text-sm">
          <CalendarClock className="h-4 w-4 shrink-0" />
          {sub.cancelAtPeriodEnd
            ? t("credits.subscription.endsOn", { date: periodLabel })
            : t("credits.subscription.renewsOn", { date: periodLabel })}
        </div>

        {sub.cancelAtPeriodEnd ? (
          <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-800 text-sm">
            {t("credits.subscription.cancelScheduledHint", {
              date: periodLabel,
            })}
          </p>
        ) : sub.canCancel ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-slate-500 text-sm">
              {t("credits.subscription.cancelHint")}
            </p>
            <LoadingButton
              variant="outline"
              className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
              loading={cancelMutation.isPending}
              loadingText={t("credits.subscription.canceling")}
              onClick={handleCancel}
            >
              {t("credits.subscription.cancel")}
            </LoadingButton>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            {t("credits.subscription.contactSupportToCancel")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
