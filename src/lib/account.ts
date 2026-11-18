import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import type { StringKey } from "../i18n/strings";
import { api, type Role } from "./api";
import { retryServerErrors } from "./useJobs";

export type Visibility = "PRIVATE" | "CONNECTIONS" | "PUBLIC";

export interface OwnProfile {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  pendingEmail: string | null;
  bio: string | null;
  district: string | null;
  sector: string | null;
  roles: Role[];
  activeRole: Role;
  phoneVisibility: Visibility;
  emailVisibility: Visibility;
  locationVisibility: Visibility;
  memberSince: string;
}

export interface PublicProfile {
  id: string;
  fullName: string;
  bio: string | null;
  roles: Role[];
  memberSince: string;
  phone?: string;
  email?: string;
  district?: string;
  sector?: string;
}

export interface DeviceSession {
  id: string;
  userAgent: string | null;
  lastActiveAt: string;
  current: boolean;
}

export const VISIBILITY_OPTIONS: { value: Visibility; label: StringKey; text: StringKey }[] = [
  { value: "PRIVATE", label: "visPrivate", text: "visPrivateText" },
  { value: "CONNECTIONS", label: "visConnections", text: "visConnectionsText" },
  { value: "PUBLIC", label: "visPublic", text: "visPublicText" },
];

/** Keyed by user, like jobs, so a shared device never shows the previous person's account. */
export function useAccountKey(): readonly unknown[] {
  const { state } = useAuth();
  return ["account", state.user?.id];
}

export function useOwnProfile() {
  return useQuery({
    queryKey: [...useAccountKey(), "profile"],
    queryFn: async () => (await api<{ profile: OwnProfile }>("/me/profile")).profile,
    retry: retryServerErrors,
  });
}

export function usePublicPreview() {
  return useQuery({
    queryKey: [...useAccountKey(), "public-preview"],
    queryFn: async () => (await api<{ profile: PublicProfile }>("/me/profile/public-preview")).profile,
    retry: retryServerErrors,
  });
}

export function useSessions() {
  return useQuery({
    queryKey: [...useAccountKey(), "sessions"],
    queryFn: async () => (await api<{ sessions: DeviceSession[] }>("/me/sessions")).sessions,
    retry: retryServerErrors,
  });
}

/** A short, readable name for a browser's user agent, such as "Chrome on Android". */
export function describeDevice(userAgent: string | null): string | null {
  if (!userAgent) return null;
  const first = (patterns: [string, RegExp][]) => patterns.find(([, pattern]) => pattern.test(userAgent))?.[0] ?? null;
  // Order matters: Edge, Opera and Samsung Internet also claim to be Chrome, and Chrome claims Safari.
  const browser = first([
    ["Edge", /Edg\//],
    ["Opera", /OPR\//],
    ["Samsung Internet", /SamsungBrowser/],
    ["Chrome", /Chrome\//],
    ["Firefox", /Firefox\//],
    ["Safari", /Safari\//],
  ]);
  // Android user agents also mention Linux, and iPads can mention Mac OS X.
  const system = first([
    ["Android", /Android/],
    ["iPhone", /iPhone/],
    ["iPad", /iPad/],
    ["Windows", /Windows/],
    ["macOS", /Mac OS X/],
    ["Linux", /Linux/],
  ]);
  if (browser && system) return `${browser} on ${system}`;
  return browser ?? system;
}

export function initialsOf(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? [parts[0][0], parts[parts.length - 1][0]] : [parts[0]?.[0] ?? "?"];
  return letters.join("").toUpperCase();
}
