import { useRouteLoaderData } from "react-router";
import type { loader as rootLoader } from "~/root";

/**
 * Client-safe env. Mirrors `getPublicEnv()` — all fields are required after
 * server Zod validation. `window.ENV` / root loader may still be absent
 * outside the app tree (tests, early bootstrap).
 */
export interface PublicEnv {
  SEND_FROM_EMAIL: string;
  APP_NAME: string;
  APP_URL: string;
  R2_DOMAIN: string;
}

declare global {
  interface Window {
    ENV?: PublicEnv;
  }
}

export function usePublicEnv(): PublicEnv | undefined {
  return useRouteLoaderData<typeof rootLoader>("root")?.ENV;
}

export function useSupportEmail(): string {
  return usePublicEnv()?.SEND_FROM_EMAIL ?? "";
}

export function useAppName(): string {
  return usePublicEnv()?.APP_NAME ?? "";
}

export function useR2Domain(): string {
  return usePublicEnv()?.R2_DOMAIN ?? "";
}
