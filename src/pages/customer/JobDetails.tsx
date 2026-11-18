import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Pencil, X } from "lucide-react";
import { useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ErrorBanner, SuccessBanner } from "../../components/Form";
import {
  CategoryIcon,
  JobSummary,
  LoadError,
  Loading,
  MissedStartNote,
  PaymentNotice,
  StatusBadge,
} from "../../components/JobParts";
import { Dual, Stacked } from "../../components/Text";
import { Applicants } from "./Applicants";
import type { StringKey } from "../../i18n/strings";
import { api } from "../../lib/api";
import { CATEGORY_LABELS, hasMissedStart, type Job } from "../../lib/jobs";
import { useJob, useJobsKey } from "../../lib/useJobs";

export function JobDetails() {
  const { id = "" } = useParams();
  const location = useLocation();
  const notice = (location.state as { notice?: StringKey } | null)?.notice;
  const queryClient = useQueryClient();
  const jobsKey = useJobsKey();
  const job = useJob(id);
  const [confirming, setConfirming] = useState(false);

  const cancel = useMutation({
    mutationFn: () => api<{ job: Job }>(`/jobs/${id}/cancel`, "POST"),
    onSettled: async () => {
      setConfirming(false);
      // Also after a failure: someone may have changed the job on another device.
      await queryClient.invalidateQueries({ queryKey: jobsKey });
    },
  });

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link to="/customer/jobs" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        <Dual k="navMyJobs" rwClassName="font-medium" />
      </Link>

      {job.isPending && <Loading />}
      {job.isError && <LoadError error={job.error} onRetry={() => void job.refetch()} />}

      {job.isSuccess && (
        <>
          {notice && job.data.status === "OPEN" && <SuccessBanner k={notice} />}
          <ErrorBanner error={cancel.error} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
            <div className="space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60 lg:p-6">
                <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
                  <CategoryIcon category={job.data.category} />
                  <h1 className="min-w-0 flex-1 text-lg font-extrabold">
                    <Dual k={CATEGORY_LABELS[job.data.category]} />
                  </h1>
                  <StatusBadge status={job.data.status} />
                </div>
                <JobSummary job={job.data} landmarkNote={job.data.status === "OPEN" ? "landmarkHint" : null} />
                {hasMissedStart(job.data) && <MissedStartNote />}
              </div>

              <PaymentNotice />
            </div>

            <div className="space-y-4 lg:sticky lg:top-24">
              <Applicants job={job.data} />

              {job.data.status === "OPEN" && !confirming && (
                <div className="grid grid-cols-2 gap-2.5">
                  <Link
                    to={`/customer/jobs/${id}/edit`}
                    className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-primary ring-1 ring-primary/30 hover:bg-primary-soft"
                  >
                    <Pencil className="size-4" aria-hidden="true" />
                    <Stacked k="editJob" className="leading-tight" />
                  </Link>
                  <button
                    type="button"
                    onClick={() => setConfirming(true)}
                    className="flex min-h-12 items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-danger ring-1 ring-danger/30 hover:bg-danger-soft"
                  >
                    <X className="size-4" aria-hidden="true" />
                    <Stacked k="cancelJob" className="leading-tight" />
                  </button>
                </div>
              )}

              {job.data.status === "OPEN" && confirming && (
                <div role="alertdialog" aria-label="Cancel this job" className="space-y-3 rounded-2xl bg-danger-soft p-4">
                  <Stacked k="cancelQuestion" className="block text-sm font-medium text-danger" />
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setConfirming(false)}
                      disabled={cancel.isPending}
                      className="min-h-12 rounded-xl bg-white text-sm font-bold ring-1 ring-line disabled:opacity-60"
                    >
                      <Stacked k="keepJob" className="leading-tight" />
                    </button>
                    <button
                      type="button"
                      onClick={() => cancel.mutate()}
                      disabled={cancel.isPending}
                      className="min-h-12 rounded-xl bg-danger text-sm font-bold text-white disabled:opacity-60"
                    >
                      <Stacked k="confirmCancel" className="leading-tight" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
