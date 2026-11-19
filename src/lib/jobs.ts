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
  /** The rest are set once a job is done. Workers only get them for jobs they were hired for. */
  completedAt?: string | null;
  paymentMethod?: PaymentMethod | null;
  paidAt?: string | null;
  paymentConfirmedAt?: string | null;
  paymentDisputedAt?: string | null;
}

export type PaymentMethod = "CASH" | "MOBILE_MONEY";
export const PAYMENT_METHODS: readonly PaymentMethod[] = ["MOBILE_MONEY", "CASH"];
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, StringKey> = {
  CASH: "payCash",
  MOBILE_MONEY: "payMobileMoney",
};

/**
 * Where a finished job's pay stands. Only the worker's confirmation makes it received, because
 * INDEGE does not handle the money.
 */
export type PaymentStatus = "UNPAID" | "TO_CONFIRM" | "DISPUTED" | "RECEIVED";

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, StringKey> = {
  UNPAID: "payStatusUnpaid",
  TO_CONFIRM: "payStatusToConfirm",
  DISPUTED: "payStatusDisputed",
  RECEIVED: "payStatusReceived",
};

type PaymentFields = Pick<Job, "status" | "paidAt" | "paymentConfirmedAt" | "paymentDisputedAt">;

/** Null for a job that is not done. */
export function paymentStatus(job: PaymentFields): PaymentStatus | null {
  if (job.status !== "COMPLETED") return null;
  if (job.paymentConfirmedAt) return "RECEIVED";
  if (job.paymentDisputedAt) return "DISPUTED";
  return job.paidAt ? "TO_CONFIRM" : "UNPAID";
}

/** A hired job can be marked done, or its pay recorded, once its start time has passed. */
export function canFinish(job: Pick<Job, "status" | "startsAt">, now = new Date()): boolean {
  return (job.status === "ASSIGNED" || job.status === "IN_PROGRESS") && new Date(job.startsAt) <= now;
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

/** For a payment date, such as "19 Nov 2026". */
export function formatDate(value: string | Date): string {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

/** "Nov" for "2026-11". Read as a calendar month, whatever the device's time zone. */
export function formatMonthKey(month: string, style: "short" | "long" = "short"): string {
  const [year, index] = month.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: style, year: style === "long" ? "numeric" : undefined, timeZone: "UTC" }).format(
    new Date(Date.UTC(year, index - 1, 1)),
  );
}
