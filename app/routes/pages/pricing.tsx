import { getPublicEnv } from "~/lib/env.server";
import type { Route } from "./+types/pricing";

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const appName = loaderData?.appName ?? "App";
  return [{ title: `Pricing | ${appName}` }];
};

export const loader = async () => {
  const publicEnv = getPublicEnv();
  return {
    appName: publicEnv.APP_NAME,
  };
};

export default function PricingRoute() {
  return <main className="min-h-screen bg-background" />;
}
