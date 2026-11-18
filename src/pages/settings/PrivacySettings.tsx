import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, Globe, Lock, Mail, MapPin, Phone, Users } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ErrorBanner, SuccessBanner } from "../../components/Form";
import { LoadError, Loading } from "../../components/JobParts";
import { Avatar } from "../../components/ProfileMenu";
import { Dual, Stacked } from "../../components/Text";
import type { StringKey } from "../../i18n/strings";
import {
  type OwnProfile,
  useAccountKey,
  useOwnProfile,
  usePublicPreview,
  VISIBILITY_OPTIONS,
  type Visibility,
} from "../../lib/account";
import { api } from "../../lib/api";
import { formatPhone } from "../../lib/phone";
import { SaveButton, SettingsCard } from "./SettingsLayout";

type PrivacyValues = Pick<OwnProfile, "phoneVisibility" | "emailVisibility" | "locationVisibility">;

const OPTION_ICONS: Record<Visibility, typeof Lock> = { PRIVATE: Lock, CONNECTIONS: Users, PUBLIC: Globe };

export function PrivacySettings() {
  const profile = useOwnProfile();
  if (profile.isPending) return <Loading />;
  if (profile.isError) return <LoadError error={profile.error} onRetry={() => void profile.refetch()} />;
  return <PrivacyForm profile={profile.data} />;
}

function PrivacyForm({ profile }: { profile: OwnProfile }) {
  const queryClient = useQueryClient();
  const accountKey = useAccountKey();
  const [values, setValues] = useState<PrivacyValues>({
    phoneVisibility: profile.phoneVisibility,
    emailVisibility: profile.emailVisibility,
    locationVisibility: profile.locationVisibility,
  });
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: async () => (await api<{ profile: OwnProfile }>("/me/privacy", "PUT", values)).profile,
    onMutate: () => setSaved(false),
    onSuccess: async (updated) => {
      queryClient.setQueryData([...accountKey, "profile"], updated);
      await queryClient.invalidateQueries({ queryKey: [...accountKey, "public-preview"] });
      setSaved(true);
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  const choose = (field: keyof PrivacyValues) => (value: Visibility) => {
    setSaved(false);
    setValues((current) => ({ ...current, [field]: value }));
  };

  return (
    <>
      <SettingsCard title="tabPrivacy" intro="privacyIntro">
        <form onSubmit={submit} className="space-y-6">
          {saved && <SuccessBanner k="privacySaved" />}
          <ErrorBanner error={save.error} />
          <VisibilityChoice
            name="phone"
            icon={Phone}
            legend="whoSeesPhone"
            value={values.phoneVisibility}
            onChange={choose("phoneVisibility")}
          />
          <VisibilityChoice
            name="email"
            icon={Mail}
            legend="whoSeesEmail"
            value={values.emailVisibility}
            onChange={choose("emailVisibility")}
            note={profile.email ? undefined : "noEmailYet"}
          />
          <VisibilityChoice
            name="location"
            icon={MapPin}
            legend="whoSeesLocation"
            value={values.locationVisibility}
            onChange={choose("locationVisibility")}
          />
          <div className="flex justify-end">
            <SaveButton label="saveChanges" busy={save.isPending} />
          </div>
        </form>
      </SettingsCard>
      <PublicPreview />
    </>
  );
}

interface VisibilityChoiceProps {
  name: string;
  icon: typeof Lock;
  legend: StringKey;
  value: Visibility;
  onChange: (value: Visibility) => void;
  note?: StringKey;
}

function VisibilityChoice({ name, icon: Icon, legend, value, onChange, note }: VisibilityChoiceProps) {
  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-2 text-sm font-bold">
        <Icon className="size-4.5 text-primary" aria-hidden="true" />
        <span>
          <Dual k={legend} />
        </span>
      </legend>
      {note && <Stacked k={note} className="mb-2 block text-xs text-muted" />}
      <div className="grid gap-2 sm:grid-cols-3">
        {VISIBILITY_OPTIONS.map((option) => {
          const OptionIcon = OPTION_ICONS[option.value];
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`relative flex cursor-pointer flex-col gap-1 rounded-xl p-3 ring-1 transition has-focus-visible:outline-3 has-focus-visible:outline-secondary ${checked ? "bg-primary-soft ring-2 ring-primary" : "bg-white ring-line hover:ring-primary/40"}`}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <span className={`flex items-start gap-2 text-sm font-bold ${checked ? "text-primary" : ""}`}>
                <OptionIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                <Stacked k={option.label} className="leading-tight" />
              </span>
              <Stacked k={option.text} className="text-xs text-muted" />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function PublicPreview() {
  const preview = usePublicPreview();
  return (
    <SettingsCard title="publicPreview">
      {preview.isPending && <Loading />}
      {preview.isError && <LoadError error={preview.error} onRetry={() => void preview.refetch()} />}
      {preview.isSuccess && (
        <div className="rounded-xl bg-surface p-4">
          <div className="flex items-center gap-3">
            <Avatar name={preview.data.fullName} />
            <div className="min-w-0">
              <p className="truncate font-bold">{preview.data.fullName}</p>
              <p className="flex items-center gap-1 text-xs text-muted">
                <Eye className="size-3.5" aria-hidden="true" />
                <Dual k="visPublic" rwClassName="" />
              </p>
            </div>
          </div>
          {preview.data.bio && <p className="mt-3 text-sm">{preview.data.bio}</p>}
          <ul className="mt-3 space-y-1.5 text-sm text-muted">
            {preview.data.district && (
              <li className="flex items-center gap-2">
                <MapPin className="size-4" aria-hidden="true" />
                {[preview.data.sector, preview.data.district].filter(Boolean).join(", ")}
              </li>
            )}
            {preview.data.phone && (
              <li className="flex items-center gap-2">
                <Phone className="size-4" aria-hidden="true" />
                {formatPhone(preview.data.phone)}
              </li>
            )}
            {preview.data.email && (
              <li className="flex items-center gap-2">
                <Mail className="size-4" aria-hidden="true" />
                {preview.data.email}
              </li>
            )}
          </ul>
        </div>
      )}
    </SettingsCard>
  );
}
