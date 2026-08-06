import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "~/lib/auth/auth.client";
import {
  AUTH_SESSION_QUERY_KEY,
  fetchAuthSession,
  refreshAuthSession,
} from "~/lib/auth/auth-session";

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data: session,
    isLoading,
    error,
  } = useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: fetchAuthSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });

  const signOutMutation = useMutation({
    mutationFn: async () => {
      return await authClient.signOut();
    },
    onSuccess: async () => {
      queryClient.setQueryData(AUTH_SESSION_QUERY_KEY, null);
      await refreshAuthSession(queryClient);
    },
    onError: (error) => {
      console.error("Sign out failed:", error);
      throw error;
    },
  });

  return {
    user: session?.user,
    session,
    isLoading,
    error,

    isAuthenticated: !!session?.user,

    signOut: signOutMutation.mutateAsync,
    isSigningOut: signOutMutation.isPending,

    refreshSession: () => refreshAuthSession(queryClient),

    clearError: () => {
      signOutMutation.reset();
    },
  };
}
