import { useMutation, useQueryClient } from "@tanstack/react-query";
import { BriefcaseBusiness, HardHat } from "lucide-react";
import { type FormEvent, useState } from "react";
import { ErrorBanner, SuccessBanner } from "../../components/Form";
import { Dual, Stacked } from "../../components/Text";
import type { StringKey } from "../../i18n/strings";
import { type OwnProfile, useAccountKey } from "../../lib/account";
import { api } from "../../lib/api";
import { type MessagePermission, PERMISSION_OPTIONS, type Side } from "../../lib/messages";
import { SaveButton, SettingsCard } from "./SettingsLayout";

type Values = Pick<OwnProfile, "hiringMessagesFrom" | "workingMessagesFrom">;

/**
 * Who can message the person, with a separate choice for each side they use. A dual account
 * sees both; someone with one role sees only theirs, and only that one is sent.
 */
export function MessageSettings({ profile }: { profile: OwnProfile }) {
  const queryClient = useQueryClient();
  const accountKey = useAccountKey();
  const hires = profile.roles.includes("CUSTOMER");
  const works = profile.roles.includes("WORKER");
  const [values, setValues] = useState<Values>({
    hiringMessagesFrom: profile.hiringMessagesFrom,
    workingMessagesFrom: profile.workingMessagesFrom,
  });
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: async () => {
      const body: Partial<Values> = {};
      if (hires) body.hiringMessagesFrom = values.hiringMessagesFrom;
      if (works) body.workingMessagesFrom = values.workingMessagesFrom;
      return (await api<{ profile: OwnProfile }>("/me/messaging", "PUT", body)).profile;
    },
    onMutate: () => setSaved(false),
    onSuccess: (updated) => {
      queryClient.setQueryData([...accountKey, "profile"], updated);
      setSaved(true);
    },
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    save.mutate();
  }

  const choose = (field: keyof Values) => (value: MessagePermission) => {
    setSaved(false);
    setValues((current) => ({ ...current, [field]: value }));
  };

  return (
    <SettingsCard title="whoCanMessage" intro="whoCanMessageIntro">
      <form onSubmit={submit} className="space-y-6">
        {saved && <SuccessBanner k="messageSettingsSaved" />}
        <ErrorBanner error={save.error} />
        {hires && works && <Stacked k="sidesSeparate" className="block rounded-xl bg-tertiary-soft p-3 text-xs font-medium text-tertiary" />}
        {hires && (
          <PermissionChoice
            side="hiring"
            icon={BriefcaseBusiness}
            legend="whenHiring"
            value={values.hiringMessagesFrom}
            onChange={choose("hiringMessagesFrom")}
          />
        )}
        {works && (
          <PermissionChoice
            side="working"
            icon={HardHat}
            legend="whenWorking"
            value={values.workingMessagesFrom}
            onChange={choose("workingMessagesFrom")}
          />
        )}
        <div className="flex justify-end">
          <SaveButton label="saveChanges" busy={save.isPending} />
        </div>
      </form>
    </SettingsCard>
  );
}

interface PermissionChoiceProps {
  side: Side;
  icon: typeof BriefcaseBusiness;
  legend: StringKey;
  value: MessagePermission;
  onChange: (value: MessagePermission) => void;
}

function PermissionChoice({ side, icon: Icon, legend, value, onChange }: PermissionChoiceProps) {
  return (
    <fieldset>
      <legend className="mb-2 flex items-center gap-2 text-sm font-bold">
        <Icon className="size-4.5 text-primary" aria-hidden="true" />
        <span>
          <Dual k={legend} />
        </span>
      </legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {PERMISSION_OPTIONS[side].map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={`relative flex cursor-pointer flex-col gap-1 rounded-xl p-3 ring-1 transition has-focus-visible:outline-3 has-focus-visible:outline-secondary ${checked ? "bg-primary-soft ring-2 ring-primary" : "bg-card ring-line hover:ring-primary/40"}`}
            >
              <input
                type="radio"
                name={`messages-${side}`}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              <Stacked k={option.label} className={`text-sm font-bold leading-tight ${checked ? "text-primary" : ""}`} />
              <Stacked k={option.text} className="text-xs text-muted" />
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
