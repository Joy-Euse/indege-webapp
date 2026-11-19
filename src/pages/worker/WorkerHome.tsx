import { ArrowRight, Banknote, BriefcaseBusiness, CircleCheck, Hourglass, Search, UserRound } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { JobList, LoadError, Loading } from "../../components/JobParts";
import { StatCard, TILE_TONES } from "../../components/StatCard";
import { Dual, Stacked } from "../../components/Text";
import { EmptyBox, workerBadge } from "../../components/WorkParts";
import type { StringKey } from "../../i18n/strings";
import { useOwnProfile } from "../../lib/account";
import { type District, formatRwf } from "../../lib/jobs";
import { useMyApplications, useOpenJobs, useWorkSummary } from "../../lib/work";

const JOBS_SHOWN = 5;
const APPLICATIONS_SHOWN = 4;

export function WorkerHome() {
  const { state } = useAuth();
  const firstName = state.user?.fullName.split(" ")[0];
  const profile = useOwnProfile();
  const summary = useWorkSummary();
  // Jobs in the worker's home district if they have set one and there are any, otherwise all of them.
  const profileSettled = !profile.isPending;
  const homeDistrict = (profile.data?.district ?? undefined) as District | undefined;
  const nearby = useOpenJobs({ district: homeDistrict, limit: JOBS_SHOWN }, profileSettled && !!homeDistrict);
  const showNearby = !!homeDistrict && !!nearby.data?.jobs.length;
  const everywhere = useOpenJobs({ limit: JOBS_SHOWN }, profileSettled && (!homeDistrict || nearby.data?.jobs.length === 0 || nearby.isError));
  const openJobs = showNearby ? nearby : everywhere;
  const applications = useMyApplications("all", APPLICATIONS_SHOWN);
  const recent = applications.data?.pages[0]?.applications.map((application) => ({
    ...application.job,
    myApplication: application,
  }));
  const profileIncomplete = profile.isSuccess && (!profile.data.bio || !profile.data.district);

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-wide text-secondary-dark">
          <Dual k="workerDashboard" rwClassName="font-medium" />
        </p>
        <h1 className="mt-1 text-3xl font-extrabold lg:text-4xl">Muraho, {firstName}!</h1>
        <Stacked k="workerIntro" className="mt-1 text-muted" />
      </div>

      <Link
        to="/worker/jobs"
        className="flex items-center gap-3 rounded-2xl bg-secondary p-4 text-on-secondary shadow-sm transition hover:bg-[#e58a1f] md:hidden"
      >
        <Search className="size-8 shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg font-extrabold">
            <Dual k="navFindWork" rwClassName="font-medium" />
          </span>
          {summary.data && (
            <span className="mt-0.5 block text-sm font-semibold">
              {summary.data.openJobs} · <Dual k="statJobsAvailable" rwClassName="font-normal" />
            </span>
          )}
        </span>
        <ArrowRight className="size-5 shrink-0" aria-hidden="true" />
      </Link>

      {profileIncomplete && (
        <Link
          to="/settings/profile"
          className="flex items-center gap-3 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-secondary/40 transition hover:ring-secondary"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary-soft text-secondary-dark">
            <UserRound className="size-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 text-sm">
            <span className="block font-bold">
              <Dual k="completeProfile" />
            </span>
            <Stacked k="completeProfileText" className="mt-0.5 block text-muted" />
          </span>
          <ArrowRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
        </Link>
      )}

      <section aria-label="Summary">
        {summary.isError ? (
          <LoadError error={summary.error} onRetry={() => void summary.refetch()} />
        ) : (
          <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            <StatCard icon={BriefcaseBusiness} label="statJobsAvailable" value={summary.data?.openJobs} to="/worker/jobs" tone={TILE_TONES[0]} />
            <StatCard icon={Hourglass} label="statPending" value={summary.data?.pending} to="/worker/applications?status=pending" tone={TILE_TONES[1]} />
            <StatCard icon={CircleCheck} label="statHired" value={summary.data?.hired} to="/worker/applications?status=hired" tone={TILE_TONES[2]} />
            <StatCard
              icon={Banknote}
              label="statUpcomingPay"
              value={summary.data ? formatRwf(summary.data.upcomingWagesRwf) : undefined}
              tone={TILE_TONES[0]}
              to="/worker/earnings"
            />
          </ul>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-3 xl:gap-8">
        <section aria-labelledby="new-jobs" className="xl:col-span-2">
          <SectionHeading id="new-jobs" title="newJobs" subtitle={showNearby ? "nearYou" : undefined} to="/worker/jobs" />
          <JobList
            query={openJobs}
            jobs={openJobs.data?.jobs}
            hrefFor={(job) => `/worker/jobs/${job.id}`}
            badgeFor={workerBadge}
            forCustomer={false}
            empty={<EmptyBox k="noOpenJobs" />}
          />
        </section>

        <section aria-labelledby="my-applications">
          <SectionHeading id="my-applications" title="recentApplications" to="/worker/applications" />
          {applications.isPending ? (
            <Loading />
          ) : applications.isError ? (
            <LoadError error={applications.error} onRetry={() => void applications.refetch()} />
          ) : recent?.length ? (
            // Always cards here: the column is narrow even on wide screens.
            <ul className="space-y-2.5">
              {recent.map((job) => (
                <li key={job.myApplication.id}>
                  <Link
                    to={`/worker/jobs/${job.id}`}
                    className="flex items-center gap-3 rounded-xl bg-card p-3 shadow-sm ring-1 ring-line/60 transition hover:ring-primary/40"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold">{job.description}</span>
                      <span className="block truncate text-xs text-muted">
                        {job.sector}, {job.district} · {formatRwf(job.wageRwf)}
                      </span>
                    </span>
                    {workerBadge(job)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyBox k="noApplicationsYet" />
          )}
        </section>
      </div>
    </div>
  );
}

function SectionHeading({ id, title, subtitle, to }: { id: string; title: StringKey; subtitle?: StringKey; to: string }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-2">
      <div>
        <h2 id={id} className="text-lg font-extrabold">
          <Dual k={title} />
        </h2>
        {subtitle && (
          <p className="text-xs font-semibold text-muted">
            <Dual k={subtitle} rwClassName="font-normal" />
          </p>
        )}
      </div>
      <Link to={to} className="flex min-h-11 shrink-0 items-center text-sm font-bold text-secondary-dark underline underline-offset-2">
        <Dual k="seeAll" rwClassName="font-medium" />
      </Link>
    </div>
  );
}
