import { useSearchParams } from "react-router-dom";
import { JobList } from "../../components/JobParts";
import { Dual } from "../../components/Text";
import { EmptyBox, workerBadge } from "../../components/WorkParts";
import type { StringKey } from "../../i18n/strings";
import { type ApplicationFilter, useMyApplications, useWorkSummary, type WorkerSummary } from "../../lib/work";

const FILTERS: { id: ApplicationFilter; label: StringKey; count?: (summary: WorkerSummary) => number }[] = [
  { id: "all", label: "statusAll" },
  { id: "pending", label: "appPending", count: (s) => s.pending },
  { id: "hired", label: "appHired", count: (s) => s.hired },
  { id: "closed", label: "appClosed" },
];

export function MyApplications() {
  const [params, setParams] = useSearchParams();
  const active = FILTERS.find((filter) => filter.id === params.get("status")) ?? FILTERS[0];
  const summary = useWorkSummary();
  const applications = useMyApplications(active.id);
  // Shown as jobs, carrying the application so each row can show where it stands.
  const jobs = applications.data?.pages.flatMap((page) =>
    page.applications.map((application) => ({ ...application.job, myApplication: application })),
  );

  function chooseFilter(id: ApplicationFilter) {
    const next = new URLSearchParams(params);
    if (id === "all") next.delete("status");
    else next.set("status", id);
    setParams(next, { replace: true });
  }

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold lg:text-3xl">
        <Dual k="navApplications" />
      </h1>

      <div role="group" aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {FILTERS.map((filter) => {
            const selected = filter === active;
            const count = summary.data && filter.count ? filter.count(summary.data) : null;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseFilter(filter.id)}
                className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold whitespace-nowrap transition ${selected ? "bg-primary text-on-fill" : "bg-card text-ink ring-1 ring-line hover:ring-primary/40"}`}
              >
                <Dual k={filter.label} rwClassName={selected ? "font-medium text-on-fill/75" : "font-medium text-muted"} />
                {count !== null && (
                  <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${selected ? "bg-on-fill/20" : "bg-field text-muted"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div aria-live="polite" aria-busy={applications.isFetching} className={applications.isPlaceholderData ? "opacity-60 transition" : ""}>
        <JobList
          query={applications}
          jobs={jobs}
          hrefFor={(job) => `/worker/jobs/${job.id}`}
          badgeFor={workerBadge}
          forCustomer={false}
          empty={<EmptyBox k={active.id === "all" ? "noApplicationsYet" : "noApplicationsHere"} />}
        />
      </div>

      {applications.hasNextPage && (
        <button
          type="button"
          onClick={() => void applications.fetchNextPage()}
          disabled={applications.isFetchingNextPage}
          className="mx-auto flex min-h-12 w-full max-w-xs items-center justify-center rounded-xl bg-card text-sm font-bold text-primary ring-1 ring-primary/30 hover:bg-primary-soft disabled:opacity-60"
        >
          <Dual k="loadMore" rwClassName="font-medium text-primary/70" />
        </button>
      )}
    </div>
  );
}
