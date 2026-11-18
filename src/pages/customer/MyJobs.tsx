import { CirclePlus } from "lucide-react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { JobSearchBox } from "../../components/JobSearchBox";
import { JobList } from "../../components/JobParts";
import { Dual, Stacked } from "../../components/Text";
import type { StringKey } from "../../i18n/strings";
import { type JobSummary, type StatusFilter, useJobSearch, useJobSummary } from "../../lib/useJobs";

const FILTERS: { id: StatusFilter; label: StringKey; count: (summary: JobSummary) => number }[] = [
  { id: "all", label: "statusAll", count: (s) => s.total },
  { id: "open", label: "statusOpen", count: (s) => s.open },
  { id: "in-progress", label: "statusInProgress", count: (s) => s.inProgress },
  { id: "completed", label: "statusCompleted", count: (s) => s.completed },
  { id: "cancelled", label: "statusCancelled", count: (s) => s.cancelled },
];

export function MyJobs() {
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const focusSearch = (location.state as { focusSearch?: boolean } | null)?.focusSearch ?? false;
  const q = params.get("q") ?? "";
  const active = FILTERS.find((filter) => filter.id === params.get("status")) ?? FILTERS[0];
  const summary = useJobSummary();
  const search = useJobSearch(q, active.id);
  const jobs = search.data?.pages.flatMap((page) => page.jobs);

  function chooseFilter(id: StatusFilter) {
    const next = new URLSearchParams(params);
    if (id === "all") next.delete("status");
    else next.set("status", id);
    setParams(next, { replace: true });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold lg:text-3xl">
          <Dual k="navMyJobs" />
        </h1>
        <Link
          to="/customer/jobs/new"
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl bg-secondary px-3 text-sm font-extrabold text-ink hover:bg-[#e58a1f] md:hidden"
        >
          <CirclePlus className="size-4" aria-hidden="true" />
          <Stacked k="postJobShort" className="leading-tight" />
        </Link>
      </div>

      {/* The top bar holds the search on wider screens. */}
      <JobSearchBox autoFocus={focusSearch} className="flex md:hidden" />

      <div role="group" aria-label="Filter by status" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
          {FILTERS.map((filter) => {
            const selected = filter === active;
            const count = summary.data ? filter.count(summary.data) : null;
            return (
              <button
                key={filter.id}
                type="button"
                aria-pressed={selected}
                onClick={() => chooseFilter(filter.id)}
                className={`flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold whitespace-nowrap transition ${selected ? "bg-primary text-white" : "bg-white text-ink ring-1 ring-line hover:ring-primary/40"}`}
              >
                <Dual k={filter.label} rwClassName={selected ? "font-medium text-white/75" : "font-medium text-muted"} />
                {count !== null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${selected ? "bg-white/20" : "bg-field text-muted"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div aria-live="polite" aria-busy={search.isFetching} className={search.isPlaceholderData ? "opacity-60 transition" : ""}>
        <JobList
          query={search}
          jobs={jobs}
          empty={
            <div className="rounded-2xl bg-white p-6 text-sm shadow-sm ring-1 ring-line/60">
              <Stacked k={q ? "noSearchResults" : "noJobsHere"} className="text-muted" />
            </div>
          }
        />
      </div>

      {search.hasNextPage && (
        <button
          type="button"
          onClick={() => void search.fetchNextPage()}
          disabled={search.isFetchingNextPage}
          className="mx-auto flex min-h-12 w-full max-w-xs items-center justify-center rounded-xl bg-white text-sm font-bold text-primary ring-1 ring-primary/30 hover:bg-primary-soft disabled:opacity-60"
        >
          <Dual k="loadMore" rwClassName="font-medium text-primary/70" />
        </button>
      )}
    </div>
  );
}
