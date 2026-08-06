import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { createContext } from "~/lib/trpc/context";
import { appRouter } from "~/lib/trpc/router";

export const loader = async (args: LoaderFunctionArgs) => {
  return handleRequest(args);
};

export const action = async (args: ActionFunctionArgs) => {
  return handleRequest(args);
};

function handleRequest(args: LoaderFunctionArgs | ActionFunctionArgs) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req: args.request,
    router: appRouter,
    createContext,
  });
}
