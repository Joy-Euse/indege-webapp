import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import type { z } from "zod";
import { AuthLayout } from "../components/AuthLayout";
import { CodeField, ErrorBanner, PasswordField, SubmitButton } from "../components/Form";
import { ResendCode } from "../components/ResendCode";
import { Dual, Stacked } from "../components/Text";
import { api } from "../lib/api";
import { formatPhone } from "../lib/phone";
import { resetSchema } from "../lib/validation";
import { BackToLogin } from "./ForgotPassword";

type ResetValues = z.infer<typeof resetSchema>;

export function ResetPassword() {
  const navigate = useNavigate();
  const phone = (useLocation().state as { phone?: string } | null)?.phone;

  const { register, handleSubmit, formState: { errors } } = useForm<ResetValues>({
    resolver: zodResolver(resetSchema),
  });

  const reset = useMutation({
    mutationFn: (values: ResetValues) => api<void>("/auth/password/reset", "POST", { phone, ...values }),
    onSuccess: () => navigate("/login", { replace: true, state: { passwordChanged: true } }),
  });

  if (!phone) return <Navigate to="/forgot-password" replace />;

  return (
    <AuthLayout
      title="resetTitle"
      intro={
        <>
          <Stacked k="codeSentTo" />
          <strong className="mt-1 block font-display text-base text-ink">{formatPhone(phone)}</strong>
        </>
      }
      footer={<BackToLogin />}
    >
      <form onSubmit={handleSubmit((values) => reset.mutate(values))} noValidate className="space-y-4">
        <ErrorBanner error={reset.error} />
        <CodeField error={errors.code} autoFocus {...register("code")} />
        <PasswordField
          label="newPassword"
          autoComplete="new-password"
          hint={<Dual k="newPasswordHint" />}
          error={errors.newPassword}
          {...register("newPassword")}
        />
        <SubmitButton label="savePassword" busy={reset.isPending} />
        <ResendCode phone={phone} purpose="reset" />
      </form>
    </AuthLayout>
  );
}
