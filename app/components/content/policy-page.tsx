import type { LucideIcon } from "lucide-react";
import { ArrowLeftIcon } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import ReactMarkdown from "react-markdown";
import { Link } from "~/components/i18n-link";
import { i18nConfig } from "~/lib/config";
import type { PolicyLoaderData } from "~/lib/content/policy.server";
import { useSupportEmail } from "~/lib/public-env";

type PolicyType = "privacy" | "terms" | "cookie" | "refund";

interface PolicyPageProps {
  icon: LucideIcon;
  type: PolicyType;
  params: { locale?: string };
  loaderData: PolicyLoaderData;
}

interface LoaderArgs {
  params: { locale?: string };
}

export function PolicyPage({
  icon: Icon,
  type,
  params,
  loaderData,
}: PolicyPageProps) {
  const { appName, content } = loaderData;
  const { t } = useTranslation();
  const defaultLanguage = i18nConfig.defaultLanguage;
  const locale = params.locale || defaultLanguage;
  const supportEmail = useSupportEmail();
  const policyKey =
    type === "privacy"
      ? "privacy"
      : type === "terms"
        ? "termsPage"
        : type === "refund"
          ? "refundPage"
          : "cookiePage";
  const policyLabel =
    type === "privacy"
      ? "Privacy policy"
      : type === "terms"
        ? "Terms and conditions"
        : type === "refund"
          ? "Refund policy"
          : "Cookie policy";

  useEffect(() => {
    // Smooth scroll animation on page load
    const timer = setTimeout(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (!content) {
    return (
      <div className="landing-theme min-h-screen bg-background text-foreground">
        <div className="container mx-auto max-w-3xl px-6 py-20">
          <div className="fade-in flex animate-in flex-col gap-8 text-center duration-500">
            <div className="mx-auto flex size-16 items-center justify-center rounded-md border bg-card">
              <Icon className="size-8 text-primary" />
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="font-semibold text-3xl text-foreground tracking-tight">
                {t(`${policyKey}.contentNotFound`, "Content Not Found")}
              </h1>
              <p className="text-muted-foreground">
                {t(
                  `${policyKey}.contentUnavailable`,
                  `${policyLabel} content is unavailable`,
                )}
              </p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 font-medium text-muted-foreground text-sm transition-colors hover:text-primary"
            >
              <ArrowLeftIcon className="size-4" />
              {t("navigation.home", "Home")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const dateString = new Date(content.lastModified).toLocaleDateString(locale);
  const renderedContent = content.content.replaceAll(
    "{{supportEmail}}",
    supportEmail,
  );

  return (
    <div className="landing-theme min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b bg-background">
        <div className="container mx-auto max-w-3xl px-6 py-6">
          <Link
            to="/"
            className="mb-4 inline-flex items-center gap-2 font-medium text-muted-foreground text-sm transition-colors hover:text-primary"
          >
            <ArrowLeftIcon className="size-4" />
            {t("navigation.home", "Home")}
          </Link>
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-md border bg-card">
              <Icon className="size-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-2xl text-foreground tracking-tight">
                {content.title}
              </p>
              <p className="mt-1 text-muted-foreground text-sm">
                {t(`${policyKey}.lastModified`, "Last modified: ")}
                {dateString}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto max-w-3xl px-6 py-12">
        <article className="prose prose-slate prose-lg fade-in slide-in-from-bottom-4 max-w-none animate-in duration-700">
          <ReactMarkdown
            components={{
              h1: ({ children }) => (
                <h1 className="mt-12 mb-6 border-b pb-4 font-bold text-3xl text-foreground first:mt-0">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="mt-10 mb-4 font-semibold text-2xl text-foreground">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="mt-8 mb-3 font-medium text-foreground text-xl">
                  {children}
                </h3>
              ),
              p: ({ children }) => (
                <p className="mb-5 text-muted-foreground text-base leading-relaxed">
                  {children}
                </p>
              ),
              ul: ({ children }) => (
                <ul className="mb-5 flex flex-col gap-2 text-muted-foreground">
                  {children}
                </ul>
              ),
              ol: ({ children }) => (
                <ol className="mb-5 flex flex-col gap-2 text-muted-foreground">
                  {children}
                </ol>
              ),
              li: ({ children }) => (
                <li className="pl-2 leading-relaxed">{children}</li>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  className="text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:text-primary hover:decoration-primary"
                  target={href?.startsWith("http") ? "_blank" : undefined}
                  rel={
                    href?.startsWith("http") ? "noopener noreferrer" : undefined
                  }
                >
                  {children}
                </a>
              ),
              blockquote: ({ children }) => (
                <blockquote className="my-6 border-primary border-l-4 pl-4 text-muted-foreground italic">
                  {children}
                </blockquote>
              ),
            }}
          >
            {renderedContent}
          </ReactMarkdown>
        </article>

        {/* Footer */}
        <footer className="mt-16 border-t pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} {appName}.{" "}
              {t("footer.allRightsReserved", "All rights reserved.")}
            </p>
            <Link
              to="/"
              className="font-medium text-muted-foreground text-sm transition-colors hover:text-primary"
            >
              {t("navigation.home", "Home")}
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function policyMeta({
  appName,
  params,
  type,
}: {
  appName: string;
  params: LoaderArgs["params"];
  type: PolicyType;
}) {
  const defaultLanguage = i18nConfig.defaultLanguage;
  const locale = params.locale || defaultLanguage;
  const title =
    type === "privacy"
      ? "Privacy Policy"
      : type === "terms"
        ? "Terms and Conditions"
        : type === "refund"
          ? "Refund Policy"
          : "Cookie Policy";

  return [
    {
      title: `${title} - ${appName}`,
    },
    {
      name: "description",
      content: `${title} for ${appName} AI video generation service`,
    },
    {
      name: "language",
      content: locale,
    },
  ];
}
