import { FileTextIcon } from "lucide-react";
import { PolicyPage, policyMeta } from "~/components/content/policy-page";
import { policyLoader } from "~/lib/content/policy.server";
import type { Route } from "./+types/terms-and-conditions";

export const meta: Route.MetaFunction = ({ loaderData, params }) => {
  if (!loaderData) {
    return [];
  }
  return policyMeta({
    appName: loaderData.appName,
    params,
    type: "terms",
  });
};

export default function TermsAndConditionsRoute({
  loaderData,
  params,
}: Route.ComponentProps) {
  return (
    <PolicyPage
      icon={FileTextIcon}
      type="terms"
      params={params}
      loaderData={loaderData}
    />
  );
}

export async function loader(args: Route.LoaderArgs) {
  return policyLoader({ ...args, filePattern: "terms-and-conditions" });
}
