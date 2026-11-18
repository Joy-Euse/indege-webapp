import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import type { StringKey } from "../i18n/strings";
import { Stacked } from "./Text";

export const TILE_TONES = ["bg-primary-soft text-primary", "bg-secondary-soft text-secondary-dark", "bg-tertiary-soft text-tertiary"];

interface StatCardProps {
  icon: LucideIcon;
  label: StringKey;
  value: number | string | undefined;
  tone: string;
  to?: string;
}

export function StatCard({ icon: Icon, label, value, tone, to }: StatCardProps) {
  const body = (
    <>
      <span className={`grid size-10 place-items-center rounded-xl ${tone}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-3 text-xs font-semibold text-muted">
        <Stacked k={label} className="leading-tight" />
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold tabular-nums lg:text-3xl">
        {value ?? <span className="inline-block h-7 w-12 animate-pulse rounded-md bg-field align-middle" aria-label="Loading" />}
      </p>
    </>
  );
  const box = "block h-full rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60 lg:p-5";
  return (
    <li>
      {to ? (
        <Link to={to} className={`${box} transition hover:ring-primary/40`}>
          {body}
        </Link>
      ) : (
        <div className={box}>{body}</div>
      )}
    </li>
  );
}
