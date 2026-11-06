import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { BriefcaseBusiness, CircleAlert, type LucideIcon, Search, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import type { z } from "zod";
import { AuthLayout } from "../components/AuthLayout";
import { ErrorBanner, PasswordField, PhoneField, SubmitButton, TextField } from "../components/Form";
import { Dual, Stacked } from "../components/Text";
import type { StringKey } from "../i18n/strings";
import { api } from "../lib/api";
import { normalizePhone } from "../lib/phone";
import { registerSchema } from "../lib/validation";

type RegisterValues = z.infer<typeof registerSchema>;

const ROLE_OPTIONS: { value: RegisterValues["role"]; icon: LucideIcon; title: StringKey; text: StringKey }[] = [
  { value: "CUSTOMER", icon: Search, title: "roleCustomer", text: "roleCustomerText" },
  { value: "WORKER", icon: BriefcaseBusiness, title: "roleWorker", text: "roleWorkerText" },
  { value: "BOTH", icon: Users, title: "roleBoth", text: "roleBothText" },
];

export function Register() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
  });

  const signUp = useMutation({
    mutationFn: async (values: RegisterValues) => {
      const phone = normalizePhone(values.phone);
      await api("/auth/register", "POST", { ...values, phone });
      return phone;
    },
    onSuccess: (phone) => navigate("/verify", { state: { phone } }),
  });

  return (
    <AuthLayout
      title="createAccount"
      intro={<Stacked k="registerIntro" />}
      footer={
        <p className="text-center text-sm text-muted">
          <Dual k="haveAccount" />{" "}
          <Link to="/login" className="font-bold text-secondary-dark underline underline-offset-2 hover:text-ink">
            <Dual k="logIn" rwClassName="font-medium" />
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit((values) => signUp.mutate(values))} noValidate className="space-y-4">
        <ErrorBanner error={signUp.error} />

        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">
            <Dual k="chooseRole" />
          </legend>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_OPTIONS.map(({ value, icon: Icon, title, text }) => (
              <label
                key={value}
                className="flex cursor-pointer flex-col items-center gap-1 rounded-xl bg-field p-2.5 text-center ring-1 ring-transparent transition has-checked:bg-primary-soft has-checked:ring-2 has-checked:ring-primary has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-secondary"
              >
                <input type="radio" value={value} className="sr-only" {...register("role")} />
                <Icon className="size-5 text-primary" aria-hidden="true" />
                <span className="text-xs font-bold">
                  <Stacked k={title} />
                </span>
                <Stacked k={text} className="text-[11px] leading-tight text-muted" />
              </label>
            ))}
          </div>
          <FieldMessage message={errors.role?.message} />
        </fieldset>

        <TextField
          label="fullName"
          autoComplete="name"
          placeholder="Aline Uwera"
          error={errors.fullName}
          {...register("fullName")}
        />
        <PhoneField error={errors.phone} {...register("phone")} />
        <PasswordField
          label="password"
          autoComplete="new-password"
          hint={<Dual k="newPasswordHint" />}
          error={errors.password}
          {...register("password")}
        />

        <div>
          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-primary" {...register("acceptTerms")} />
            <span>
              <span lang="en">
                I accept the <LegalLink to="/terms">Terms</LegalLink> and <LegalLink to="/privacy">Privacy Policy</LegalLink>
              </span>
              <span lang="rw" className="block text-xs text-muted">
                Nemeye <LegalLink to="/terms">Amategeko</LegalLink> na <LegalLink to="/privacy">Politiki y'ibanga</LegalLink>
              </span>
            </span>
          </label>
          <FieldMessage message={errors.acceptTerms?.message} />
        </div>

        <SubmitButton label="continue" busy={signUp.isPending} />
      </form>
    </AuthLayout>
  );
}

function LegalLink({ to, children }: { to: string; children: string }) {
  return (
    <Link to={to} target="_blank" className="font-semibold text-secondary-dark underline underline-offset-2">
      {children}
    </Link>
  );
}

function FieldMessage({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 flex items-start gap-1 text-xs font-medium text-danger">
      <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden="true" />
      <span>
        <Dual k={message as StringKey} rwClassName="font-normal" />
      </span>
    </p>
  );
}
