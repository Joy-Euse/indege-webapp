import { useMutation } from "@tanstack/react-query";
import { LogOut, Repeat } from "lucide-react";
import { Navigate } from "react-router-dom";
import { homePathFor, useAuth } from "../auth/AuthContext";
import { ErrorBanner } from "../components/Form";
import { Logo } from "../components/Logo";
import { Dual, Stacked } from "../components/Text";
import type { StringKey } from "../i18n/strings";

type DashboardRole = "CUSTOMER" | "WORKER";

/** Placeholder for the customer and worker dashboards, which come in later chunks. */
export function Dashboard({ role }: { role: DashboardRole }) {
  const { state, logout, switchRole } = useAuth();
  const switcher = useMutation({ mutationFn: switchRole });
  const leave = useMutation({ mutationFn: logout });

  if (state.status !== "authenticated") return null;
  const { user } = state;
  const home = homePathFor(user);
  if (home !== `/${role.toLowerCase()}`) return <Navigate to={home} replace />;

  const other: DashboardRole = role === "CUSTOMER" ? "WORKER" : "CUSTOMER";
  const switchLabel: StringKey = user.roles.includes(other)
    ? other === "WORKER" ? "switchToWorker" : "switchToCustomer"
    : other === "WORKER" ? "becomeWorker" : "becomeCustomer";
  const firstName = user.fullName.split(" ")[0];

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 py-5">
      <header className="flex items-center justify-between gap-3">
        <Logo size={32} />
        <button
          type="button"
          onClick={() => leave.mutate()}
          disabled={leave.isPending}
          className="flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-muted hover:text-ink disabled:opacity-60"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <Dual k="logOut" />
        </button>
      </header>

      <main className="mt-8 space-y-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-secondary-dark">
            <Dual k={role === "CUSTOMER" ? "customerDashboard" : "workerDashboard"} rwClassName="font-medium" />
          </p>
          <h1 className="mt-1 text-3xl font-extrabold">Muraho, {firstName}!</h1>
        </div>

        <ErrorBanner error={switcher.error ?? leave.error} />

        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-line/60">
          <Stacked k="dashboardSoon" className="text-muted" />
        </div>

        <button
          type="button"
          onClick={() => switcher.mutate(other)}
          disabled={switcher.isPending}
          className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 font-display font-bold text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          <Repeat className="size-4" aria-hidden="true" />
          <span>
            <Dual k={switchLabel} rwClassName="font-medium text-white/80" />
          </span>
        </button>
      </main>
    </div>
  );
}
