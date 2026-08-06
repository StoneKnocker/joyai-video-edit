import { ReceiptIcon } from "lucide-react";
import { PolicyPage, policyMeta } from "~/components/content/policy-page";
import { policyLoader } from "~/lib/content/policy.server";
import type { Route } from "./+types/refund-policy";

export const meta: Route.MetaFunction = ({ loaderData, params }) => {
  if (!loaderData) {
    return [];
  }
  return policyMeta({
    appName: loaderData.appName,
    params,
    type: "refund",
  });
};

export default function RefundPolicyRoute({
  loaderData,
  params,
}: Route.ComponentProps) {
  return (
    <PolicyPage
      icon={ReceiptIcon}
      type="refund"
      params={params}
      loaderData={loaderData}
    />
  );
}

export async function loader(args: Route.LoaderArgs) {
  return policyLoader({ ...args, filePattern: "refund-policy" });
}
