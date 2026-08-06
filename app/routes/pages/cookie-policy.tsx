import { CookieIcon } from "lucide-react";
import { PolicyPage, policyMeta } from "~/components/content/policy-page";
import { policyLoader } from "~/lib/content/policy.server";
import type { Route } from "./+types/cookie-policy";

export const meta: Route.MetaFunction = ({ loaderData, params }) => {
  if (!loaderData) {
    return [];
  }
  return policyMeta({
    appName: loaderData.appName,
    params,
    type: "cookie",
  });
};

export default function CookiePolicyRoute({
  loaderData,
  params,
}: Route.ComponentProps) {
  return (
    <PolicyPage
      icon={CookieIcon}
      type="cookie"
      params={params}
      loaderData={loaderData}
    />
  );
}

export async function loader(args: Route.LoaderArgs) {
  return policyLoader({ ...args, filePattern: "cookie-policy" });
}
