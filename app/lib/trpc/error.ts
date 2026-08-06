import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "./router";

export function getTrpcErrorMessage(
  error: unknown,
  fallback = "Something went wrong.",
) {
  if (error instanceof TRPCClientError) {
    const trpcError = error as TRPCClientError<AppRouter>;

    switch (trpcError.data?.code) {
      case "UNAUTHORIZED":
        return "Please sign in to continue.";
      case "NOT_FOUND":
        return "The requested resource was not found.";
      case "INTERNAL_SERVER_ERROR":
        return trpcError.message || fallback;
      default:
        return trpcError.message || fallback;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
