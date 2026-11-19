import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Banknote, CircleCheck, CircleHelp, Clock, Smartphone, TriangleAlert, Wallet } from "lucide-react";
import { useId, useState } from "react";
import type { StringKey } from "../i18n/strings";
import { api } from "../lib/api";
import {
  canFinish,
  formatDate,
  formatDateTime,
  formatRwf,
  type Job,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  PAYMENT_STATUS_LABELS,
  type PaymentMethod,
  type PaymentStatus,
  paymentStatus,
} from "../lib/jobs";
import { useJobsKey } from "../lib/useJobs";
import { useWorkKey, type WorkerJob } from "../lib/work";
import { ErrorBanner } from "./Form";
import { Dual, Stacked } from "./Text";

const STATUS_STYLES: Record<PaymentStatus, string> = {
  UNPAID: "bg-secondary-soft text-secondary-dark",
  TO_CONFIRM: "bg-tertiary-soft text-tertiary",
  DISPUTED: "bg-danger-soft text-danger",
  RECEIVED: "bg-primary-soft text-primary",
};

const STATUS_ICONS = { UNPAID: Clock, TO_CONFIRM: CircleHelp, DISPUTED: TriangleAlert, RECEIVED: CircleCheck };

/** How the customer sees each state, where it differs from the worker's words. */
const CUSTOMER_LABELS: Partial<Record<PaymentStatus, StringKey>> = {
  TO_CONFIRM: "payStatusAwaitingWorker",
  RECEIVED: "payStatusConfirmed",
};

/** Always an icon and words with the color, so it never relies on color alone. */
export function PaymentBadge({ status, side = "worker" }: { status: PaymentStatus; side?: "worker" | "customer" }) {
  const Icon = STATUS_ICONS[status];
  const label = (side === "customer" && CUSTOMER_LABELS[status]) || PAYMENT_STATUS_LABELS[status];
  return (
    <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_STYLES[status]}`}>
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      <Stacked k={label} className="leading-tight" />
    </span>
  );
}

const METHOD_ICONS: Record<PaymentMethod, typeof Banknote> = { CASH: Banknote, MOBILE_MONEY: Smartphone };

type Choice = PaymentMethod | "NOT_YET";

/** Large radio buttons for how the wage was paid. */
function MethodPicker({
  legend,
  value,
  onChange,
  allowNotYet = false,
}: {
  legend: StringKey;
  value: Choice | null;
  onChange: (choice: Choice) => void;
  allowNotYet?: boolean;
}) {
  const name = useId();
  const choices: Choice[] = allowNotYet ? [...PAYMENT_METHODS, "NOT_YET"] : [...PAYMENT_METHODS];
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-bold">
        <Dual k={legend} />
      </legend>
      <div className="grid gap-2">
        {choices.map((choice) => {
          const Icon = choice === "NOT_YET" ? Clock : METHOD_ICONS[choice];
          const label: StringKey = choice === "NOT_YET" ? "payNotYet" : PAYMENT_METHOD_LABELS[choice];
          return (
            <label
              key={choice}
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl px-3 text-sm font-semibold ring-1 ring-line has-checked:bg-primary-soft has-checked:ring-2 has-checked:ring-primary has-focus-visible:outline-2 has-focus-visible:outline-primary"
            >
              <input
                type="radio"
                name={name}
                value={choice}
                checked={value === choice}
                onChange={() => onChange(choice)}
                className="sr-only"
              />
              <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <Dual k={label} />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PrimaryButton({ k, busy, disabled, onClick }: { k: StringKey; busy: boolean; disabled?: boolean; onClick?: () => void }) {
  return (
    <button
      type={onClick ? "button" : "submit"}
      onClick={onClick}
      disabled={busy || disabled}
      className="flex min-h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-extrabold text-on-fill shadow-sm transition hover:bg-primary-dark disabled:opacity-60"
    >
      {busy ? (
        <span className="size-5 animate-spin rounded-full border-[3px] border-on-fill/30 border-t-on-fill" role="status" aria-label="Loading" />
      ) : (
        <Dual k={k} rwClassName="font-medium text-on-fill/75" />
      )}
    </button>
  );
}

/** The wage, how it was paid, and when, as far as anyone has recorded it. */
function PaymentRecord({ job }: { job: Pick<Job, "wageRwf" | "paymentMethod" | "paidAt" | "completedAt"> }) {
  return (
    <dl className="grid grid-cols-2 gap-3 rounded-xl bg-surface p-3 text-sm">
      <div>
        <dt className="text-xs font-semibold text-muted">
          <Dual k="payAmount" rwClassName="font-normal" />
        </dt>
        <dd className="font-display font-extrabold text-primary">{formatRwf(job.wageRwf)}</dd>
      </div>
      {job.paymentMethod && job.paidAt ? (
        <div>
          <dt className="text-xs font-semibold text-muted">
            <Dual k="payPaidBy" rwClassName="font-normal" />
          </dt>
          <dd className="font-semibold">
            <Dual k={PAYMENT_METHOD_LABELS[job.paymentMethod]} rwClassName="font-normal text-muted" />
            <span className="block text-xs font-normal text-muted">{formatDate(job.paidAt)}</span>
          </dd>
        </div>
      ) : (
        job.completedAt && (
          <div>
            <dt className="text-xs font-semibold text-muted">
              <Dual k="payDoneOn" rwClassName="font-normal" />
            </dt>
            <dd className="font-semibold">{formatDate(job.completedAt)}</dd>
          </div>
        )
      )}
    </dl>
  );
}

function PanelHeading({ id, status, side }: { id: string; status: PaymentStatus | null; side: "worker" | "customer" }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 id={id} className="flex items-center gap-2 font-extrabold">
        <Wallet className="size-5 text-primary" aria-hidden="true" />
        <span>
          <Dual k="payTitle" />
        </span>
      </h2>
      {status && <PaymentBadge status={status} side={side} />}
    </div>
  );
}

const CUSTOMER_TEXT: Record<PaymentStatus, StringKey> = {
  UNPAID: "payCustomerUnpaid",
  TO_CONFIRM: "payCustomerToConfirm",
  DISPUTED: "payCustomerDisputed",
  RECEIVED: "payCustomerReceived",
};

/** On the customer's job: marking it done, and recording the payment. */
export function CustomerPaymentPanel({ job }: { job: Job }) {
  const queryClient = useQueryClient();
  const jobsKey = useJobsKey();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [open, setOpen] = useState(false);

  const save = useMutation({
    mutationFn: (path: "complete" | "payment") =>
      api<{ job: Job }>(`/jobs/${job.id}/${path}`, "POST", {
        paymentMethod: choice === "NOT_YET" ? undefined : (choice ?? undefined),
      }),
    onSuccess: ({ job: updated }) => {
      queryClient.setQueryData([...jobsKey, "job", job.id], updated);
      setOpen(false);
      setChoice(null);
    },
    // Also after a failure: the worker may have recorded the payment on their side.
    onSettled: () => queryClient.invalidateQueries({ queryKey: jobsKey }),
  });

  const status = paymentStatus(job);
  const hired = job.status === "ASSIGNED" || job.status === "IN_PROGRESS";
  if (!hired && !status) return null;

  const box = "space-y-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line/60 lg:p-6";

  if (hired) {
    const ready = canFinish(job);
    return (
      <section aria-labelledby="payment" className={box}>
        <PanelHeading id="payment" status={null} side="customer" />
        <ErrorBanner error={save.error} />
        {!ready && (
          <p className="text-sm text-muted">
            <Stacked k="payNotStarted" /> <span className="font-semibold text-ink">{formatDateTime(job.startsAt)}</span>
          </p>
        )}
        {ready && !open && (
          <>
            <Stacked k="payMarkDoneText" className="block text-sm text-muted" />
            <PrimaryButton k="payMarkDone" busy={false} onClick={() => setOpen(true)} />
          </>
        )}
        {ready && open && (
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (choice) save.mutate("complete");
            }}
          >
            <MethodPicker legend="payHowDidYouPay" value={choice} onChange={setChoice} allowNotYet />
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={save.isPending}
                className="min-h-12 rounded-xl bg-card text-sm font-bold ring-1 ring-line disabled:opacity-60"
              >
                <Stacked k="back" className="leading-tight" />
              </button>
              <PrimaryButton k="payConfirmDone" busy={save.isPending} disabled={!choice} />
            </div>
          </form>
        )}
      </section>
    );
  }

  const canRecord = status === "UNPAID" || status === "DISPUTED";
  return (
    <section aria-labelledby="payment" className={box}>
      <PanelHeading id="payment" status={status} side="customer" />
      <ErrorBanner error={save.error} />
      <PaymentRecord job={job} />
      <Stacked k={CUSTOMER_TEXT[status!]} className="block text-sm text-muted" />
      {canRecord && (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (choice) save.mutate("payment");
          }}
        >
          <MethodPicker legend="payHowDidYouPay" value={choice} onChange={setChoice} />
          <PrimaryButton k="payRecord" busy={save.isPending} disabled={!choice} />
        </form>
      )}
    </section>
  );
}

const WORKER_TEXT: Record<PaymentStatus, StringKey> = {
  UNPAID: "payWorkerUnpaid",
  TO_CONFIRM: "payWorkerToConfirm",
  DISPUTED: "payWorkerDisputed",
  RECEIVED: "payWorkerReceived",
};

/** On the hired worker's job: confirming the customer's payment, or recording one. */
export function WorkerPaymentPanel({ job }: { job: WorkerJob }) {
  const queryClient = useQueryClient();
  const workKey = useWorkKey();
  const [choice, setChoice] = useState<Choice | null>(null);

  const refresh = async (updated?: WorkerJob) => {
    if (updated) queryClient.setQueryData([...workKey, "job", job.id], updated);
    await queryClient.invalidateQueries({ queryKey: workKey });
  };
  const received = useMutation({
    mutationFn: (paymentMethod?: PaymentMethod) =>
      api<{ job: WorkerJob }>(`/work/jobs/${job.id}/payment/received`, "POST", { paymentMethod }),
    onSuccess: ({ job: updated }) => {
      setChoice(null);
      return refresh(updated);
    },
    onError: () => refresh(),
  });
  const notReceived = useMutation({
    mutationFn: () => api<{ job: WorkerJob }>(`/work/jobs/${job.id}/payment/not-received`, "POST"),
    onSuccess: ({ job: updated }) => refresh(updated),
    onError: () => refresh(),
  });

  const status = paymentStatus(job);
  const ready = canFinish(job);
  if (!status && !ready) return null;

  const busy = received.isPending || notReceived.isPending;
  const recordForm = (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (choice && choice !== "NOT_YET") received.mutate(choice);
      }}
    >
      <MethodPicker legend="payHowWereYouPaid" value={choice} onChange={setChoice} />
      <PrimaryButton k="payIWasPaid" busy={received.isPending} disabled={!choice} />
    </form>
  );

  return (
    <section aria-labelledby="payment" className="space-y-4 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-line/60 lg:p-6">
      <PanelHeading id="payment" status={status} side="worker" />
      <ErrorBanner error={received.error ?? notReceived.error} />
      {status && <PaymentRecord job={{ ...job, completedAt: job.completedAt ?? null }} />}
      <Stacked k={status ? WORKER_TEXT[status] : "payWorkerNotDone"} className="block text-sm text-muted" />

      {status === "TO_CONFIRM" && (
        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => notReceived.mutate()}
            disabled={busy}
            className="min-h-12 rounded-xl bg-card text-sm font-bold text-danger ring-1 ring-danger/30 hover:bg-danger-soft disabled:opacity-60"
          >
            <Stacked k="payNotReceived" className="leading-tight" />
          </button>
          <PrimaryButton k="payYesReceived" busy={received.isPending} disabled={busy} onClick={() => received.mutate(undefined)} />
        </div>
      )}
      {(status === null || status === "UNPAID" || status === "DISPUTED") && recordForm}
    </section>
  );
}
