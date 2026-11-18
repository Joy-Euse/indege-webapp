import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UserCheck, Users } from "lucide-react";
import { useState } from "react";
import { ErrorBanner, SuccessBanner } from "../../components/Form";
import { LoadError, Loading } from "../../components/JobParts";
import { Dual, Stacked } from "../../components/Text";
import { ApplicationBadge, PersonCard } from "../../components/WorkParts";
import { api } from "../../lib/api";
import type { Job } from "../../lib/jobs";
import { useApplicants, useJobsKey } from "../../lib/useJobs";
import type { Applicant } from "../../lib/work";

/** The workers who applied for a customer's job, and the button to hire one. */
export function Applicants({ job }: { job: Job }) {
  const queryClient = useQueryClient();
  const jobsKey = useJobsKey();
  const applicants = useApplicants(job.id);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const hire = useMutation({
    mutationFn: (applicationId: string) => api<{ job: Job }>(`/jobs/${job.id}/applications/${applicationId}/hire`, "POST"),
    // Also after a failure: the worker may have withdrawn, or the job changed on another device.
    onSettled: async () => {
      setConfirmingId(null);
      await queryClient.invalidateQueries({ queryKey: jobsKey });
    },
  });

  const list = applicants.data ?? [];
  const hired = list.find((applicant) => applicant.status === "HIRED");
  // Once someone is hired, the others are only history, so they are not shown.
  const shown = hired ? [hired] : list.filter((applicant) => applicant.status === "PENDING");

  return (
    <section aria-labelledby="applications" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60 lg:p-6">
      <h2 id="applications" className="flex items-center gap-2 font-extrabold">
        {hired ? <UserCheck className="size-5 text-primary" aria-hidden="true" /> : <Users className="size-5 text-primary" aria-hidden="true" />}
        <span className="flex-1">
          <Dual k={hired ? "hiredWorker" : "applications"} />
        </span>
        {!hired && shown.length > 0 && (
          <span className="rounded-full bg-secondary-soft px-2 py-0.5 text-xs tabular-nums text-secondary-dark">{shown.length}</span>
        )}
      </h2>

      <div className="mt-3 space-y-3">
        {hire.isSuccess && hired && <SuccessBanner k="workerHired" />}
        <ErrorBanner error={hire.error} />

        {applicants.isPending && <Loading />}
        {applicants.isError && <LoadError error={applicants.error} onRetry={() => void applicants.refetch()} />}
        {applicants.isSuccess && shown.length === 0 && <Stacked k="noApplications" className="block text-sm text-muted" />}

        <ul className="divide-y divide-line">
          {shown.map((applicant) => (
            <li key={applicant.id} className="py-4 first:pt-1 last:pb-0">
              <ApplicantRow
                applicant={applicant}
                canHire={job.status === "OPEN" && applicant.status === "PENDING"}
                confirming={confirmingId === applicant.id}
                busy={hire.isPending}
                onAsk={() => setConfirmingId(applicant.id)}
                onCancel={() => setConfirmingId(null)}
                onConfirm={() => hire.mutate(applicant.id)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

interface ApplicantRowProps {
  applicant: Applicant;
  canHire: boolean;
  confirming: boolean;
  busy: boolean;
  onAsk: () => void;
  onCancel: () => void;
  onConfirm: () => void;
}

function ApplicantRow({ applicant, canHire, confirming, busy, onAsk, onCancel, onConfirm }: ApplicantRowProps) {
  const hired = applicant.status === "HIRED";
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <PersonCard person={applicant.worker} expectContact={hired} />
        </div>
        {!hired && <ApplicationBadge status={applicant.status} />}
      </div>

      {applicant.message && (
        <blockquote className="whitespace-pre-line break-words rounded-xl bg-surface p-3 text-sm">“{applicant.message}”</blockquote>
      )}

      {canHire && !confirming && (
        <button
          type="button"
          onClick={onAsk}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-bold text-white hover:bg-primary/90"
        >
          <UserCheck className="size-4" aria-hidden="true" />
          <Dual k="hire" rwClassName="font-medium text-white/75" />
        </button>
      )}

      {canHire && confirming && (
        <div role="alertdialog" aria-label="Hire this worker" className="space-y-3 rounded-2xl bg-primary-soft p-4">
          <Stacked k="hireQuestion" className="block text-sm font-medium text-primary" />
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="min-h-12 rounded-xl bg-white text-sm font-bold ring-1 ring-line disabled:opacity-60"
            >
              <Stacked k="cancel" className="leading-tight" />
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className="min-h-12 rounded-xl bg-primary text-sm font-bold text-white disabled:opacity-60"
            >
              <Stacked k="confirmHire" className="leading-tight" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
