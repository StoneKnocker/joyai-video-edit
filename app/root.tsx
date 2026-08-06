import { lazy, Suspense, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";
import { getToast } from "remix-toast";
import { toast as notify, Toaster } from "sonner";
import type { Route } from "./+types/root";
import { Analytics } from "./components/analytics";
import { GeneralErrorBoundary } from "./components/error-boundary";
import { ProgressBar } from "./components/page-progress-bar";
import { WorkspaceProvider } from "./contexts/workspace-context";
import { LoginModalProvider, useLoginModal } from "./hooks/use-login-modal";
import { useNonce } from "./hooks/use-nonce";
import { useUserSourceTracking } from "./hooks/use-user-source";
import {
  ColorSchemeScript,
  useColorScheme,
} from "./lib/color-scheme/components";
import { parseColorScheme } from "./lib/color-scheme/server";
import { getPublicEnv } from "./lib/env.server";
import { requestMiddleware } from "./lib/http.server";
import { TRPCProvider } from "./lib/trpc/trpc-provider";
import { getGuestId } from "./lib/utils";
import { setAuth } from "./middlewares/auth-guard";
import { getLocale, i18nextMiddleware } from "./middlewares/i18next";
import stylesheet from "./styles/app.css?url";

const LoginModal = lazy(() =>
  import("./components/login-modal").then((module) => ({
    default: module.LoginModal,
  })),
);

const PricingModal = lazy(() => import("./components/pricing-modal"));

export const middleware = [i18nextMiddleware, setAuth];

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
  },
];

export async function loader({ request, context }: Route.LoaderArgs) {
  const locale = getLocale(context);

  await requestMiddleware(request);
  const colorScheme = await parseColorScheme(request);
  const { toast, headers } = await getToast(request);

  return data({ ENV: getPublicEnv(), colorScheme, toast, locale }, { headers });
}

export function Layout({ children }: { children: React.ReactNode }) {
  const nonce = useNonce();
  const colorScheme = useColorScheme();
  const { i18n } = useTranslation();

  return (
    <html
      lang={i18n.language}
      dir={i18n.dir(i18n.language)}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
        <ColorSchemeScript nonce={nonce} />
        <link rel="stylesheet" href={stylesheet} precedence="high" />
        <Analytics />
      </head>
      <body>
        <ProgressBar />
        {children}
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
        <Toaster position="top-center" theme={colorScheme} />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const { ENV, toast, locale } = loaderData;
  const nonce = useNonce();

  // Initialize user source tracking on first visit
  useUserSourceTracking();

  useEffect(() => {
    // Initialize guestId cookie for guest users
    getGuestId();

    if (toast?.type === "error") {
      notify.error(toast.message);
    }
    if (toast?.type === "success") {
      notify.success(toast.message);
    }
  }, [toast]);

  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== locale) i18n.changeLanguage(locale);
  }, [locale, i18n]);

  return (
    <>
      <TRPCProvider>
        <WorkspaceProvider>
          <LoginModalProvider>
            <Outlet />
            <LazyLoginModalMount />
            <LazyPricingModalMount />
          </LoginModalProvider>
        </WorkspaceProvider>
      </TRPCProvider>
      <script
        nonce={nonce}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: false positive
        dangerouslySetInnerHTML={{
          __html: `window.ENV = ${JSON.stringify(ENV)}`,
        }}
      />
    </>
  );
}

function LazyLoginModalMount() {
  const { isOpen } = useLoginModal();
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setHasOpened(true);
    }
  }, [isOpen]);

  if (!isOpen && !hasOpened) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <LoginModal />
    </Suspense>
  );
}

function LazyPricingModalMount() {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const handleOpen = () => setShouldRender(true);
    window.addEventListener("open-pricing-modal", handleOpen);
    return () => window.removeEventListener("open-pricing-modal", handleOpen);
  }, []);

  if (!shouldRender) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <PricingModal initialOpen />
    </Suspense>
  );
}

export function ErrorBoundary() {
  return <GeneralErrorBoundary />;
}
