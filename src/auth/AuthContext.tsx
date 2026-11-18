import { useQueryClient } from "@tanstack/react-query";
import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, refreshSession, type Session, setAccessToken, setSessionExpiredHandler, type User } from "../lib/api";

type AuthState =
  | { status: "loading"; user: null }
  | { status: "anonymous"; user: null }
  | { status: "authenticated"; user: User };

interface AuthContextValue {
  state: AuthState;
  /** Call with the response of login or verification. */
  startSession: (session: Session) => void;
  logout: () => Promise<void>;
  /** Ends the session on this device without calling the API, for example after deleting the account. */
  endLocalSession: () => void;
  switchRole: (role: "CUSTOMER" | "WORKER") => Promise<User>;
  /** Keeps the signed-in user in step after a profile change, such as a new name. */
  updateUser: (changes: Partial<Pick<User, "fullName">>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ANONYMOUS: AuthState = { status: "anonymous", user: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });
  const queryClient = useQueryClient();

  const startSession = useCallback((session: Session) => {
    setAccessToken(session.accessToken);
    setState({ status: "authenticated", user: session.user });
  }, []);

  // Forgets every cached answer, so the next person on a shared device sees nothing of this one.
  const endLocalSession = useCallback(() => {
    setAccessToken(null);
    setState(ANONYMOUS);
    queryClient.clear();
  }, [queryClient]);

  useEffect(() => {
    setSessionExpiredHandler(endLocalSession);
    // The access token lives in memory, so a page load restores it from the refresh cookie.
    refreshSession()
      .then(startSession)
      .catch(() => setState(ANONYMOUS));
  }, [startSession, endLocalSession]);

  const logout = useCallback(async () => {
    try {
      await api<void>("/auth/logout", "POST", {});
    } finally {
      endLocalSession();
    }
  }, [endLocalSession]);

  const switchRole = useCallback(
    async (role: "CUSTOMER" | "WORKER") => {
      const session = await api<Session>("/auth/active-role", "POST", { role });
      startSession(session);
      return session.user;
    },
    [startSession],
  );

  const updateUser = useCallback((changes: Partial<Pick<User, "fullName">>) => {
    setState((current) =>
      current.status === "authenticated" ? { status: "authenticated", user: { ...current.user, ...changes } } : current,
    );
  }, []);

  const value = useMemo(
    () => ({ state, startSession, logout, endLocalSession, switchRole, updateUser }),
    [state, startSession, logout, endLocalSession, switchRole, updateUser],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}

export function homePathFor(user: User): string {
  return user.activeRole === "WORKER" ? "/worker" : "/customer";
}
