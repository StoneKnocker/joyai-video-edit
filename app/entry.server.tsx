import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { I18nextProvider } from "react-i18next";
import type {
  EntryContext,
  HandleErrorFunction,
  RouterContextProvider,
} from "react-router";
import { ServerRouter } from "react-router";
import { NonceProvider } from "./hooks/use-nonce";
import { getInstance } from "./middlewares/i18next";

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  _loadContext: RouterContextProvider,
) {
  let shellRendered = false;
  const userAgent = request.headers.get("user-agent");

  // Random nonce for CSP + React SSR script tags (must match client hydration).
  const nonce = crypto.randomUUID();

  // Partial CSP: nonce + strict-dynamic allows Analytics (and other) scripts that
  // are themselves loaded with this nonce to pull in further script hosts.
  // frame-ancestors / form-action harden clickjacking and form targets.
  responseHeaders.set(
    "Content-Security-Policy",
    [
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'wasm-unsafe-eval'`,
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
    ].join("; "),
  );

  const body = await renderToReadableStream(
    <I18nextProvider i18n={getInstance(_loadContext)}>
      <NonceProvider value={nonce}>
        <ServerRouter context={routerContext} url={request.url} nonce={nonce} />
      </NonceProvider>
    </I18nextProvider>,
    {
      onError(error: unknown) {
        responseStatusCode = 500;
        // Log streaming rendering errors from inside the shell.  Don't log
        // errors encountered during initial shell rendering since they'll
        // reject and get logged in handleDocumentRequest.
        if (shellRendered) {
          console.error(error);
        }
      },
      signal: request.signal,
      nonce,
    },
  );
  shellRendered = true;

  // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
  // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}

// Error Reporting
// https://reactrouter.com/how-to/error-reporting
export const handleError: HandleErrorFunction = (error, { request }) => {
  if (request.signal.aborted) {
    return;
  }

  if (error instanceof Error) {
    console.error(error.stack);
  } else {
    console.error(error);
  }
};
