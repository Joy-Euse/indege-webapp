import { ArrowRight, CircleAlert, CircleCheck, Eye, EyeOff, Info, Lock } from "lucide-react";
import { forwardRef, type InputHTMLAttributes, type ReactNode, useId, useState } from "react";
import type { FieldError as HookFormError } from "react-hook-form";
import { type StringKey, strings } from "../i18n/strings";
import { ApiError } from "../lib/api";
import { Dual, plain, Stacked } from "./Text";

const inputBox =
  "flex items-center overflow-hidden rounded-xl bg-field ring-1 ring-transparent transition focus-within:bg-white focus-within:ring-2 focus-within:ring-primary";
const inputError = "ring-2! ring-danger!";
const inputText = "min-w-0 flex-1 bg-transparent py-3.5 text-base outline-none placeholder:text-gray-400";

interface FieldShellProps {
  id: string;
  label: StringKey;
  labelAside?: ReactNode;
  hint?: ReactNode;
  error?: HookFormError;
  children: ReactNode;
}

function FieldShell({ id, label, labelAside, hint, error, children }: FieldShellProps) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold">
          <Dual k={label} />
        </label>
        {labelAside}
      </div>
      {children}
      {error?.message ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 flex items-start gap-1 text-xs font-medium text-danger">
          <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
          <span>
            <Dual k={error.message as StringKey} rwClassName="font-normal" />
          </span>
        </p>
      ) : (
        hint && (
          <p className="mt-1.5 flex items-start gap-1 text-xs text-muted">
            <Info className="mt-px size-3.5 shrink-0" aria-hidden="true" />
            <span>{hint}</span>
          </p>
        )
      )}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: StringKey;
  error?: HookFormError;
  hint?: ReactNode;
  labelAside?: ReactNode;
};

export const TextField = forwardRef<HTMLInputElement, InputProps>(function TextField(
  { label, error, hint, labelAside, ...input },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} labelAside={labelAside}>
      <div className={`${inputBox} ${error ? inputError : ""} px-3.5`}>
        <input
          ref={ref}
          id={id}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputText}
          {...input}
        />
      </div>
    </FieldShell>
  );
});

export const PhoneField = forwardRef<HTMLInputElement, Omit<InputProps, "label">>(function PhoneField(
  { error, hint, ...input },
  ref,
) {
  const id = useId();
  return (
    <FieldShell
      id={id}
      label="phone"
      error={error}
      hint={hint ?? <Dual k="phoneHint" />}
      labelAside={
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-tertiary-soft px-2 py-0.5 text-[10px] font-bold text-tertiary">
          <span className="size-1.5 rounded-full bg-secondary" aria-hidden="true" />
          MTN · Airtel
        </span>
      }
    >
      <div className={`${inputBox} ${error ? inputError : ""}`}>
        <span className="flex items-center gap-1.5 self-stretch border-r border-line bg-tertiary-soft px-3 text-sm font-bold">
          <RwandaFlag />
          +250
        </span>
        <input
          ref={ref}
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder="78X XXX XXX"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputText} px-3 font-medium tracking-wide`}
          {...input}
        />
      </div>
    </FieldShell>
  );
});

export const PasswordField = forwardRef<HTMLInputElement, InputProps>(function PasswordField(
  { label, error, hint, labelAside, ...input },
  ref,
) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={id} label={label} error={error} hint={hint} labelAside={labelAside}>
      <div className={`${inputBox} ${error ? inputError : ""} pl-3.5`}>
        <Lock className="mr-2.5 size-4 shrink-0 text-muted" aria-hidden="true" />
        <input
          ref={ref}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={inputText}
          {...input}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={plain(visible ? "hidePassword" : "showPassword")}
          aria-pressed={visible}
          className="grid size-12 shrink-0 place-items-center text-muted hover:text-ink"
        >
          {visible ? <EyeOff className="size-5" aria-hidden="true" /> : <Eye className="size-5" aria-hidden="true" />}
        </button>
      </div>
    </FieldShell>
  );
});

export const CodeField = forwardRef<HTMLInputElement, Omit<InputProps, "label">>(function CodeField(
  { error, ...input },
  ref,
) {
  const id = useId();
  return (
    <FieldShell id={id} label="code" error={error}>
      <div className={`${inputBox} ${error ? inputError : ""} px-3.5`}>
        <input
          ref={ref}
          id={id}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          placeholder="••••••"
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`${inputText} text-center font-display text-2xl font-bold tracking-[0.5em]`}
          {...input}
        />
      </div>
    </FieldShell>
  );
});

function RwandaFlag() {
  return (
    <svg viewBox="0 0 24 16" width="20" height="14" className="rounded-[2px]" aria-hidden="true">
      <rect width="24" height="8" fill="#00A1DE" />
      <rect y="8" width="24" height="4" fill="#FAD201" />
      <rect y="12" width="24" height="4" fill="#20603D" />
      <circle cx="19" cy="4" r="2" fill="#FAD201" />
    </svg>
  );
}

export function SubmitButton({ label, busy }: { label: StringKey; busy: boolean }) {
  return (
    <button
      type="submit"
      disabled={busy}
      aria-busy={busy}
      className="flex min-h-13 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 font-display text-base font-extrabold text-ink shadow-sm transition hover:bg-[#e58a1f] disabled:opacity-60"
    >
      {busy ? (
        <span className="size-5 animate-spin rounded-full border-[3px] border-ink/25 border-t-ink" role="status" aria-label="Loading" />
      ) : (
        <>
          <span>
            <span lang="en">{strings[label].en}</span> / <span lang="rw">{strings[label].rw}</span>
          </span>
          <ArrowRight className="size-5" aria-hidden="true" />
        </>
      )}
    </button>
  );
}

export function errorKeyFor(error: unknown): StringKey {
  if (!(error instanceof ApiError)) return "networkError";
  return error.code in strings ? (error.code as StringKey) : "genericError";
}

export function ErrorBanner({ error }: { error: unknown }) {
  if (!error) return null;
  const minutes =
    error instanceof ApiError && error.retryAfter ? Math.ceil(error.retryAfter / 60) : null;
  return (
    <div role="alert" className="flex items-start gap-2 rounded-xl bg-danger-soft p-3 text-sm text-danger">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <div>
        <Stacked k={errorKeyFor(error)} className="font-medium" />
        {minutes !== null && (
          <span className="mt-1 block text-xs font-semibold">
            {minutes} min
          </span>
        )}
      </div>
    </div>
  );
}

export function SuccessBanner({ k }: { k: StringKey }) {
  return (
    <div role="status" className="flex items-start gap-2 rounded-xl bg-primary-soft p-3 text-sm text-primary">
      <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <Stacked k={k} className="font-medium" />
    </div>
  );
}
