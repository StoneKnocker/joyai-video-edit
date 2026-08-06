import { AsyncLocalStorage } from "node:async_hooks";

export interface CloudflareContext {
  env: Env;
  ctx: ExecutionContext;
  request?: Request;
}

const cloudflareContextStore = new AsyncLocalStorage<CloudflareContext>();

export function getCloudflareContext(): CloudflareContext | undefined {
  return cloudflareContextStore.getStore();
}

export function runWithCloudflareContext<T>(
  context: CloudflareContext,
  fn: () => T,
): T {
  return cloudflareContextStore.run(context, fn);
}

function getCfStringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export const getCountry = () =>
  getCfStringValue(getCloudflareContext()?.request?.cf?.country);
export const getCity = () =>
  getCfStringValue(getCloudflareContext()?.request?.cf?.city);
