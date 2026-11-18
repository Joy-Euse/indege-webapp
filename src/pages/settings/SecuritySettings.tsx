import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Laptop, Smartphone } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../../auth/AuthContext";
import { ErrorBanner, PasswordField, SuccessBanner } from "../../components/Form";
import { LoadError, Loading } from "../../components/JobParts";
import { Dual, Stacked } from "../../components/Text";
import { describeDevice, type DeviceSession, useAccountKey, useSessions } from "../../lib/account";
import { api } from "../../lib/api";
import { formatDateTime } from "../../lib/jobs";
import { changePasswordSchema, deleteAccountSchema } from "../../lib/validation";
import { SaveButton, SettingsCard } from "./SettingsLayout";

export function SecuritySettings() {
  return (
    <>
      <ChangePasswordCard />
      <DevicesCard />
      <DeleteAccountCard />
    </>
  );
}

type PasswordValues = z.infer<typeof changePasswordSchema>;

function ChangePasswordCard() {
  const queryClient = useQueryClient();
  const accountKey = useAccountKey();
  const [done, setDone] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
  });

  const change = useMutation({
    mutationFn: (values: PasswordValues) =>
      api<void>("/me/password", "POST", { currentPassword: values.currentPassword, newPassword: values.newPassword }),
    onMutate: () => setDone(false),
    onSuccess: async () => {
      reset({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setDone(true);
      await queryClient.invalidateQueries({ queryKey: [...accountKey, "sessions"] });
    },
  });

  return (
    <SettingsCard title="changePassword">
      <form noValidate onSubmit={handleSubmit((values) => change.mutate(values))} className="space-y-4">
        {done && <SuccessBanner k="passwordUpdated" />}
        <ErrorBanner error={change.error} />
        <PasswordField label="currentPassword" autoComplete="current-password" error={errors.currentPassword} {...register("currentPassword")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <PasswordField
            label="newPassword"
            autoComplete="new-password"
            error={errors.newPassword}
            hint={<Dual k="newPasswordHint" rwClassName="" />}
            {...register("newPassword")}
          />
          <PasswordField label="confirmPassword" autoComplete="new-password" error={errors.confirmPassword} {...register("confirmPassword")} />
        </div>
        <div className="flex justify-end">
          <SaveButton label="savePassword" busy={change.isPending} />
        </div>
      </form>
    </SettingsCard>
  );
}

function DevicesCard() {
  const sessions = useSessions();
  const queryClient = useQueryClient();
  const accountKey = useAccountKey();
  const refresh = () => queryClient.invalidateQueries({ queryKey: [...accountKey, "sessions"] });

  const signOut = useMutation({
    mutationFn: (id: string) => api<void>(`/me/sessions/${id}/sign-out`, "POST", {}),
    onSettled: refresh,
  });
  const signOutOthers = useMutation({
    mutationFn: () => api<void>("/me/sessions/sign-out-others", "POST", {}),
    onSettled: refresh,
  });
  const others = sessions.data?.filter((session) => !session.current).length ?? 0;

  return (
    <SettingsCard title="devices" intro="devicesIntro">
      <div className="space-y-4">
        <ErrorBanner error={signOut.error ?? signOutOthers.error} />
        {sessions.isPending && <Loading />}
        {sessions.isError && <LoadError error={sessions.error} onRetry={() => void sessions.refetch()} />}
        {sessions.isSuccess && (
          <ul className="divide-y divide-line rounded-xl ring-1 ring-line">
            {sessions.data.map((session) => (
              <DeviceRow
                key={session.id}
                session={session}
                busy={signOut.isPending && signOut.variables === session.id}
                onSignOut={() => signOut.mutate(session.id)}
              />
            ))}
          </ul>
        )}
        {others > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => signOutOthers.mutate()}
              disabled={signOutOthers.isPending}
              className="min-h-11 rounded-xl px-4 text-sm font-bold text-danger ring-1 ring-danger/30 hover:bg-danger-soft disabled:opacity-60"
            >
              <Dual k="signOutOthers" rwClassName="font-medium text-danger/70" />
            </button>
          </div>
        )}
      </div>
    </SettingsCard>
  );
}

function DeviceRow({ session, busy, onSignOut }: { session: DeviceSession; busy: boolean; onSignOut: () => void }) {
  const name = describeDevice(session.userAgent);
  const mobile = /Android|iPhone|iPad|Mobile/.test(session.userAgent ?? "");
  const Icon = mobile ? Smartphone : Laptop;
  return (
    <li className="flex items-center gap-3 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-surface text-muted">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
          {name ?? <Dual k="unknownDevice" />}
          {session.current && (
            <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-bold text-primary">
              <Dual k="thisDevice" rwClassName="font-medium" />
            </span>
          )}
        </p>
        <p className="mt-0.5 text-xs text-muted">
          <Dual k="lastActive" rwClassName="" />: {formatDateTime(session.lastActiveAt)}
        </p>
      </div>
      {!session.current && (
        <button
          type="button"
          onClick={onSignOut}
          disabled={busy}
          className="min-h-10 shrink-0 rounded-lg px-3 text-xs font-bold text-danger hover:bg-danger-soft disabled:opacity-60"
        >
          <Stacked k="signOut" className="leading-tight" />
        </button>
      )}
    </li>
  );
}

type DeleteValues = z.infer<typeof deleteAccountSchema>;

function DeleteAccountCard() {
  const { endLocalSession } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<DeleteValues>({
    resolver: zodResolver(deleteAccountSchema),
  });

  const remove = useMutation({
    mutationFn: (values: DeleteValues) => api<void>("/me/delete", "POST", values),
    onSuccess: async () => {
      // The server has already ended every login. This clears the cookie and everything held on this device.
      await api<void>("/auth/logout", "POST", {}).catch(() => undefined);
      endLocalSession();
      navigate("/login", { replace: true });
    },
  });

  return (
    <SettingsCard title="deleteAccount" intro="deleteAccountText" tone="danger">
      {confirming ? (
        <form noValidate onSubmit={handleSubmit((values) => remove.mutate(values))} className="space-y-4">
          <ErrorBanner error={remove.error} />
          <PasswordField label="deleteConfirm" autoComplete="current-password" error={errors.password} {...register("password")} />
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-xl px-4 text-sm font-bold text-muted hover:bg-surface"
            >
              <Dual k="cancel" rwClassName="font-medium" />
            </button>
            <SaveButton label="deleteForever" busy={remove.isPending} tone="danger" />
          </div>
        </form>
      ) : (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-11 rounded-xl px-4 text-sm font-bold text-danger ring-1 ring-danger/30 hover:bg-danger-soft"
          >
            <Dual k="deleteAccount" rwClassName="font-medium text-danger/70" />
          </button>
        </div>
      )}
    </SettingsCard>
  );
}
