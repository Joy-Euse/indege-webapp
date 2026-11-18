import type { StringKey } from "../i18n/strings";

export type JobStatus = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export type JobCategory =
  | "CLEANING"
  | "CONSTRUCTION"
  | "GARDENING"
  | "FARMING"
  | "MOVING"
  | "COURIER"
  | "DOMESTIC"
  | "HOSPITALITY";

export interface Job {
  id: string;
  category: JobCategory;
  description: string;
  district: string;
  sector: string;
  landmark: string;
  startsAt: string;
  durationHours: number;
  wageRwf: number;
  status: JobStatus;
  createdAt: string;
  /** Workers waiting for an answer. Only in the customer's job lists. */
  pendingApplications?: number;
}

/**
 * The categories customers can choose. To stop offering one, remove it here and from JOB_CATEGORIES
 * in the backend. Keep its label in CATEGORY_LABELS, because older jobs may still use it.
 */
export const OFFERED_CATEGORIES = [
  "CLEANING",
  "CONSTRUCTION",
  "GARDENING",
  "FARMING",
  "MOVING",
  "COURIER",
  "DOMESTIC",
  "HOSPITALITY",
] as const satisfies readonly JobCategory[];

export const CATEGORY_LABELS: Record<JobCategory, StringKey> = {
  CLEANING: "categoryCleaning",
  CONSTRUCTION: "categoryConstruction",
  GARDENING: "categoryGardening",
  FARMING: "categoryFarming",
  MOVING: "categoryMoving",
  COURIER: "categoryCourier",
  DOMESTIC: "categoryDomestic",
  HOSPITALITY: "categoryHospitality",
};

export const STATUS_LABELS: Record<JobStatus, StringKey> = {
  OPEN: "statusOpen",
  ASSIGNED: "statusAssigned",
  IN_PROGRESS: "statusInProgress",
  COMPLETED: "statusCompleted",
  CANCELLED: "statusCancelled",
};

export function isOfferedCategory(value: string | null): value is (typeof OFFERED_CATEGORIES)[number] {
  return (OFFERED_CATEGORIES as readonly string[]).includes(value ?? "");
}

/** The City of Kigali's districts and their sectors. Matches the backend's job-options.ts. */
export const KIGALI_SECTORS = {
  Gasabo: ["Bumbogo", "Gatsata", "Gikomero", "Gisozi", "Jabana", "Jali", "Kacyiru", "Kimihurura", "Kimironko", "Kinyinya", "Ndera", "Nduba", "Remera", "Rusororo", "Rutunga"],
  Kicukiro: ["Gahanga", "Gatenga", "Gikondo", "Kagarama", "Kanombe", "Kicukiro", "Kigarama", "Masaka", "Niboye", "Nyarugunga"],
  Nyarugenge: ["Gitega", "Kanyinya", "Kigali", "Kimisagara", "Mageragere", "Muhima", "Nyakabanda", "Nyamirambo", "Nyarugenge", "Rwezamenyo"],
} as const;

export type District = keyof typeof KIGALI_SECTORS;
export const DISTRICTS = Object.keys(KIGALI_SECTORS) as [District, ...District[]];

export const MAX_DAYS_AHEAD = 90;
export const MAX_DURATION_HOURS = 12;
export const MIN_WAGE_RWF = 1_000;
export const MAX_WAGE_RWF = 2_000_000;
export const MAX_DESCRIPTION_LENGTH = 250;

export function formatRwf(amount: number): string {
  return `${amount.toLocaleString("en-US")} RWF`;
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

/** For "member since" dates, such as "November 2026". */
export function formatMonthYear(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric" }).format(new Date(value));
}

/** The format a datetime-local input expects, in the device's time zone. */
export function toLocalInput(value: string | Date): string {
  const date = new Date(value);
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** An open job whose start time has gone by with nobody hired needs a new date or cancelling. */
export function hasMissedStart(job: Pick<Job, "status" | "startsAt">, now = new Date()): boolean {
  return job.status === "OPEN" && new Date(job.startsAt) <= now;
}
