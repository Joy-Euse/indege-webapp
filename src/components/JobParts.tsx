import {
  Banknote,
  Bike,
  CalendarClock,
  ChevronRight,
  CircleAlert,
  Clock,
  Flower2,
  Hammer,
  House,
  Info,
  type LucideIcon,
  MapPin,
  Sparkles,
  Tractor,
  Truck,
  Users,
  UtensilsCrossed,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { StringKey } from "../i18n/strings";
import { ApiError } from "../lib/api";
import {
  CATEGORY_LABELS,
  formatDateTime,
  formatRwf,
  hasMissedStart,
  type Job,
  type JobCategory,
  type JobStatus,
  STATUS_LABELS,
} from "../lib/jobs";
import { ErrorBanner } from "./Form";
import { Dual, plain, Stacked } from "./Text";

export const CATEGORY_ICONS: Record<JobCategory, LucideIcon> = {
  CLEANING: Sparkles,
  CONSTRUCTION: Hammer,
  GARDENING: Flower2,
  FARMING: Tractor,
  MOVING: Truck,
  COURIER: Bike,
  DOMESTIC: House,
  HOSPITALITY: UtensilsCrossed,
};

const STATUS_STYLES: Record<JobStatus, string> = {
  OPEN: "bg-primary-soft text-primary",
  ASSIGNED: "bg-tertiary-soft text-tertiary",
  IN_PROGRESS: "bg-secondary-soft text-secondary-dark",
  COMPLETED: "bg-field text-muted",
  CANCELLED: "bg-danger-soft text-danger",
};

export function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span className={`shrink-0 rounded-full px-2.5 py-1 text-center text-xs font-bold ${STATUS_STYLES[status]}`}>
      <Stacked k={STATUS_LABELS[status]} className="leading-tight" />
    </span>
  );
}

export function CategoryIcon({ category }: { category: JobCategory }) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
      <Icon className="size-5" aria-hidden="true" />
    </span>
  );
}

/** What a job list needs. Workers never get the landmark, so lists do not use it. */
export type ListJob = Omit<Job, "landmark"> & { pendingApplications?: number };

interface JobLinkOptions<T extends ListJob> {
  /** Where each job opens. Defaults to the customer's job page. */
  hrefFor?: (job: T) => string;
  /** What shows in place of the job's status badge. */
  badgeFor?: (job: T) => ReactNode;
  /** Customers are told when an open job's start time has passed. Workers never are. */
  forCustomer?: boolean;
}

const customerHref = (job: ListJob) => `/customer/jobs/${job.id}`;
const statusBadge = (job: ListJob) => <StatusBadge status={job.status} />;

export function JobCard<T extends ListJob>({
  job,
  hrefFor = customerHref,
  badgeFor = statusBadge,
  forCustomer = true,
}: { job: T } & JobLinkOptions<T>) {
  return (
    <Link
      to={hrefFor(job)}
      className="block rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line/60 transition hover:ring-primary/40"
    >
      <div className="flex items-start gap-3">
        <CategoryIcon category={job.category} />
        <div className="min-w-0 flex-1">
          <h3 className="font-bold">
            <Dual k={CATEGORY_LABELS[job.category]} />
          </h3>
          <p className="mt-0.5 truncate text-sm text-muted">{job.sector}, {job.district}</p>
          <p className="mt-0.5 text-sm text-muted">{formatDateTime(job.startsAt)}</p>
        </div>
        {badgeFor(job)}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
        <p className="font-display font-extrabold text-primary">{formatRwf(job.wageRwf)}</p>
        <span className="flex items-center gap-2">
          <ApplicantCount job={job} />
          <ChevronRight className="size-5 text-muted" aria-hidden="true" />
        </span>
      </div>
      {forCustomer && hasMissedStart(job) && <MissedStartNote />}
    </Link>
  );
}

/** The state of a query that loads jobs, so lists can show loading and errors the same way. */
interface JobsQueryState {
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

/** Shows how many workers are waiting for an answer on a customer's open job. */
function ApplicantCount({ job }: { job: ListJob }) {
  if (!job.pendingApplications || job.status !== "OPEN") return null;
  return (
    <span className="flex items-center gap-1 rounded-full bg-secondary-soft px-2 py-0.5 text-xs font-bold text-secondary-dark">
      <Users className="size-3.5" aria-hidden="true" />
      {job.pendingApplications}
      <span className="sr-only">{plain("applicantsWaiting")}</span>
    </span>
  );
}

interface JobListProps<T extends ListJob> extends JobLinkOptions<T> {
  query: JobsQueryState;
  jobs: T[] | undefined;
  empty: ReactNode;
}

/** Jobs as a table on wide screens and as cards on narrower ones. */
export function JobList<T extends ListJob>({ query, jobs, empty, ...options }: JobListProps<T>) {
  if (query.isPending) return <Loading />;
  if (query.isError) return <LoadError error={query.error} onRetry={() => void query.refetch()} />;
  if (!jobs?.length) return <>{empty}</>;

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 lg:hidden">
        {jobs.map((job) => (
          <JobCard key={job.id} job={job} {...options} />
        ))}
      </div>
      <JobTable jobs={jobs} {...options} />
    </>
  );
}

function JobTable<T extends ListJob>({
  jobs,
  hrefFor = customerHref,
  badgeFor = statusBadge,
  forCustomer = true,
}: { jobs: T[] } & JobLinkOptions<T>) {
  const head = "px-4 py-3 text-left text-xs font-semibold text-muted";
  return (
    <div className="hidden overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-line/60 lg:block">
      <table className="w-full table-fixed text-sm">
        <thead className="border-b border-line bg-surface/60">
          <tr>
            <th scope="col" className={`${head} w-[38%]`}>
              <Dual k="colJob" rwClassName="font-normal" />
            </th>
            <th scope="col" className={head}>
              <Dual k="location" rwClassName="font-normal" />
            </th>
            <th scope="col" className={head}>
              <Dual k="colStarts" rwClassName="font-normal" />
            </th>
            <th scope="col" className={`${head} text-right`}>
              <Dual k="wage" rwClassName="font-normal" />
            </th>
            <th scope="col" className={`${head} w-36`}>
              <Dual k="colStatus" rwClassName="font-normal" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {jobs.map((job) => (
            // The job link stretches over the row, so the whole row is clickable with one link to tab to.
            <tr key={job.id} className="relative transition hover:bg-surface/70">
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <CategoryIcon category={job.category} />
                  <div className="min-w-0">
                    <Link
                      to={hrefFor(job)}
                      className="font-bold after:absolute after:inset-0 after:content-[''] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-secondary"
                    >
                      <Dual k={CATEGORY_LABELS[job.category]} />
                    </Link>
                    <p className="truncate text-xs text-muted">{job.description}</p>
                  </div>
                </div>
              </td>
              <td className="truncate px-4 py-3 text-muted">
                {job.sector}, {job.district}
              </td>
              <td className="px-4 py-3 text-muted">
                {formatDateTime(job.startsAt)}
                {forCustomer && hasMissedStart(job) && (
                  <CircleAlert className="ml-1.5 inline size-4 text-secondary-dark" aria-label="Start time has passed" />
                )}
              </td>
              <td className="px-4 py-3 text-right font-display font-extrabold tabular-nums text-primary">{formatRwf(job.wageRwf)}</td>
              <td className="px-4 py-3">
                <span className="flex items-center gap-2">
                  {badgeFor(job)}
                  <ApplicantCount job={job} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MissedStartNote() {
  return (
    <p className="mt-3 flex items-start gap-1.5 rounded-lg bg-secondary-soft p-2.5 text-xs font-medium text-secondary-dark">
      <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <Stacked k="missedStart" />
    </p>
  );
}

function DetailRow({ icon: Icon, label, children }: { icon: LucideIcon; label: StringKey; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
      <Icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-muted">
          <Dual k={label} rwClassName="font-normal" />
        </p>
        <div className="mt-0.5 break-words text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}

type JobSummaryValues = Pick<Job, "description" | "district" | "sector" | "startsAt" | "durationHours" | "wageRwf"> & {
  landmark?: string;
};

/**
 * The details of a job. Customers see their landmark with a note that it is private. Workers see
 * it only once hired, and otherwise a note saying when they will.
 */
export function JobSummary({ job, landmarkNote = "landmarkHint" }: { job: JobSummaryValues; landmarkNote?: StringKey | null }) {
  return (
    <div className="divide-y divide-line">
      <DetailRow icon={Info} label="jobDescription">
        <p className="whitespace-pre-line">{job.description}</p>
      </DetailRow>
      <DetailRow icon={MapPin} label="location">
        <p>{job.sector}, {job.district}</p>
        {job.landmark && <p className="font-normal text-muted">{job.landmark}</p>}
        {landmarkNote && (
          <p className="mt-1 text-xs font-normal text-muted">
            <Dual k={landmarkNote} rwClassName="" />
          </p>
        )}
      </DetailRow>
      <DetailRow icon={CalendarClock} label="dateAndTime">
        {formatDateTime(job.startsAt)}
      </DetailRow>
      <DetailRow icon={Clock} label="duration">
        {job.durationHours} <Dual k="hoursShort" />
      </DetailRow>
      <DetailRow icon={Banknote} label="wage">
        <span className="font-display text-lg font-extrabold text-primary">{formatRwf(job.wageRwf)}</span>
      </DetailRow>
    </div>
  );
}

export function PaymentNotice() {
  return (
    <div className="flex items-start gap-2 rounded-xl bg-tertiary-soft p-3 text-xs text-tertiary">
      <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
      <Stacked k="paymentNotice" className="font-medium" />
    </div>
  );
}

export function Loading() {
  return (
    <div className="grid place-items-center py-12" role="status" aria-label="Loading">
      <span className="size-8 animate-spin rounded-full border-4 border-primary-soft border-t-primary" />
    </div>
  );
}

/** Shows a failed load. A retry can't fix a job that doesn't exist, so that case has no button. */
export function LoadError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const retryable = !(error instanceof ApiError && error.status < 500);
  return (
    <div className="space-y-3">
      <ErrorBanner error={error} />
      {retryable && (
        <button
          type="button"
          onClick={onRetry}
          className="min-h-11 w-full rounded-xl text-sm font-bold text-primary ring-1 ring-primary/30 hover:bg-primary-soft"
        >
          <Dual k="tryAgain" rwClassName="font-medium text-primary/70" />
        </button>
      )}
    </div>
  );
}
