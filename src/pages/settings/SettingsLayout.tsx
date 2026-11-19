import { Lock, type LucideIcon, Palette, ShieldCheck, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Dual, Stacked } from "../../components/Text";
import type { StringKey } from "../../i18n/strings";

const TABS: { to: string; icon: LucideIcon; label: StringKey }[] = [
  { to: "/settings/profile", icon: UserRound, label: "tabProfile" },
  { to: "/settings/privacy", icon: ShieldCheck, label: "tabPrivacy" },
  { to: "/settings/security", icon: Lock, label: "tabSecurity" },
  { to: "/settings/appearance", icon: Palette, label: "tabAppearance" },
];

/** Settings are the same on both sides of the app, and always about the signed-in user. */
export function SettingsLayout() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold lg:text-3xl">
          <Dual k="settings" />
        </h1>
        <Stacked k="settingsIntro" className="mt-1 text-muted" />
      </div>

      <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
        <nav aria-label="Settings" className="-mx-4 mb-6 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:mb-0">
          <ul className="flex w-max gap-2 lg:sticky lg:top-24 lg:w-auto lg:flex-col lg:gap-1">
            {TABS.map(({ to, icon: Icon, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center gap-2.5 rounded-full px-4 text-sm font-bold whitespace-nowrap transition lg:rounded-xl ${isActive ? "bg-primary text-on-fill lg:bg-primary-soft lg:text-primary" : "bg-card text-ink ring-1 ring-line hover:ring-primary/40 lg:bg-transparent lg:ring-0 lg:hover:bg-card"}`
                  }
                >
                  <Icon className="size-4.5 shrink-0" aria-hidden="true" />
                  <span>
                    <Dual k={label} rwClassName="font-medium opacity-75" />
                  </span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-2xl space-y-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export function SaveButton({
  label,
  busy,
  tone = "primary",
  type = "submit",
  onClick,
}: {
  label: StringKey;
  busy: boolean;
  tone?: "primary" | "danger";
  type?: "submit" | "button";
  onClick?: () => void;
}) {
  const colors = tone === "danger" ? "bg-danger hover:bg-danger/90" : "bg-primary hover:bg-primary-dark";
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={busy}
      aria-busy={busy}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold text-on-fill transition disabled:opacity-60 ${colors}`}
    >
      {busy && <span className="size-4 animate-spin rounded-full border-2 border-on-fill/30 border-t-on-fill" aria-hidden="true" />}
      <span>
        <Dual k={label} rwClassName="font-medium text-on-fill/75" />
      </span>
    </button>
  );
}

/** A panel with a heading, used for each group of settings. */
export function SettingsCard({
  title,
  intro,
  tone = "default",
  children,
}: {
  title: StringKey;
  intro?: StringKey;
  tone?: "default" | "danger";
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl bg-card p-5 shadow-sm ring-1 sm:p-6 ${tone === "danger" ? "ring-danger/30" : "ring-line/60"}`}
    >
      <h2 className={`text-lg font-extrabold ${tone === "danger" ? "text-danger" : ""}`}>
        <Dual k={title} />
      </h2>
      {intro && <Stacked k={intro} className="mt-1 block text-sm text-muted" />}
      <div className="mt-5">{children}</div>
    </section>
  );
}
