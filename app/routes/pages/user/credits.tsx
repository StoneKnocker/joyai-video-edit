import {
  Coins,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { SubscriptionManage } from "~/components/subscription-manage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { CREDIT_EVENT, CREDIT_TYPE } from "~/lib/consts";
import { getCreditHistoryByUserIdPaginated } from "~/lib/model/creditHistory";
import { getTotalAvailableCredits } from "~/lib/model/userBalance";
import { cn } from "~/lib/utils";
import { requireUser } from "~/middlewares/auth-guard";
import type { Route } from "./+types/credits";

const PAGE_SIZE = 10;

export const loader = async ({ request }: Route.LoaderArgs) => {
  const { user } = requireUser();

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);

  const [balance, history] = await Promise.all([
    getTotalAvailableCredits(user.id),
    getCreditHistoryByUserIdPaginated(user.id, page, PAGE_SIZE),
  ]);

  return { balance, history, currentPage: page };
};

function formatDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function CreditsPage({ loaderData }: Route.ComponentProps) {
  const { t, i18n } = useTranslation();
  const { balance, history, currentPage } = loaderData;
  const { totalPages } = history;
  const creditEventLabels: Record<string, string> = {
    [CREDIT_EVENT.NEW_USER_GRANT]: t("credits.events.welcomeBonus"),
    [CREDIT_EVENT.USAGE]: t("credits.events.usage"),
    [CREDIT_EVENT.REFUND]: t("credits.events.refund"),
    [CREDIT_EVENT.PURCHASE]: t("credits.events.purchase"),
    [CREDIT_EVENT.SUBSCRIPTION_GRANT]: t("credits.events.subscription"),
    [CREDIT_EVENT.SUBSCRIPTION_RESET]: t("credits.events.reset"),
    [CREDIT_EVENT.CHECK_IN_GRANT]: t("credits.events.checkIn"),
    [CREDIT_EVENT.MANUAL_ADJUSTMENT]: t("credits.events.adjustment"),
  };
  const creditTypeLabels: Record<string, string> = {
    [CREDIT_TYPE.PERMANENT]: t("credits.types.permanent"),
    [CREDIT_TYPE.SUBSCRIPTION]: t("credits.types.subscription"),
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background with gradient mesh - matching pricing page */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20" />
      <div className="absolute top-0 right-0 h-[800px] w-[800px] rounded-full bg-gradient-radial from-indigo-200/20 via-transparent to-transparent blur-3xl" />
      <div className="absolute bottom-0 left-0 h-[600px] w-[600px] rounded-full bg-gradient-radial from-purple-200/20 via-transparent to-transparent blur-3xl" />

      <div className="relative pt-32 pb-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1
              className="mb-4 font-bold text-4xl text-slate-900 tracking-tight opacity-0 md:text-5xl"
              style={{ animation: "fade-in-up 0.6s ease-out 0.1s forwards" }}
            >
              {t("credits.title")}
            </h1>
            <p
              className="text-lg text-slate-600 opacity-0"
              style={{ animation: "fade-in-up 0.6s ease-out 0.2s forwards" }}
            >
              {t("credits.description")}
            </p>
          </div>

          {/* Active subscription + cancel */}
          <div
            className="opacity-0"
            style={{ animation: "fade-in-up 0.6s ease-out 0.25s forwards" }}
          >
            <SubscriptionManage />
          </div>

          {/* Balance Cards */}
          <div
            className="mb-12 grid gap-4 opacity-0 md:grid-cols-2"
            style={{ animation: "fade-in-up 0.6s ease-out 0.3s forwards" }}
          >
            {/* Subscription Credits Card */}
            <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-slate-500">
                  <RefreshCw className="h-4 w-4" />
                  {t("credits.subscriptionCredits")}
                </CardDescription>
                <CardTitle className="font-bold text-3xl text-indigo-600 tabular-nums">
                  {balance.subscription}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 text-sm">
                  {t("credits.subscriptionCreditsHint")}
                </p>
              </CardContent>
            </Card>

            {/* Permanent Credits Card */}
            <Card className="border-slate-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2 text-slate-500">
                  <Sparkles className="h-4 w-4" />
                  {t("credits.permanentCredits")}
                </CardDescription>
                <CardTitle className="font-bold text-3xl text-amber-600 tabular-nums">
                  {balance.permanent}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-500 text-sm">
                  {t("credits.neverExpires")}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Total Credits Summary */}
          <div
            className="mb-8 flex items-center justify-center gap-3 opacity-0"
            style={{ animation: "fade-in-up 0.6s ease-out 0.4s forwards" }}
          >
            <Coins className="h-6 w-6 text-slate-600" />
            <span className="font-semibold text-slate-900 text-xl">
              {t("credits.totalAvailable")}{" "}
              <span className="font-bold text-2xl text-indigo-600 tabular-nums">
                {balance.total}
              </span>
            </span>
          </div>

          {/* Transaction History */}
          <div
            className="opacity-0"
            style={{ animation: "fade-in-up 0.6s ease-out 0.5s forwards" }}
          >
            <h2 className="mb-6 font-semibold text-slate-900 text-xl">
              {t("credits.transactionHistory")}
            </h2>

            <Card className="overflow-hidden border-slate-200/50 bg-white/80 shadow-lg backdrop-blur-sm">
              <CardContent className="p-0">
                {history.items.length === 0 ? (
                  <div className="py-16 text-center text-slate-500">
                    <Coins className="mx-auto mb-4 h-12 w-12 text-slate-300" />
                    <p>{t("credits.noTransactionsYet")}</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                        <TableHead className="font-semibold text-slate-700">
                          {t("credits.date")}
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          {t("credits.amount")}
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          {t("credits.type")}
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          {t("credits.event")}
                        </TableHead>
                        <TableHead className="font-semibold text-slate-700">
                          {t("credits.tableDescription")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.items.map((item) => (
                        <TableRow key={item.id} className="group">
                          <TableCell className="text-slate-600">
                            {formatDate(item.createdAt, i18n.language)}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 font-semibold tabular-nums",
                                item.amount > 0
                                  ? "text-primary"
                                  : "text-rose-600",
                              )}
                            >
                              {item.amount > 0 ? (
                                <TrendingUp className="h-4 w-4" />
                              ) : (
                                <TrendingDown className="h-4 w-4" />
                              )}
                              {item.amount > 0 ? "+" : ""}
                              {item.amount}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 font-medium text-xs",
                                item.creditType === CREDIT_TYPE.SUBSCRIPTION
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-amber-100 text-amber-700",
                              )}
                            >
                              {creditTypeLabels[item.creditType] ||
                                item.creditType}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-slate-700">
                              {creditEventLabels[item.creditEvent] ||
                                item.creditEvent}
                            </span>
                          </TableCell>
                          <TableCell className="max-w-[200px] truncate text-slate-500">
                            {item.description || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="border-slate-100 border-t px-6 py-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href={
                            currentPage > 1
                              ? `?page=${currentPage - 1}`
                              : undefined
                          }
                          className={cn(
                            currentPage <= 1 &&
                              "pointer-events-none opacity-50",
                          )}
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          // Show first, last, and pages around current
                          return (
                            page === 1 ||
                            page === totalPages ||
                            Math.abs(page - currentPage) <= 1
                          );
                        })
                        .map((page, idx, arr) => {
                          // Check if we need ellipsis
                          const prevPage = arr[idx - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;

                          return (
                            <PaginationItem key={page}>
                              {showEllipsis && (
                                <span className="px-2 text-slate-400">...</span>
                              )}
                              <PaginationLink
                                href={`?page=${page}`}
                                isActive={page === currentPage}
                              >
                                {page}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                      <PaginationItem>
                        <PaginationNext
                          href={
                            currentPage < totalPages
                              ? `?page=${currentPage + 1}`
                              : undefined
                          }
                          className={cn(
                            currentPage >= totalPages &&
                              "pointer-events-none opacity-50",
                          )}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
