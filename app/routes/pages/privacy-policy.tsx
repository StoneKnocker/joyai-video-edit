import { ShieldCheckIcon } from "lucide-react";
import { PolicyPage, policyMeta } from "~/components/content/policy-page";
import { policyLoader } from "~/lib/content/policy.server";
import type { Route } from "./+types/privacy-policy";

export const meta: Route.MetaFunction = ({ loaderData, params }) => {
  if (!loaderData) {
    return [];
  }
  return policyMeta({
    appName: loaderData.appName,
    params,
    type: "privacy",
  });
};

export default function PrivacyPolicyRoute({
  loaderData,
  params,
}: Route.ComponentProps) {
  return (
    <PolicyPage
      icon={ShieldCheckIcon}
      type="privacy"
      params={params}
      loaderData={loaderData}
    />
  );
}

export async function loader(args: Route.LoaderArgs) {
  return policyLoader({ ...args, filePattern: "privacy-policy" });
}
