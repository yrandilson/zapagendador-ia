import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useCallback, useEffect, useMemo } from "react";
import { useLocation } from "wouter";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const [, setLocation] = useLocation();
  const userQuery = trpc.auth.me.useQuery();

  useEffect(() => {
    if (!options?.redirectOnUnauthenticated) return;
    if (userQuery.isLoading) return;
    if (userQuery.data) return;

    if (options?.redirectPath) {
      setLocation(options.redirectPath);
      return;
    }

    if (typeof window !== "undefined") {
      window.location.href = getLoginUrl();
    }
  }, [options?.redirectOnUnauthenticated, options?.redirectPath, setLocation, userQuery.data, userQuery.isLoading]);

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      if (typeof window !== "undefined") {
        window.location.href = getLoginUrl();
      }
    },
  });

  const state = useMemo(() => {
    return {
      user: userQuery.data ?? null,
      loading: userQuery.isLoading,
      error: userQuery.error ?? null,
      isAuthenticated: Boolean(userQuery.data),
    };
  }, [userQuery.data, userQuery.error, userQuery.isLoading]);

  // 3. Retornamos a chave-mestra sem fazer o useEffect redirecionar
  return {
    ...state,
    refresh: useCallback(async () => {
      await userQuery.refetch();
    }, [userQuery.refetch]),
    logout: useCallback(async () => {
      await logoutMutation.mutateAsync();
    }, [logoutMutation]),
  };
}
