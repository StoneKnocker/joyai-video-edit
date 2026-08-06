import type { QueryClient } from "@tanstack/react-query";
import { authClient } from "./auth.client";

export const AUTH_SESSION_QUERY_KEY = ["auth-session"] as const;

export async function fetchAuthSession() {
  try {
    const result = await authClient.getSession();
    return result.data;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}

/**
 * Invalidate and refetch the shared auth session query used by useAuth().
 */
export async function refreshAuthSession(queryClient: QueryClient) {
  await queryClient.invalidateQueries({ queryKey: AUTH_SESSION_QUERY_KEY });
  return queryClient.fetchQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: fetchAuthSession,
  });
}
