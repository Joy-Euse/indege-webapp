import type { StringKey } from "../i18n/strings";
import { formatMonthKey, formatRwf } from "../lib/jobs";
import { Dual, plain, Stacked } from "./Text";

export interface MonthAmount {
  /** "2026-11", Kigali time. */
  month: string;
  amountRwf: number;
}

/**
 * Money per month, as one series of bars in the brand green. The current month carries its amount
 * as a label; the others show theirs on hover, and a table gives every value to screen readers.
 */
export function MonthlyBars({
  months,
  title,
  empty,
  valueLabel,
}: {
  months: MonthAmount[];
  title: StringKey;
  empty: StringKey;
  /** The table's column heading, such as "Received". */
  valueLabel: StringKey;
}) {
  const max = Math.max(0, ...months.map((m) => m.amountRwf));
  const current = months[months.length - 1];

  return (
    <section aria-labelledby="by-month" className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line/60 lg:p-6">
      <h2 id="by-month" className="font-extrabold">
        <Dual k={title} />
      </h2>

      {max === 0 ? (
        <Stacked k={empty} className="mt-3 block text-sm text-muted" />
      ) : (
        <>
          <div
            aria-hidden="true"
            className="mt-4 grid h-44 items-end gap-0.5 border-b border-line sm:gap-3"
            style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
          >
            {months.map((month) => {
              const isCurrent = month === current;
              const height = month.amountRwf ? Math.max(3, (month.amountRwf / max) * 100) : 0;
              return (
                // The whole column is the hover target, which is easier to hit than a short bar.
                <div key={month.month} className="group relative flex h-full flex-col justify-end px-1 sm:px-2">
                  {isCurrent && month.amountRwf > 0 && (
                    <span className="mb-1 truncate text-center text-[11px] font-bold tabular-nums text-ink">{formatRwf(month.amountRwf)}</span>
                  )}
                  <div
                    className={`w-full rounded-t-[4px] transition ${isCurrent ? "bg-primary" : "bg-primary/55 group-hover:bg-primary/75"}`}
                    style={{ height: `${height}%` }}
                  />
                  <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-ink px-2.5 py-1.5 text-xs font-semibold text-surface shadow-lg group-hover:block">
                    {formatMonthKey(month.month, "long")}: {formatRwf(month.amountRwf)}
                  </span>
                </div>
              );
            })}
          </div>
          <div
            aria-hidden="true"
            className="mt-1.5 grid gap-0.5 text-center text-xs font-semibold text-muted sm:gap-3"
            style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0, 1fr))` }}
          >
            {months.map((month) => (
              <span key={month.month} className={month === current ? "text-ink" : ""}>
                {formatMonthKey(month.month)}
              </span>
            ))}
          </div>

          <table className="sr-only">
            <caption>{plain(title)}</caption>
            <thead>
              <tr>
                <th scope="col">Month</th>
                <th scope="col">{plain(valueLabel)}</th>
              </tr>
            </thead>
            <tbody>
              {months.map((month) => (
                <tr key={month.month}>
                  <th scope="row">{formatMonthKey(month.month, "long")}</th>
                  <td>{formatRwf(month.amountRwf)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </section>
  );
}

/** A row of filter pills, each with an optional count. */
export function FilterChips<T extends string>({
  label,
  filters,
  active,
  onChoose,
}: {
  label: string;
  filters: { id: T; label: StringKey; count?: number | null }[];
  active: T;
  onChoose: (id: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
        {filters.map((filter) => {
          const selected = filter.id === active;
          return (
            <button
              key={filter.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChoose(filter.id)}
              className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold whitespace-nowrap transition ${selected ? "bg-primary text-on-fill" : "bg-card text-ink ring-1 ring-line hover:ring-primary/40"}`}
            >
              <Dual k={filter.label} rwClassName={selected ? "font-medium text-on-fill/75" : "font-medium text-muted"} />
              {filter.count != null && (
                <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${selected ? "bg-on-fill/20" : "bg-field text-muted"}`}>
                  {filter.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function LoadMore({ busy, onClick }: { busy: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="mx-auto flex min-h-12 w-full max-w-xs items-center justify-center rounded-xl bg-card text-sm font-bold text-primary ring-1 ring-primary/30 hover:bg-primary-soft disabled:opacity-60"
    >
      <Dual k="loadMore" rwClassName="font-medium text-primary/70" />
    </button>
  );
}
