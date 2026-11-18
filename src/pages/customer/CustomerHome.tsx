import { ArrowRight, Banknote, CircleCheck, CirclePlus, Clock, FolderOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { CATEGORY_ICONS, JobList, LoadError } from "../../components/JobParts";
import { StatCard, TILE_TONES } from "../../components/StatCard";
import { Dual, Stacked } from "../../components/Text";
import { CATEGORY_LABELS, formatRwf, OFFERED_CATEGORIES } from "../../lib/jobs";
import { useJobList, useJobSummary } from "../../lib/useJobs";

const MAX_ACTIVE_SHOWN = 5;

export function CustomerHome() {
  const { state } = useAuth();
  const summary = useJobSummary();
  const active = useJobList({ status: "active", limit: MAX_ACTIVE_SHOWN });
  const firstName = state.user?.fullName.split(" ")[0];

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold lg:text-4xl">Muraho, {firstName}!</h1>
        <Stacked k="dashboardIntro" className="mt-1 text-muted" />
      </div>

      <Link
        to="/customer/jobs/new"
        className="flex items-center gap-3 rounded-2xl bg-secondary p-4 text-ink shadow-sm transition hover:bg-[#e58a1f] md:hidden"
      >
        <CirclePlus className="size-8 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-extrabold">
            <Dual k="postJob" rwClassName="font-medium" />
          </span>
          <Stacked k="postJobText" className="mt-0.5 block text-sm" />
        </span>
        <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
      </Link>

      <section aria-label="Summary">
        {summary.isError ? (
          <LoadError error={summary.error} onRetry={() => void summary.refetch()} />
        ) : (
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard icon={FolderOpen} label="statOpen" value={summary.data?.open} to="/customer/jobs?status=open" tone={TILE_TONES[0]} />
            <StatCard icon={Clock} label="statInProgress" value={summary.data?.inProgress} to="/customer/jobs?status=in-progress" tone={TILE_TONES[1]} />
            <StatCard icon={CircleCheck} label="statCompleted" value={summary.data?.completed} to="/customer/jobs?status=completed" tone={TILE_TONES[2]} />
            <StatCard
              icon={Banknote}
              label="statActiveWages"
              value={summary.data ? formatRwf(summary.data.activeWagesRwf) : undefined}
              tone={TILE_TONES[0]}
            />
          </ul>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-3 xl:gap-8">
        <section aria-labelledby="active-jobs" className="xl:col-span-2">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 id="active-jobs" className="text-lg font-extrabold">
              <Dual k="activeJobs" />
            </h2>
            <Link
              to="/customer/jobs"
              className="flex min-h-11 shrink-0 items-center text-sm font-bold text-secondary-dark underline underline-offset-2"
            >
              <Dual k="seeAll" rwClassName="font-medium" />
            </Link>
          </div>
          <JobList
            query={active}
            jobs={active.data?.jobs}
            empty={
              <div className="rounded-2xl bg-white p-6 text-sm shadow-sm ring-1 ring-line/60">
                <Stacked k="noJobsYet" className="text-muted" />
              </div>
            }
          />
        </section>

        <section aria-labelledby="categories">
          <h2 id="categories" className="mb-3 text-lg font-extrabold">
            <Dual k="categories" />
          </h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-2">
            {OFFERED_CATEGORIES.map((category, index) => {
              const Icon = CATEGORY_ICONS[category];
              return (
                <Link
                  key={category}
                  to={`/customer/jobs/new?category=${category}`}
                  className="flex min-h-16 items-center gap-2.5 rounded-xl bg-white p-3 shadow-sm ring-1 ring-line/60 transition hover:ring-primary/40"
                >
                  <span className={`grid size-10 shrink-0 place-items-center rounded-lg ${TILE_TONES[index % TILE_TONES.length]}`}>
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <Stacked k={CATEGORY_LABELS[category]} className="min-w-0 text-sm font-bold" />
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
