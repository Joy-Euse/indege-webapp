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
  switchRole: (role: "CUSTOMER" | "WORKER") => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const ANONYMOUS: AuthState = { status: "anonymous", user: null };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null });

  const startSession = useCallback((session: Session) => {
    setAccessToken(session.accessToken);
    setState({ status: "authenticated", user: session.user });
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(() => setState(ANONYMOUS));
    // The access token lives in memory, so a page load restores it from the refresh cookie.
    refreshSession()
      .then(startSession)
      .catch(() => setState(ANONYMOUS));
  }, [startSession]);

  const logout = useCallback(async () => {
    try {
      await api<void>("/auth/logout", "POST", {});
    } finally {
      setAccessToken(null);
      setState(ANONYMOUS);
    }
  }, []);

  const switchRole = useCallback(
    async (role: "CUSTOMER" | "WORKER") => {
      startSession(await api<Session>("/auth/active-role", "POST", { role }));
    },
    [startSession],
  );

  const value = useMemo(() => ({ state, startSession, logout, switchRole }), [state, startSession, logout, switchRole]);
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
