import { useNonce } from "@/hooks/use-nonce";

export function AdsenseScript({
  nonce,
  pubId,
}: {
  nonce: string;
  pubId: string;
}) {
  if (!pubId) {
    return null;
  }
  return (
    <script
      async
      nonce={nonce}
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-${pubId}`}
      crossOrigin="anonymous"
    />
  );
}

export function PlausibleAnalytics({
  domain,
  nonce,
}: {
  domain: string;
  nonce: string;
}) {
  if (!domain) {
    return null;
  }
  return (
    <script
      defer
      data-domain={domain}
      nonce={nonce}
      src="https://app.pageview.app/js/script.js"
    />
  );
}

export function ClarityAnalytics({
  clarityId,
  nonce,
}: {
  clarityId: string;
  nonce: string;
}) {
  if (!clarityId) {
    return null;
  }
  return (
    <script defer id="microsoft-clarity" nonce={nonce}>{`
      (function(c,l,a,r,i,t,y){
        c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${clarityId}");
    `}</script>
  );
}

export function GoogleAnalytics({
  GA_MEASUREMENT_ID,
  nonce,
}: {
  GA_MEASUREMENT_ID: string;
  nonce: string;
}) {
  if (!GA_MEASUREMENT_ID) {
    return null;
  }
  return (
    <>
      <script
        async
        nonce={nonce}
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <script nonce={nonce}>{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', '${GA_MEASUREMENT_ID}');
      `}</script>
    </>
  );
}

export function Analytics() {
  const nonce = useNonce();

  return (
    <>
      {import.meta.env.VITE_ADSENSE_PUB_ID && (
        <AdsenseScript
          nonce={nonce}
          pubId={import.meta.env.VITE_ADSENSE_PUB_ID}
        />
      )}
      {import.meta.env.VITE_DOMAIN && (
        <PlausibleAnalytics
          domain={import.meta.env.VITE_DOMAIN}
          nonce={nonce}
        />
      )}
      {import.meta.env.VITE_CLARITY_ID && (
        <ClarityAnalytics
          clarityId={import.meta.env.VITE_CLARITY_ID}
          nonce={nonce}
        />
      )}
      {import.meta.env.VITE_GA_MEASUREMENT_ID && (
        <GoogleAnalytics
          GA_MEASUREMENT_ID={import.meta.env.VITE_GA_MEASUREMENT_ID}
          nonce={nonce}
        />
      )}
    </>
  );
}
