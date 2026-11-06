import { Navigate, Outlet, useLocation } from "react-router-dom";
import { homePathFor, useAuth } from "./AuthContext";

function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center" role="status" aria-label="Loading">
      <span className="size-8 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
    </div>
  );
}

/** For signed-in pages. Sends everyone else to log in, then back here. */
export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();
  if (state.status === "loading") return <FullPageSpinner />;
  if (state.status === "anonymous") return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** For log in and sign up. People already signed in go to their dashboard. */
export function AnonymousOnly() {
  const { state } = useAuth();
  const location = useLocation();
  if (state.status === "loading") return <FullPageSpinner />;
  if (state.status === "authenticated") {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? homePathFor(state.user)} replace />;
  }
  return <Outlet />;
}

export function HomeRedirect() {
  const { state } = useAuth();
  if (state.status === "loading") return <FullPageSpinner />;
  return <Navigate to={state.status === "authenticated" ? homePathFor(state.user) : "/login"} replace />;
}
