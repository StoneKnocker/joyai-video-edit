import { getPublicEnv } from "~/lib/env.server";
import type { Route } from "./+types/index";

export const meta: Route.MetaFunction = ({ loaderData }) => {
  const appName = loaderData?.appName ?? "App";
  return [{ title: appName }];
};

export const loader = async () => {
  const publicEnv = getPublicEnv();
  return {
    appName: publicEnv.APP_NAME,
  };
};

export default function HomeRoute() {
  return <main className="min-h-screen bg-background" />;
}
