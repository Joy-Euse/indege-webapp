import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Mail, Phone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "../../auth/AuthContext";
import { CodeField, ErrorBanner, SelectField, SuccessBanner, TextAreaField, TextField } from "../../components/Form";
import { LoadError, Loading } from "../../components/JobParts";
import { Avatar } from "../../components/ProfileMenu";
import { Dual, plain, Stacked } from "../../components/Text";
import type { StringKey } from "../../i18n/strings";
import { type OwnProfile, useAccountKey, useOwnProfile } from "../../lib/account";
import { api } from "../../lib/api";
import { DISTRICTS, formatMonthYear, KIGALI_SECTORS } from "../../lib/jobs";
import { formatPhone } from "../../lib/phone";
import { codeField, emailSchema, profileSchema, type ProfileValues } from "../../lib/validation";
import { z } from "zod";
import { SaveButton, SettingsCard } from "./SettingsLayout";

/** Saves a changed profile into the cache, and refreshes the "what others see" preview. */
function useProfileSaver() {
  const queryClient = useQueryClient();
  const accountKey = useAccountKey();
  return async (profile: OwnProfile) => {
    queryClient.setQueryData([...accountKey, "profile"], profile);
    await queryClient.invalidateQueries({ queryKey: [...accountKey, "public-preview"] });
  };
}

export function ProfileSettings() {
  const profile = useOwnProfile();

  if (profile.isPending) return <Loading />;
  if (profile.isError) return <LoadError error={profile.error} onRetry={() => void profile.refetch()} />;

  return (
    <>
      <div className="flex items-center gap-4">
        <Avatar name={profile.data.fullName} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-display text-xl font-extrabold">{profile.data.fullName}</p>
          <p className="text-sm text-muted">
            <Dual k="memberSince" rwClassName="" />{" "}
            {formatMonthYear(profile.data.memberSince)}
          </p>
        </div>
      </div>
      <DetailsCard profile={profile.data} />
      <PhoneCard phone={profile.data.phone} />
      <EmailCard profile={profile.data} />
    </>
  );
}

function DetailsCard({ profile }: { profile: OwnProfile }) {
  const { updateUser } = useAuth();
  const saveProfile = useProfileSaver();
  const [saved, setSaved] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: profile.fullName,
      bio: profile.bio ?? "",
      district: (profile.district as ProfileValues["district"]) ?? "",
      sector: profile.sector ?? "",
    },
  });
  const district = watch("district");
  const bioLength = watch("bio")?.length ?? 0;

  const save = useMutation({
    mutationFn: async (values: ProfileValues) =>
      (
        await api<{ profile: OwnProfile }>("/me/profile", "PUT", {
          fullName: values.fullName,
          bio: values.bio,
          district: values.district || null,
          sector: values.sector || null,
        })
      ).profile,
    onMutate: () => setSaved(false),
    onSuccess: async (updated) => {
      updateUser({ fullName: updated.fullName });
      await saveProfile(updated);
      setSaved(true);
    },
  });

  return (
    <SettingsCard title="yourDetails">
      <form noValidate onSubmit={handleSubmit((values) => save.mutate(values))} className="space-y-4">
        {saved && <SuccessBanner k="profileSaved" />}
        <ErrorBanner error={save.error} />
        <TextField label="fullName" autoComplete="name" error={errors.fullName} {...register("fullName")} />
        <TextAreaField
          label="bio"
          rows={3}
          maxLength={300}
          error={errors.bio}
          hint={
            <>
              <Dual k="bioHint" rwClassName="" /> ({bioLength}/300)
            </>
          }
          {...register("bio")}
        />
        <fieldset>
          <legend className="mb-1.5 text-sm font-semibold">
            <Dual k="homeArea" />
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="district"
              error={errors.district}
              {...register("district", { onChange: () => setValue("sector", "") })}
            >
              <option value="">— {plain("notSet")}</option>
              {DISTRICTS.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </SelectField>
            <SelectField label="sector" disabled={!district} error={errors.sector} {...register("sector")}>
              <option value="">—</option>
              {district &&
                KIGALI_SECTORS[district].map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
            </SelectField>
          </div>
          <Stacked k="homeAreaHint" className="mt-1.5 block text-xs text-muted" />
        </fieldset>
        <div className="flex justify-end">
          <SaveButton label="saveChanges" busy={save.isPending} />
        </div>
      </form>
    </SettingsCard>
  );
}

function ConfirmedBadge() {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-bold text-primary">
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      <Dual k="confirmed" rwClassName="font-medium" />
    </span>
  );
}

function PhoneCard({ phone }: { phone: string }) {
  return (
    <SettingsCard title="phone" intro="phoneIsLogin">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-4">
        <span className="flex items-center gap-2.5 font-semibold">
          <Phone className="size-4.5 text-muted" aria-hidden="true" />
          {formatPhone(phone)}
        </span>
        <ConfirmedBadge />
      </div>
    </SettingsCard>
  );
}

type EmailValues = z.infer<typeof emailSchema>;
const codeSchema = z.object({ code: codeField });

function EmailCard({ profile }: { profile: OwnProfile }) {
  const saveProfile = useProfileSaver();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState<StringKey | null>(null);

  const emailForm = useForm<EmailValues>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const codeForm = useForm<{ code: string }>({ resolver: zodResolver(codeSchema), defaultValues: { code: "" } });

  const request = useMutation({
    mutationFn: (email: string) => api<void>("/me/email", "POST", { email }),
    onMutate: () => setNotice(null),
    onSuccess: async (_, email) => {
      // The address is not saved yet: it waits for its code.
      await saveProfile({ ...profile, pendingEmail: email });
      setEditing(false);
      codeForm.reset();
    },
  });
  const confirm = useMutation({
    mutationFn: async (code: string) => (await api<{ profile: OwnProfile }>("/me/email/verify", "POST", { code })).profile,
    onSuccess: async (updated) => {
      await saveProfile(updated);
      setNotice("emailConfirmed");
    },
  });
  const remove = useMutation({
    mutationFn: async () => (await api<{ profile: OwnProfile }>("/me/email/remove", "POST", {})).profile,
    onMutate: () => setNotice(null),
    onSuccess: saveProfile,
  });
  const error = request.error ?? confirm.error ?? remove.error;

  const showEntry = editing || (!profile.email && !profile.pendingEmail);

  return (
    <SettingsCard title="email" intro="emailIntro">
      <div className="space-y-4">
        {notice && <SuccessBanner k={notice} />}
        <ErrorBanner error={error} />

        {profile.email && !editing && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface p-4">
            <span className="flex min-w-0 items-center gap-2.5 font-semibold">
              <Mail className="size-4.5 shrink-0 text-muted" aria-hidden="true" />
              <span className="truncate">{profile.email}</span>
            </span>
            <ConfirmedBadge />
          </div>
        )}

        {profile.pendingEmail && !editing && (
          <form
            noValidate
            onSubmit={codeForm.handleSubmit((values) => confirm.mutate(values.code))}
            className="space-y-4 rounded-xl bg-tertiary-soft/60 p-4"
          >
            <p className="text-sm">
              <Dual k="emailCodeSent" rwClassName="text-muted" /> <strong className="break-all">{profile.pendingEmail}</strong>
            </p>
            <CodeField error={codeForm.formState.errors.code} {...codeForm.register("code")} />
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => request.mutate(profile.pendingEmail!)}
                disabled={request.isPending}
                className="min-h-11 rounded-xl px-4 text-sm font-bold text-primary hover:bg-card disabled:opacity-60"
              >
                <Dual k="resend" rwClassName="font-medium text-primary/70" />
              </button>
              <SaveButton label="verify" busy={confirm.isPending} />
            </div>
          </form>
        )}

        {showEntry ? (
          <form
            noValidate
            onSubmit={emailForm.handleSubmit((values) => request.mutate(values.email))}
            className="space-y-4"
          >
            <TextField
              label="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="name@example.com"
              error={emailForm.formState.errors.email}
              {...emailForm.register("email")}
            />
            <div className="flex flex-wrap justify-end gap-2">
              {editing && (
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="min-h-11 rounded-xl px-4 text-sm font-bold text-muted hover:bg-surface"
                >
                  <Dual k="cancel" rwClassName="font-medium" />
                </button>
              )}
              <SaveButton label="sendCode" busy={request.isPending} />
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap justify-end gap-2">
            {profile.email && (
              <button
                type="button"
                onClick={() => remove.mutate()}
                disabled={remove.isPending}
                className="min-h-11 rounded-xl px-4 text-sm font-bold text-danger hover:bg-danger-soft disabled:opacity-60"
              >
                <Dual k="removeEmail" rwClassName="font-medium text-danger/70" />
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                emailForm.reset({ email: "" });
                setNotice(null);
                setEditing(true);
              }}
              className="min-h-11 rounded-xl px-4 text-sm font-bold text-primary ring-1 ring-primary/30 hover:bg-primary-soft"
            >
              <Dual k={profile.pendingEmail ? "useOtherEmail" : "changeEmail"} rwClassName="font-medium text-primary/70" />
            </button>
          </div>
        )}
      </div>
    </SettingsCard>
  );
}
