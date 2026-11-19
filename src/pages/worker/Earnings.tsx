import { ArrowRight, CalendarClock, CircleCheck, Hourglass, Wallet } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { JobList, LoadError } from "../../components/JobParts";
import { FilterChips, LoadMore, MonthlyBars } from "../../components/MoneyParts";
import { PaymentBadge } from "../../components/PaymentParts";
import { StatCard, TILE_TONES } from "../../components/StatCard";
import { Dual, Stacked } from "../../components/Text";
import { EmptyBox } from "../../components/WorkParts";
import type { StringKey } from "../../i18n/strings";
import { type EarningsFilter, type EarningsSummary, useEarnings, useEarningsSummary } from "../../lib/earnings";
import { formatRwf, paymentStatus } from "../../lib/jobs";

const FILTERS: { id: EarningsFilter; label: StringKey; count?: (summary: EarningsSummary) => number }[] = [
  { id: "all", label: "statusAll" },
  { id: "waiting", label: "earnWaitingTab", count: (s) => s.waitingJobs },
  { id: "received", label: "earnReceivedTab", count: (s) => s.receivedJobs },
];

const EMPTY: Record<EarningsFilter, StringKey> = {
  all: "earnNoneYet",
  waiting: "earnNoneWaiting",
  received: "earnNoneReceived",
};

export function Earnings() {
  const [params, setParams] = useSearchParams();
  const active = FILTERS.find((filter) => filter.id === params.get("status")) ?? FILTERS[0];
  const summary = useEarningsSummary();
  const earnings = useEarnings(active.id);
  const jobs = earnings.data?.pages.flatMap((page) => page.jobs);
  const data = summary.data;

  function chooseFilter(id: EarningsFilter) {
    const next = new URLSearchParams(params);
    if (id === "all") next.delete("status");
    else next.set("status", id);
    setParams(next, { replace: true });
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold lg:text-3xl">
          <Dual k="navEarnings" />
        </h1>
        <Stacked k="earnIntro" className="mt-1 text-muted" />
      </div>

      {data && data.toConfirm > 0 && (
        <button
          type="button"
          onClick={() => chooseFilter("waiting")}
          className="flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm ring-1 ring-tertiary/40 transition hover:ring-tertiary"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-tertiary-soft text-tertiary">
            <Wallet className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-bold">
              {data.toConfirm} · <Dual k="earnToConfirm" rwClassName="font-normal text-muted" />
            </span>
            <Stacked k="earnToConfirmText" className="mt-0.5 block text-muted" />
          </span>
          <ArrowRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
        </button>
      )}

      <section aria-label="Summary">
        {summary.isError ? (
          <LoadError error={summary.error} onRetry={() => void summary.refetch()} />
        ) : (
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard icon={CalendarClock} label="earnThisMonth" value={data && formatRwf(data.receivedThisMonthRwf)} tone={TILE_TONES[0]} />
            <StatCard icon={CircleCheck} label="earnTotal" value={data && formatRwf(data.receivedRwf)} tone={TILE_TONES[0]} />
            <StatCard icon={Hourglass} label="earnWaiting" value={data && formatRwf(data.waitingRwf)} tone={TILE_TONES[1]} />
            <StatCard
              icon={Wallet}
              label="statUpcomingPay"
              value={data && formatRwf(data.upcomingRwf)}
              tone={TILE_TONES[2]}
              to="/worker/applications?status=hired"
            />
          </ul>
        )}
      </section>

      {data && (
        <MonthlyBars
          months={data.byMonth.map((m) => ({ month: m.month, amountRwf: m.receivedRwf }))}
          title="earnByMonth"
          empty="earnNoMonths"
          valueLabel="earnReceivedTab"
        />
      )}

      <section aria-labelledby="finished-jobs" className="space-y-4">
        <h2 id="finished-jobs" className="text-lg font-extrabold">
          <Dual k="earnFinishedJobs" />
        </h2>

        <FilterChips
          label="Filter by payment"
          filters={FILTERS.map((f) => ({ id: f.id, label: f.label, count: data && f.count ? f.count(data) : null }))}
          active={active.id}
          onChoose={chooseFilter}
        />

        <div aria-live="polite" aria-busy={earnings.isFetching} className={earnings.isPlaceholderData ? "opacity-60 transition" : ""}>
          <JobList
            query={earnings}
            jobs={jobs}
            hrefFor={(job) => `/worker/jobs/${job.id}`}
            badgeFor={(job) => {
              const status = paymentStatus(job);
              return status ? <PaymentBadge status={status} /> : null;
            }}
            forCustomer={false}
            empty={<EmptyBox k={EMPTY[active.id]} />}
          />
        </div>

        {earnings.hasNextPage && <LoadMore busy={earnings.isFetchingNextPage} onClick={() => void earnings.fetchNextPage()} />}
      </section>

      <p className="text-xs text-muted">
        <Stacked k="workerPaymentNotice" />
      </p>
    </div>
  );
}
