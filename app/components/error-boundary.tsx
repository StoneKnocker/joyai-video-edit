import { MehIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isRouteErrorResponse, Link, useRouteError } from "react-router";
import { buttonVariants } from "./ui/button";

function DevErrorDisplay({
  message,
  detail,
  stack,
}: {
  message: string;
  detail: string;
  stack?: string;
}) {
  return (
    <main className="landing-theme flex min-h-screen flex-col gap-4 bg-background p-4 text-foreground sm:p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-foreground text-lg">{message}</h1>
        <p className="break-words text-muted-foreground text-base">{detail}</p>
      </div>
      {stack && (
        <pre className="max-h-96 w-full overflow-x-auto overflow-y-auto rounded-lg border bg-card p-4 text-red-300 text-sm">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export function ErrorDisplay({
  message,
  detail,
}: {
  message: string;
  detail: string;
}) {
  const { t } = useTranslation();

  return (
    <main className="landing-theme flex h-screen items-center justify-center bg-background p-6 text-foreground">
      <div className="mx-auto flex max-w-sm flex-col items-center gap-4 text-center">
        <div className="rounded-md border bg-card p-3 text-primary">
          <MehIcon className="size-6" />
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="font-semibold text-foreground text-lg">{message}</h1>
          <p className="text-muted-foreground text-base">{detail}</p>
        </div>

        <Link to="/" className={buttonVariants()}>
          {t("errorBoundary.backToHome")}
        </Link>
      </div>
    </main>
  );
}

export function GeneralErrorBoundary() {
  const { t } = useTranslation();
  const error = useRouteError();
  const isDev = import.meta.env.DEV;
  let message = t("errorBoundary.applicationErrorTitle");
  let details = t("errorBoundary.unexpectedError");
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message =
      error.status === 404
        ? t("errorBoundary.notFoundTitle")
        : t("errorBoundary.genericTitle");
    details =
      error.status === 404
        ? t("errorBoundary.notFoundDetail")
        : error.statusText || details;
  } else if (isDev && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  if (isDev && stack) {
    return <DevErrorDisplay message={message} detail={details} stack={stack} />;
  }

  return <ErrorDisplay message={message} detail={details} />;
}
