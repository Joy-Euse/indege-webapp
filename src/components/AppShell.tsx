import {
  Banknote,
  BriefcaseBusiness,
  CirclePlus,
  ClipboardList,
  House,
  type LucideIcon,
  MessageCircle,
  Search,
  Settings,
  Wallet,
} from "lucide-react";
import { Suspense } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import type { StringKey } from "../i18n/strings";
import { Loading } from "./JobParts";
import { JobSearchBox } from "./JobSearchBox";
import { Logo, LogoMark } from "./Logo";
import { ProfileMenu, SideBadge } from "./ProfileMenu";
import { Dual, plain, Stacked } from "./Text";

interface NavItem {
  icon: LucideIcon;
  label: StringKey;
  /** Missing for features that are not built yet. They show as "Soon". */
  to?: string;
  isActive?: (path: string) => boolean;
}

const startsWith = (prefix: string) => (path: string) => path === prefix || path.startsWith(`${prefix}/`);

const HIRING_NAV: NavItem[] = [
  { icon: House, label: "navHome", to: "/customer", isActive: (path) => path === "/customer" },
  {
    icon: BriefcaseBusiness,
    label: "navMyJobs",
    to: "/customer/jobs",
    isActive: (path) => startsWith("/customer/jobs")(path) && path !== "/customer/jobs/new",
  },
  { icon: CirclePlus, label: "postJob", to: "/customer/jobs/new", isActive: (path) => path === "/customer/jobs/new" },
  { icon: MessageCircle, label: "navMessages" },
  { icon: Wallet, label: "navPayments" },
];

const WORKER_NAV: NavItem[] = [
  { icon: House, label: "navHome", to: "/worker", isActive: (path) => path === "/worker" },
  { icon: Search, label: "navFindWork", to: "/worker/jobs", isActive: startsWith("/worker/jobs") },
  { icon: ClipboardList, label: "navApplications", to: "/worker/applications", isActive: startsWith("/worker/applications") },
  { icon: Banknote, label: "navEarnings" },
];

const SETTINGS_ITEM: NavItem = { icon: Settings, label: "settings", to: "/settings", isActive: startsWith("/settings") };

/**
 * The frame around every signed-in page.
 * Phones: top bar and bottom tabs. Tablets: an icon rail. Desktops: a full sidebar.
 */
export function AppShell() {
  const { state } = useAuth();
  const { pathname } = useLocation();
  if (state.status !== "authenticated") return null;

  const isWorker = state.user.activeRole === "WORKER";
  const items = isWorker ? WORKER_NAV : HIRING_NAV;

  return (
    <div className="min-h-dvh">
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-white px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to content
      </a>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-20 flex-col border-r border-line bg-white md:flex xl:w-64">
        <Link to={isWorker ? "/worker" : "/customer"} className="flex h-16 shrink-0 items-center justify-center xl:justify-start xl:px-6">
          <span className="xl:hidden">
            <LogoMark size={36} />
          </span>
          <span className="hidden xl:inline">
            <Logo size={32} />
          </span>
          <span className="sr-only">INDEGE</span>
        </Link>

        <div className="hidden px-6 pb-2 xl:block">
          <SideBadge worker={isWorker} />
        </div>

        <nav aria-label={plain("mainNav")} className="flex-1 overflow-y-auto px-3 py-2">
          <ul className="space-y-1">
            {items.map((item) => (
              <SidebarLink key={item.label} item={item} pathname={pathname} />
            ))}
          </ul>
          <ul className="mt-4 space-y-1 border-t border-line pt-4">
            <SidebarLink item={SETTINGS_ITEM} pathname={pathname} />
          </ul>
        </nav>

        <div className="border-t border-line p-3">
          <ProfileMenu placement="sidebar" />
        </div>
      </aside>

      <div className="md:pl-20 xl:pl-64">
        <header className="sticky top-0 z-20 border-b border-line bg-surface/90 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Link to={isWorker ? "/worker" : "/customer"} className="md:hidden" aria-label="INDEGE">
              <Logo size={28} />
            </Link>
            {!isWorker && <JobSearchBox shortcut className="hidden max-w-xl flex-1 md:flex" />}
            <div className="ml-auto flex items-center gap-2">
              {isWorker && (
                <Link
                  to="/worker/jobs"
                  className="hidden min-h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-extrabold text-ink shadow-sm hover:bg-[#e58a1f] md:flex"
                >
                  <Search className="size-4.5" aria-hidden="true" />
                  <span>
                    <Dual k="navFindWork" rwClassName="font-semibold text-ink/70" />
                  </span>
                </Link>
              )}
              {!isWorker && (
                <>
                  <Link
                    to="/customer/jobs"
                    state={{ focusSearch: true }}
                    aria-label={plain("searchJobs")}
                    className="grid size-11 place-items-center rounded-full text-muted hover:bg-white hover:text-ink md:hidden"
                  >
                    <Search className="size-5" aria-hidden="true" />
                  </Link>
                  <Link
                    to="/customer/jobs/new"
                    className="hidden min-h-11 items-center gap-2 rounded-xl bg-secondary px-4 text-sm font-extrabold text-ink shadow-sm hover:bg-[#e58a1f] md:flex"
                  >
                    <CirclePlus className="size-4.5" aria-hidden="true" />
                    <span>
                      <Dual k="postJob" rwClassName="font-semibold text-ink/70" />
                    </span>
                  </Link>
                </>
              )}
              <div className="md:hidden">
                <ProfileMenu placement="topbar" />
              </div>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-7xl px-4 pb-28 pt-6 sm:px-6 md:pb-12 lg:px-8 lg:pt-8">
          <Suspense fallback={<Loading />}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <BottomNav items={[...items.filter((item) => item.to), SETTINGS_ITEM]} pathname={pathname} />
    </div>
  );
}

function SidebarLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const { icon: Icon, label, to } = item;
  const active = item.isActive?.(pathname) ?? false;
  const base =
    "group relative flex min-h-12 items-center justify-center gap-3 rounded-xl px-3 text-sm font-bold transition xl:justify-start";

  const content = (
    <>
      <Icon className="size-5 shrink-0" aria-hidden="true" />
      <Stacked k={label} className="hidden min-w-0 leading-tight xl:block" />
      {!to && (
        <span className="ml-auto hidden rounded-full bg-field px-2 py-0.5 text-[10px] font-bold text-muted xl:inline">
          <Dual k="soon" rwClassName="font-medium" />
        </span>
      )}
      {/* On the icon rail, the label shows as a tooltip on hover and focus. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-full z-40 ml-3 hidden whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg group-hover:block group-focus-visible:block xl:hidden!"
      >
        <Dual k={label} rwClassName="font-normal text-white/75" />
        {!to && <span className="ml-1.5 text-white/75">· <Dual k="soon" rwClassName="" /></span>}
      </span>
    </>
  );

  return (
    <li>
      {to ? (
        <Link
          to={to}
          aria-current={active ? "page" : undefined}
          aria-label={plain(label)}
          className={`${base} ${active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface hover:text-ink"}`}
        >
          {content}
        </Link>
      ) : (
        <span aria-disabled="true" tabIndex={0} aria-label={`${plain(label)} (${plain("soon")})`} className={`${base} cursor-default text-muted/60`}>
          {content}
        </span>
      )}
    </li>
  );
}

function BottomNav({ items, pathname }: { items: NavItem[]; pathname: string }) {
  return (
    <nav
      aria-label={plain("mainNav")}
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="mx-auto grid max-w-lg" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map(({ icon: Icon, label, to, isActive }) => {
          const active = isActive?.(pathname) ?? false;
          return (
            <li key={label}>
              <Link
                to={to!}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-16 flex-col items-center justify-center gap-0.5 px-1 text-center text-[11px] font-bold ${active ? "text-primary" : "text-muted hover:text-ink"}`}
              >
                <Icon className="size-5" aria-hidden="true" />
                <Stacked k={label} className="leading-tight" />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
