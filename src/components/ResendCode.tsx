import { useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { ErrorBanner, SuccessBanner } from "./Form";
import { Dual, Stacked } from "./Text";

const COOLDOWN_SECONDS = 60;

/** A code was just sent when this appears, so it starts on cooldown. */
export function ResendCode({ phone, purpose }: { phone: string; purpose: "register" | "reset" }) {
  const [secondsLeft, setSecondsLeft] = useState(COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const resend = useMutation({
    mutationFn: () => api("/auth/otp/resend", "POST", { phone, purpose }),
    onSuccess: () => setSecondsLeft(COOLDOWN_SECONDS),
    onError: (error) => {
      if (error instanceof ApiError && error.retryAfter) setSecondsLeft(error.retryAfter);
    },
  });

  return (
    <div className="space-y-3 text-center text-sm" aria-live="polite">
      {resend.isSuccess && <SuccessBanner k="codeResent" />}
      {resend.isError && <ErrorBanner error={resend.error} />}
      <Stacked k="noCode" className="text-muted" />
      {secondsLeft > 0 ? (
        <p className="font-semibold text-muted">
          <Dual k="resendIn" /> {formatTime(secondsLeft)}
        </p>
      ) : (
        <button
          type="button"
          disabled={resend.isPending}
          onClick={() => resend.mutate()}
          className="min-h-11 rounded-lg px-3 font-bold text-secondary-dark underline underline-offset-2 hover:text-ink disabled:opacity-60"
        >
          <Dual k="resend" rwClassName="font-medium" />
        </button>
      )}
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}
