import { ArrowRight, CalendarClock, CircleCheck, ClipboardCheck, Hourglass, type LucideIcon, TriangleAlert, Wallet } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { JobList, LoadError, PaymentNotice } from "../../components/JobParts";
import { FilterChips, LoadMore, MonthlyBars } from "../../components/MoneyParts";
import { PaymentBadge } from "../../components/PaymentParts";
import { StatCard, TILE_TONES } from "../../components/StatCard";
import { Dual, Stacked } from "../../components/Text";
import { EmptyBox } from "../../components/WorkParts";
import type { StringKey } from "../../i18n/strings";
import { formatRwf, paymentStatus } from "../../lib/jobs";
import { type CustomerPaymentsSummary, type PaymentFilter, usePayments, usePaymentsSummary } from "../../lib/payments";

const FILTERS: { id: PaymentFilter; label: StringKey; count?: (summary: CustomerPaymentsSummary) => number }[] = [
  { id: "all", label: "statusAll" },
  { id: "to-pay", label: "payToPayTab", count: (s) => s.toPayJobs },
  { id: "paid", label: "payPaidTab", count: (s) => s.paidJobs },
];

const EMPTY: Record<PaymentFilter, StringKey> = {
  all: "paymentsNoneYet",
  "to-pay": "paymentsNoneToPay",
  paid: "paymentsNonePaid",
};

/** The hiring side's payment record: what was paid, what is still owed, and what needs doing. */
export function Payments() {
  const [params, setParams] = useSearchParams();
  const active = FILTERS.find((filter) => filter.id === params.get("status")) ?? FILTERS[0];
  const summary = usePaymentsSummary();
  const payments = usePayments(active.id);
  const jobs = payments.data?.pages.flatMap((page) => page.jobs);
  const data = summary.data;

  function chooseFilter(id: PaymentFilter) {
    const next = new URLSearchParams(params);
    if (id === "all") next.delete("status");
    else next.set("status", id);
    setParams(next, { replace: true });
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold lg:text-3xl">
          <Dual k="navPayments" />
        </h1>
        <Stacked k="paymentsIntro" className="mt-1 text-muted" />
      </div>

      {data && (data.toFinish > 0 || data.disputed > 0) && (
        <div className="grid gap-3 md:grid-cols-2">
          {data.disputed > 0 && (
            <Prompt
              icon={TriangleAlert}
              tone="danger"
              count={data.disputed}
              title="paymentsDisputed"
              text="paymentsDisputedText"
              onClick={() => chooseFilter("to-pay")}
            />
          )}
          {data.toFinish > 0 && (
            <Prompt
              icon={ClipboardCheck}
              tone="tertiary"
              count={data.toFinish}
              title="jobsToFinish"
              text="jobsToFinishText"
              to="/customer/jobs?status=in-progress"
            />
          )}
        </div>
      )}

      <section aria-label="Summary">
        {summary.isError ? (
          <LoadError error={summary.error} onRetry={() => void summary.refetch()} />
        ) : (
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard icon={CalendarClock} label="paidThisMonth" value={data && formatRwf(data.paidThisMonthRwf)} tone={TILE_TONES[0]} />
            <StatCard icon={CircleCheck} label="paidTotal" value={data && formatRwf(data.paidRwf)} tone={TILE_TONES[0]} />
            <StatCard icon={Hourglass} label="toPay" value={data && formatRwf(data.toPayRwf)} tone={TILE_TONES[1]} />
            <StatCard
              icon={Wallet}
              label="upcomingWages"
              value={data && formatRwf(data.upcomingRwf)}
              tone={TILE_TONES[2]}
              to="/customer/jobs?status=in-progress"
            />
          </ul>
        )}
      </section>

      {data && (
        <MonthlyBars
          months={data.byMonth.map((m) => ({ month: m.month, amountRwf: m.paidRwf }))}
          title="paidByMonth"
          empty="paidNoMonths"
          valueLabel="payPaidTab"
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

        <div aria-live="polite" aria-busy={payments.isFetching} className={payments.isPlaceholderData ? "opacity-60 transition" : ""}>
          <JobList
            query={payments}
            jobs={jobs}
            badgeFor={(job) => {
              const status = paymentStatus(job);
              return status ? <PaymentBadge status={status} side="customer" /> : null;
            }}
            forCustomer={false}
            empty={<EmptyBox k={EMPTY[active.id]} />}
          />
        </div>

        {payments.hasNextPage && <LoadMore busy={payments.isFetchingNextPage} onClick={() => void payments.fetchNextPage()} />}
      </section>

      <PaymentNotice />
    </div>
  );
}

const PROMPT_TONES = {
  danger: { ring: "ring-danger/40 hover:ring-danger", icon: "bg-danger-soft text-danger" },
  tertiary: { ring: "ring-tertiary/40 hover:ring-tertiary", icon: "bg-tertiary-soft text-tertiary" },
};

/** Something the customer should act on, opening the list where they can. */
function Prompt({
  icon: Icon,
  tone,
  count,
  title,
  text,
  to,
  onClick,
}: {
  icon: LucideIcon;
  tone: keyof typeof PROMPT_TONES;
  count: number;
  title: StringKey;
  text: StringKey;
  to?: string;
  onClick?: () => void;
}) {
  const colors = PROMPT_TONES[tone];
  const body = (
    <>
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${colors.icon}`}>
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 text-sm">
        <span className="block font-bold">
          {count} · <Dual k={title} rwClassName="font-normal text-muted" />
        </span>
        <Stacked k={text} className="mt-0.5 block text-muted" />
      </span>
      <ArrowRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
    </>
  );
  const className = `flex w-full items-center gap-3 rounded-2xl bg-card p-4 text-left shadow-sm ring-1 transition ${colors.ring}`;
  return to ? (
    <Link to={to} className={className}>
      {body}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={className}>
      {body}
    </button>
  );
}
