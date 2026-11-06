import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation } from "react-router-dom";
import type { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { CodeField, ErrorBanner, SubmitButton } from "../components/Form";
import { ResendCode } from "../components/ResendCode";
import { Dual, Stacked } from "../components/Text";
import { api, type Session } from "../lib/api";
import { formatPhone } from "../lib/phone";
import { verifySchema } from "../lib/validation";

type VerifyValues = z.infer<typeof verifySchema>;

export function VerifyPhone() {
  const { startSession } = useAuth();
  const phone = (useLocation().state as { phone?: string } | null)?.phone;

  const { register, handleSubmit, formState: { errors } } = useForm<VerifyValues>({
    resolver: zodResolver(verifySchema),
  });

  const verify = useMutation({
    mutationFn: ({ code }: VerifyValues) => api<Session>("/auth/register/verify", "POST", { phone, code }),
    onSuccess: startSession,
  });

  if (!phone) return <Navigate to="/register" replace />;

  return (
    <AuthLayout
      title="verifyTitle"
      intro={
        <>
          <Stacked k="codeSentTo" />
          <strong className="mt-1 block font-display text-base text-ink">{formatPhone(phone)}</strong>
        </>
      }
      footer={
        <p className="text-center text-sm">
          <Link to="/register" className="font-bold text-secondary-dark underline underline-offset-2 hover:text-ink">
            <Dual k="changeNumber" rwClassName="font-medium" />
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit((values) => verify.mutate(values))} noValidate className="space-y-4">
        <ErrorBanner error={verify.error} />
        <CodeField error={errors.code} autoFocus {...register("code")} />
        <SubmitButton label="verify" busy={verify.isPending} />
        <ResendCode phone={phone} purpose="register" />
      </form>
    </AuthLayout>
  );
}
