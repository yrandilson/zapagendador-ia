import { useCallback, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  // 1. Criamos um crachá de administrador local
  const fakeUser = {
    id: "hacker-007",
    name: "Admin Local",
    email: "admin@zapagendador.local",
    role: "admin",
    avatar: ""
  };

  // 2. Enganamos o cache do navegador e forçamos o estado autenticado
  const state = useMemo(() => {
    localStorage.setItem(
      "manus-runtime-user-info",
      JSON.stringify(fakeUser)
    );
    return {
      user: fakeUser,
      loading: false,
      error: null,
      isAuthenticated: true,
    };
  }, []);

  // 3. Retornamos a chave-mestra sem fazer o useEffect redirecionar
  return {
    ...state,
    refresh: () => {},
    logout: useCallback(async () => {
      console.log("Logout desativado no modo de desenvolvimento");
    }, []),
  };
}
