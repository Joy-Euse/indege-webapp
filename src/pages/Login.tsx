import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { ChevronRight, UserPlus, Zap } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useLocation } from "react-router-dom";
import type { z } from "zod";
import { useAuth } from "../auth/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { ErrorBanner, PasswordField, PhoneField, SubmitButton, SuccessBanner } from "../components/Form";
import { Dual, Stacked } from "../components/Text";
import { api, type Session } from "../lib/api";
import { normalizePhone } from "../lib/phone";
import { loginSchema } from "../lib/validation";

type LoginValues = z.infer<typeof loginSchema>;

export function Login() {
  const { startSession } = useAuth();
  const location = useLocation();
  const passwordChanged = (location.state as { passwordChanged?: boolean } | null)?.passwordChanged;

  const { register, handleSubmit, formState: { errors } } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const login = useMutation({
    mutationFn: (values: LoginValues) =>
      api<Session>("/auth/login", "POST", { ...values, phone: normalizePhone(values.phone) }),
    onSuccess: startSession,
  });

  return (
    <AuthLayout
      title="welcomeBack"
      intro={<Stacked k="loginIntro" />}
      footer={
        <>
          <div className="my-4 flex items-center gap-3 text-xs font-bold text-muted">
            <span className="h-px flex-1 bg-line" />
            <span>
              <Dual k="or" />
            </span>
            <span className="h-px flex-1 bg-line" />
          </div>
          <Link
            to="/register"
            className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-line/60 transition hover:ring-primary"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary-soft text-secondary-dark">
              <UserPlus className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1 text-sm">
              <span className="block font-bold">
                <Dual k="noAccount" />
              </span>
              <span className="block text-xs text-muted">
                <Dual k="signUpAction" rwClassName="text-muted" />
              </span>
            </span>
            <ChevronRight className="size-5 shrink-0 text-muted" aria-hidden="true" />
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit((values) => login.mutate(values))} noValidate className="space-y-4">
        {passwordChanged && !login.isError && <SuccessBanner k="passwordChanged" />}
        <ErrorBanner error={login.error} />

        <PhoneField error={errors.phone} {...register("phone")} />
        <PasswordField
          label="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password}
          labelAside={
            <Link to="/forgot-password" className="shrink-0 text-xs font-bold text-secondary-dark underline underline-offset-2 hover:text-ink">
              <Dual k="forgotPassword" rwClassName="font-medium" />
            </Link>
          }
          {...register("password")}
        />

        <p className="flex items-start gap-2 rounded-xl bg-tertiary-soft p-3 text-xs text-ink">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Zap className="size-3.5" aria-hidden="true" />
          </span>
          <Stacked k="loginRouting" />
        </p>

        <SubmitButton label="logIn" busy={login.isPending} />
      </form>
    </AuthLayout>
  );
}
