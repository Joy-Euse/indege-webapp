import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import type { z } from "zod";
import { AuthLayout } from "../components/AuthLayout";
import { ErrorBanner, PhoneField, SubmitButton } from "../components/Form";
import { Dual, Stacked } from "../components/Text";
import { api } from "../lib/api";
import { normalizePhone } from "../lib/phone";
import { forgotSchema } from "../lib/validation";

type ForgotValues = z.infer<typeof forgotSchema>;

export function ForgotPassword() {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
  });

  const forgot = useMutation({
    mutationFn: async (values: ForgotValues) => {
      const phone = normalizePhone(values.phone);
      await api("/auth/password/forgot", "POST", { phone });
      return phone;
    },
    onSuccess: (phone) => navigate("/reset-password", { state: { phone } }),
  });

  return (
    <AuthLayout
      title="forgotTitle"
      intro={<Stacked k="forgotIntro" />}
      footer={<BackToLogin />}
    >
      <form onSubmit={handleSubmit((values) => forgot.mutate(values))} noValidate className="space-y-4">
        <ErrorBanner error={forgot.error} />
        <PhoneField error={errors.phone} autoFocus {...register("phone")} />
        <SubmitButton label="sendCode" busy={forgot.isPending} />
      </form>
    </AuthLayout>
  );
}

export function BackToLogin() {
  return (
    <p className="text-center text-sm">
      <Link to="/login" className="font-bold text-secondary-dark underline underline-offset-2 hover:text-ink">
        <Dual k="backToLogin" rwClassName="font-medium" />
      </Link>
    </p>
  );
}
