import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, CircleAlert } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { StringKey } from "../i18n/strings";
import {
  CATEGORY_LABELS,
  DISTRICTS,
  KIGALI_SECTORS,
  MAX_DESCRIPTION_LENGTH,
  MAX_DURATION_HOURS,
  MAX_WAGE_RWF,
  MIN_WAGE_RWF,
  OFFERED_CATEGORIES,
  toLocalInput,
} from "../lib/jobs";
import { jobSchema, type JobValues } from "../lib/validation";
import { ErrorBanner, SelectField, SubmitButton, TextAreaField, TextField } from "./Form";
import { CATEGORY_ICONS, CategoryIcon, JobSummary, PaymentNotice } from "./JobParts";
import { Dual, plain } from "./Text";

const STEP_TITLES: StringKey[] = ["stepCategory", "stepDetails", "stepConfirm"];
const DETAIL_FIELDS = ["description", "district", "sector", "landmark", "startsAt", "durationHours", "wageRwf"] as const;
const DURATIONS = Array.from({ length: MAX_DURATION_HOURS }, (_, index) => index + 1);

interface JobFormProps {
  initial?: Partial<JobValues>;
  submitLabel: StringKey;
  busy: boolean;
  error: unknown;
  onSubmit: (values: JobValues) => void;
}

/** The three steps for posting a job, also used to edit one. A chosen category skips the first step. */
export function JobForm({ initial, submitLabel, busy, error, onSubmit }: JobFormProps) {
  const [step, setStep] = useState(initial?.category ? 2 : 1);
  const { register, handleSubmit, trigger, watch, setValue, formState: { errors } } = useForm<JobValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: initial,
  });
  const values = watch();

  function goTo(next: number) {
    setStep(next);
    window.scrollTo(0, 0);
  }

  async function nextStep() {
    const valid = await trigger(step === 1 ? "category" : DETAIL_FIELDS);
    if (valid) goTo(step + 1);
  }

  // The start time can pass while someone reads the last step, so send them back to what needs fixing.
  const submit = handleSubmit(onSubmit, (invalid) => goTo(invalid.category ? 1 : 2));

  const sectors = values.district ? KIGALI_SECTORS[values.district] : [];

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void (step < 3 ? nextStep() : submit());
      }}
      className="space-y-4"
    >
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-secondary-dark">
          <Dual k="step" rwClassName="font-medium" /> {step} <Dual k="stepOf" rwClassName="font-medium" />
        </p>
        <h2 className="mt-1 text-lg font-extrabold">
          <Dual k={STEP_TITLES[step - 1]} />
        </h2>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-field">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / 3) * 100}%` }} />
        </div>
      </div>

      <ErrorBanner error={error} />

      {step === 1 && (
        <fieldset>
          <legend className="sr-only">{plain("stepCategory")}</legend>
          <div className="grid grid-cols-2 gap-2.5">
            {OFFERED_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category];
              return (
                <label
                  key={category}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl bg-white p-3 ring-1 ring-line transition has-checked:bg-primary-soft has-checked:ring-2 has-checked:ring-primary has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-secondary"
                >
                  <input type="radio" value={category} className="sr-only" {...register("category")} />
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 text-sm font-bold">
                    <Dual k={CATEGORY_LABELS[category]} />
                  </span>
                </label>
              );
            })}
          </div>
          {errors.category?.message && (
            <p role="alert" className="mt-2 flex items-start gap-1 text-xs font-medium text-danger">
              <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
              <span>
                <Dual k={errors.category.message as StringKey} rwClassName="font-normal" />
              </span>
            </p>
          )}
        </fieldset>
      )}

      {step === 2 && (
        <>
          {values.category && (
            <button
              type="button"
              onClick={() => goTo(1)}
              className="flex w-full items-center gap-3 rounded-xl bg-white p-3 text-left text-sm font-bold ring-1 ring-line hover:ring-primary/40"
            >
              <CategoryIcon category={values.category} />
              <span className="min-w-0 flex-1">
                <Dual k={CATEGORY_LABELS[values.category]} />
              </span>
              <span className="text-xs font-bold text-secondary-dark underline underline-offset-2">
                <Dual k="editJob" rwClassName="font-medium" />
              </span>
            </button>
          )}

          <TextAreaField
            label="jobDescription"
            maxLength={MAX_DESCRIPTION_LENGTH}
            error={errors.description}
            hint={`${values.description?.length ?? 0}/${MAX_DESCRIPTION_LENGTH}`}
            {...register("description")}
          />

          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="district"
              error={errors.district}
              {...register("district", { onChange: () => setValue("sector", "") })}
            >
              <option value="">{plain("chooseOption")}</option>
              {DISTRICTS.map((district) => (
                <option key={district} value={district}>{district}</option>
              ))}
            </SelectField>
            <SelectField label="sector" disabled={!values.district} error={errors.sector} {...register("sector")}>
              <option value="">{plain("chooseOption")}</option>
              {sectors.map((sector) => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </SelectField>
          </div>

          <TextField
            label="landmark"
            maxLength={120}
            error={errors.landmark}
            hint={<Dual k="landmarkHint" />}
            {...register("landmark")}
          />

          <TextField
            label="dateAndTime"
            type="datetime-local"
            min={toLocalInput(new Date())}
            error={errors.startsAt}
            {...register("startsAt")}
          />

          <SelectField
            label="duration"
            error={errors.durationHours}
            {...register("durationHours", { valueAsNumber: true })}
          >
            <option value="">{plain("chooseOption")}</option>
            {DURATIONS.map((hours) => (
              <option key={hours} value={hours}>{hours} {plain("hoursShort")}</option>
            ))}
          </SelectField>

          <TextField
            label="wage"
            type="number"
            inputMode="numeric"
            min={MIN_WAGE_RWF}
            max={MAX_WAGE_RWF}
            step={500}
            error={errors.wageRwf}
            hint={<Dual k="wageHint" />}
            {...register("wageRwf", { valueAsNumber: true })}
          />
        </>
      )}

      {step === 3 && (
        <>
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-line/60">
            <div className="mb-3 flex items-center gap-3 border-b border-line pb-3">
              <CategoryIcon category={values.category} />
              <h3 className="font-bold">
                <Dual k={CATEGORY_LABELS[values.category]} />
              </h3>
            </div>
            <JobSummary job={values} />
          </div>
          <PaymentNotice />
        </>
      )}

      <SubmitButton label={step < 3 ? "continue" : submitLabel} busy={busy} />

      {step > 1 && (
        <button
          type="button"
          onClick={() => goTo(step - 1)}
          className="flex min-h-11 w-full items-center justify-center gap-1.5 text-sm font-bold text-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          <Dual k="back" rwClassName="font-medium" />
        </button>
      )}
    </form>
  );
}
