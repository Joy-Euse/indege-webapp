import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CircleCheck, Hourglass, Info, Send, UserRound, X } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorBanner, SuccessBanner, TextAreaField } from "../../components/Form";
import { MessageButton } from "../../components/MessageButton";
import { WorkerPaymentPanel } from "../../components/PaymentParts";
import { CategoryIcon, JobSummary, LoadError, Loading, StatusBadge } from "../../components/JobParts";
import { Dual, Stacked } from "../../components/Text";
import { ApplicationBadge, PersonCard } from "../../components/WorkParts";
import type { StringKey } from "../../i18n/strings";
import { api } from "../../lib/api";
import { CATEGORY_LABELS } from "../../lib/jobs";
import { MAX_MESSAGE_LENGTH, useWorkJob, useWorkKey, type WorkerJob } from "../../lib/work";

const STATUS_TEXT: Record<string, StringKey> = {
  PENDING: "pendingText",
  HIRED: "hiredText",
  NOT_SELECTED: "notSelectedText",
  WITHDRAWN: "withdrawnText",
};

export function WorkJobDetails() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const workKey = useWorkKey();
  const job = useWorkJob(id);
  const [message, setMessage] = useState("");
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const [justApplied, setJustApplied] = useState(false);

  // Also refreshes after a failure: the job may have closed, or been applied to on another device.
  const refresh = async (updated?: WorkerJob) => {
    if (updated) queryClient.setQueryData([...workKey, "job", id], updated);
    await queryClient.invalidateQueries({ queryKey: workKey });
  };

  const apply = useMutation({
    mutationFn: () => api<{ job: WorkerJob }>(`/work/jobs/${id}/apply`, "POST", { message: message.trim() || undefined }),
    onSuccess: async ({ job: updated }) => {
      setJustApplied(true);
      setMessage("");
      await refresh(updated);
    },
    onError: () => refresh(),
  });

  const withdraw = useMutation({
    mutationFn: () => api<{ job: WorkerJob }>(`/work/jobs/${id}/withdraw`, "POST"),
    onSuccess: async ({ job: updated }) => {
      setJustApplied(false);
      await refresh(updated);
    },
    onError: () => refresh(),
    onSettled: () => setConfirmingWithdraw(false),
  });

  const data = job.data;
  const application = data?.myApplication ?? null;
  const hired = application?.status === "HIRED";
  const canApply =
    data !== undefined &&
    data.status === "OPEN" &&
    new Date(data.startsAt) > new Date() &&
    (application === null || application.status === "WITHDRAWN");
  const tooLong = message.length > MAX_MESSAGE_LENGTH;

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Link to="/worker/jobs" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-bold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden="true" />
        <Dual k="navFindWork" rwClassName="font-medium" />
      </Link>

      {job.isPending && <Loading />}
      {job.isError && <LoadError error={job.error} onRetry={() => void job.refetch()} />}

      {data && (
        <>
          {justApplied && application?.status === "PENDING" && <SuccessBanner k="applySent" />}
          <ErrorBanner error={apply.error ?? withdraw.error} />

          <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start lg:gap-6">
            <div className="space-y-4">
              <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line/60 lg:p-6">
                <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
                  <CategoryIcon category={data.category} />
                  <h1 className="min-w-0 flex-1 text-lg font-extrabold">
                    <Dual k={CATEGORY_LABELS[data.category]} />
                  </h1>
                  {data.status !== "OPEN" && <StatusBadge status={data.status} />}
                </div>
                <JobSummary job={data} landmarkNote={hired ? null : "landmarkAfterHire"} />
              </div>

              <div className="flex items-start gap-2 rounded-xl bg-tertiary-soft p-3 text-xs text-tertiary">
                <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
                <Stacked k="workerPaymentNotice" className="font-medium" />
              </div>
            </div>

            <div className="space-y-4 lg:sticky lg:top-24">
              {application && !(application.status === "WITHDRAWN" && canApply) && (
                <section aria-labelledby="my-application" className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line/60 lg:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <h2 id="my-application" className="flex items-center gap-2 font-extrabold">
                      {hired ? (
                        <CircleCheck className="size-5 text-primary" aria-hidden="true" />
                      ) : (
                        <Hourglass className="size-5 text-secondary-dark" aria-hidden="true" />
                      )}
                      <span>
                        <Dual k="yourApplication" />
                      </span>
                    </h2>
                    <ApplicationBadge status={application.status} />
                  </div>
                  <Stacked k={STATUS_TEXT[application.status]} className="mt-2 block text-sm text-muted" />
                  {application.message && (
                    <div className="mt-3 rounded-xl bg-surface p-3 text-sm">
                      <p className="text-xs font-semibold text-muted">
                        <Dual k="yourMessage" rwClassName="font-normal" />
                      </p>
                      <p className="mt-1 whitespace-pre-line break-words">{application.message}</p>
                    </div>
                  )}

                  {application.status === "PENDING" && (
                    <div className="mt-4">
                      <MessageButton
                        jobId={data.id}
                        conversationId={data.conversationId}
                        canMessage={data.canMessage}
                        label="messageCustomer"
                      />
                    </div>
                  )}
                  {application.status === "PENDING" && !confirmingWithdraw && (
                    <button
                      type="button"
                      onClick={() => setConfirmingWithdraw(true)}
                      className="mt-4 flex min-h-12 w-full items-center justify-center gap-1.5 rounded-xl text-sm font-bold text-danger ring-1 ring-danger/30 hover:bg-danger-soft"
                    >
                      <X className="size-4" aria-hidden="true" />
                      <Stacked k="withdraw" className="leading-tight" />
                    </button>
                  )}
                  {application.status === "PENDING" && confirmingWithdraw && (
                    <div role="alertdialog" aria-label="Withdraw application" className="mt-4 space-y-3 rounded-2xl bg-danger-soft p-4">
                      <Stacked k="withdrawQuestion" className="block text-sm font-medium text-danger" />
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setConfirmingWithdraw(false)}
                          disabled={withdraw.isPending}
                          className="min-h-12 rounded-xl bg-card text-sm font-bold ring-1 ring-line disabled:opacity-60"
                        >
                          <Stacked k="keepApplication" className="leading-tight" />
                        </button>
                        <button
                          type="button"
                          onClick={() => withdraw.mutate()}
                          disabled={withdraw.isPending}
                          className="min-h-12 rounded-xl bg-danger text-sm font-bold text-on-fill disabled:opacity-60"
                        >
                          <Stacked k="confirmWithdraw" className="leading-tight" />
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {hired && <WorkerPaymentPanel job={data} />}

              {hired && data.customer && (
                <section aria-labelledby="customer" className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line/60 lg:p-6">
                  <h2 id="customer" className="mb-3 flex items-center gap-2 font-extrabold">
                    <UserRound className="size-5 text-primary" aria-hidden="true" />
                    <span>
                      <Dual k="yourCustomer" />
                    </span>
                  </h2>
                  <PersonCard person={data.customer} expectContact />
                  <div className="mt-4">
                    <MessageButton
                      jobId={data.id}
                      conversationId={data.conversationId}
                      canMessage={data.canMessage}
                      label="messageCustomer"
                    />
                  </div>
                </section>
              )}

              {canApply && (
                <form
                  aria-labelledby="apply"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!tooLong) apply.mutate();
                  }}
                  className="space-y-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line/60 lg:p-6"
                >
                  <h2 id="apply" className="font-extrabold">
                    <Dual k={application?.status === "WITHDRAWN" ? "applyAgain" : "applyTitle"} />
                  </h2>
                  <TextAreaField
                    label="applyMessage"
                    rows={3}
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    error={tooLong ? { type: "maxLength", message: "errMessageLong" } : undefined}
                    hint={
                      <>
                        <Dual k="applyMessageHint" rwClassName="" /> ({message.length}/{MAX_MESSAGE_LENGTH})
                      </>
                    }
                  />
                  <button
                    type="submit"
                    disabled={apply.isPending || tooLong}
                    className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 font-display text-base font-extrabold text-on-secondary shadow-sm transition hover:bg-[#e58a1f] disabled:opacity-60"
                  >
                    {apply.isPending ? (
                      <span className="size-5 animate-spin rounded-full border-[3px] border-on-secondary/25 border-t-on-secondary" role="status" aria-label="Loading" />
                    ) : (
                      <>
                        <Send className="size-5" aria-hidden="true" />
                        <span>
                          <Dual k="applyAction" rwClassName="font-medium text-on-secondary/70" />
                        </span>
                      </>
                    )}
                  </button>
                </form>
              )}

              {!canApply && !application && (
                <div className="rounded-2xl bg-card p-4 text-sm shadow-sm ring-1 ring-line/60">
                  <Stacked k="jobClosedText" className="text-muted" />
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
