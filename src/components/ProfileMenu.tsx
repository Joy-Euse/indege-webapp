import { useMutation } from "@tanstack/react-query";
import { ChevronsUpDown, LogOut, Repeat, Settings, UserRound, type LucideIcon } from "lucide-react";
import { type KeyboardEvent, type ReactNode, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { homePathFor, useAuth } from "../auth/AuthContext";
import type { StringKey } from "../i18n/strings";
import { initialsOf } from "../lib/account";
import { formatPhone } from "../lib/phone";
import { ErrorBanner } from "./Form";
import { Dual, plain, Stacked } from "./Text";

export function Avatar({ name, size = "md" }: { name: string; size?: "md" | "lg" }) {
  const sizes = size === "lg" ? "size-16 text-xl" : "size-10 text-sm";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-full bg-primary font-display font-extrabold text-white ${sizes}`}
    >
      {initialsOf(name)}
    </span>
  );
}

export function SideBadge({ worker }: { worker: boolean }) {
  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${worker ? "bg-secondary-soft text-secondary-dark" : "bg-primary-soft text-primary"}`}
    >
      <Dual k={worker ? "sideWorker" : "sideHiring"} rwClassName="font-medium opacity-80" />
    </span>
  );
}

interface ProfileMenuProps {
  /** "sidebar" opens a popover beside the sidebar. "topbar" opens a sheet from the bottom, for phones. */
  placement: "sidebar" | "topbar";
}

/** The account menu: switch between hiring and worker, profile, settings and log out. */
export function ProfileMenu({ placement }: ProfileMenuProps) {
  const { state, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const switcher = useMutation({
    mutationFn: switchRole,
    onSuccess: (user) => {
      setOpen(false);
      navigate(homePathFor(user));
    },
  });
  const leave = useMutation({ mutationFn: logout });

  // Closes on navigation, so the menu never lingers over the page it opened.
  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      // The phone sheet lives outside the container, so check both.
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    return () => document.removeEventListener("pointerdown", onPointer);
  }, [open]);

  if (state.status !== "authenticated") return null;
  const { user } = state;
  const isWorker = user.activeRole === "WORKER";
  const other = isWorker ? "CUSTOMER" : "WORKER";
  const switchLabel: StringKey = user.roles.includes(other)
    ? isWorker
      ? "switchToCustomer"
      : "switchToWorker"
    : isWorker
      ? "becomeCustomer"
      : "becomeWorker";

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onMenuKeyDown(event: KeyboardEvent) {
    const items = [...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === "Tab") {
      setOpen(false);
    }
  }

  const itemClass =
    "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-ink hover:bg-surface focus-visible:bg-surface disabled:opacity-60";

  const menuLink = (to: string, Icon: LucideIcon, label: StringKey) => (
    <Link role="menuitem" to={to} className={itemClass}>
      <Icon className="size-4.5 shrink-0 text-muted" aria-hidden="true" />
      <span>
        <Dual k={label} />
      </span>
    </Link>
  );

  const sheet = placement === "topbar";

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={sheet ? plain("openMenu") : undefined}
        onClick={() => setOpen((value) => !value)}
        className={
          sheet
            ? "grid size-11 place-items-center rounded-full"
            : "flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-surface xl:px-2.5"
        }
      >
        <Avatar name={user.fullName} />
        {!sheet && (
          <>
            <span className="hidden min-w-0 flex-1 xl:block">
              <span className="block truncate text-sm font-bold">{user.fullName}</span>
              <span className="mt-0.5 block">
                <SideBadge worker={isWorker} />
              </span>
            </span>
            <ChevronsUpDown className="hidden size-4 shrink-0 text-muted xl:block" aria-hidden="true" />
          </>
        )}
      </button>

      {open &&
        inViewport(
          sheet,
          <>
            {sheet && <div className="fixed inset-0 z-40 bg-ink/40" aria-hidden="true" />}
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={plain("openMenu")}
              onKeyDown={onMenuKeyDown}
              className={
                sheet
                  ? "fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-2xl"
                  : "absolute bottom-0 left-full z-50 ml-3 w-72 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-line xl:bottom-full xl:left-0 xl:mb-2 xl:ml-0"
              }
            >
              {sheet && <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" aria-hidden="true" />}
              <div className="flex items-center gap-3 px-3 py-2">
                <Avatar name={user.fullName} />
                <div className="min-w-0">
                  <p className="truncate font-bold">{user.fullName}</p>
                  <p className="text-xs text-muted">{formatPhone(user.phone)}</p>
                </div>
              </div>
              <div className="px-3 pb-2">
                <SideBadge worker={isWorker} />
              </div>

              {switcher.error != null && (
                <div className="px-1 pb-2">
                  <ErrorBanner error={switcher.error} />
                </div>
              )}

              <div className="border-t border-line pt-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => switcher.mutate(other)}
                  disabled={switcher.isPending}
                  className={`${itemClass} text-primary`}
                >
                  <Repeat className="size-4.5 shrink-0" aria-hidden="true" />
                  <Stacked k={switchLabel} className="leading-tight" />
                </button>
                {menuLink("/settings/profile", UserRound, "myProfile")}
                {menuLink("/settings/privacy", Settings, "settings")}
              </div>
              <div className="mt-2 border-t border-line pt-2">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => leave.mutate()}
                  disabled={leave.isPending}
                  className={`${itemClass} text-danger`}
                >
                  <LogOut className="size-4.5 shrink-0" aria-hidden="true" />
                  <span>
                    <Dual k="logOut" rwClassName="font-normal text-danger/80" />
                  </span>
                </button>
              </div>
            </div>
          </>,
        )}
    </div>
  );
}

/**
 * The phone sheet is rendered at the end of the page. The top bar's blur effect would otherwise
 * make "fixed" mean "fixed to the top bar", squeezing the sheet into it.
 */
function inViewport(portal: boolean, children: ReactNode) {
  return portal ? createPortal(children, document.body) : children;
}
