import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import type { StringKey } from "../i18n/strings";
import type { PublicProfile } from "./account";
import { api } from "./api";
import type { District, Job, JobCategory } from "./jobs";
import { retryServerErrors } from "./useJobs";

export type ApplicationStatus = "PENDING" | "HIRED" | "NOT_SELECTED" | "WITHDRAWN";

export interface MyApplication {
  id: string;
  status: ApplicationStatus;
  message: string | null;
  createdAt: string;
}

/** A job as a worker sees it. The exact place and the customer only come back once the worker is hired. */
export interface WorkerJob extends Omit<Job, "landmark"> {
  landmark?: string;
  customer?: PublicProfile;
  myApplication: MyApplication | null;
}

export interface WorkerApplication extends MyApplication {
  job: Omit<Job, "landmark">;
}

export interface WorkerSummary {
  pending: number;
  hired: number;
  notSelected: number;
  upcomingWagesRwf: number;
  openJobs: number;
}

/** A worker's application, as the customer who posted the job sees it. */
export interface Applicant {
  id: string;
  status: Exclude<ApplicationStatus, "WITHDRAWN">;
  message: string | null;
  createdAt: string;
  worker: PublicProfile;
}

export type ApplicationFilter = "all" | "pending" | "hired" | "closed";

export interface WorkFilters {
  q?: string;
  category?: JobCategory;
  district?: District;
}

export const MAX_MESSAGE_LENGTH = 300;

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, StringKey> = {
  PENDING: "appPending",
  HIRED: "appHired",
  NOT_SELECTED: "appNotSelected",
  WITHDRAWN: "appWithdrawn",
};

/** Keyed by user, so a shared device never shows the previous person's applications. */
export function useWorkKey(): readonly unknown[] {
  const { state } = useAuth();
  return ["work", state.user?.id];
}

/** Lists stay fresh for a short while, and every change made in the app refreshes them at once. */
const STALE_MS = 30_000;

export function findWorkPath(filters: WorkFilters & { cursor?: string | null; limit?: number }): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.category) params.set("category", filters.category);
  if (filters.district) params.set("district", filters.district);
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return `/work/jobs${query ? `?${query}` : ""}`;
}

export function applicationsPath(filters: { status?: ApplicationFilter; cursor?: string | null; limit?: number }): string {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return `/work/applications${query ? `?${query}` : ""}`;
}

interface WorkPage {
  jobs: WorkerJob[];
  nextCursor: string | null;
}

interface ApplicationPage {
  applications: WorkerApplication[];
  nextCursor: string | null;
}

export function useWorkSummary() {
  return useQuery({
    queryKey: [...useWorkKey(), "summary"],
    queryFn: async () => (await api<{ summary: WorkerSummary }>("/work/summary")).summary,
    retry: retryServerErrors,
    staleTime: STALE_MS,
  });
}

/** One page of open jobs, for short lists such as the dashboard's. */
export function useOpenJobs(filters: WorkFilters & { limit?: number }, enabled = true) {
  return useQuery({
    queryKey: [...useWorkKey(), "open", filters],
    enabled,
    queryFn: () => api<WorkPage>(findWorkPath(filters)),
    retry: retryServerErrors,
    staleTime: STALE_MS,
  });
}

/** Searchable, paged open jobs. The previous results stay on screen while new ones load. */
export function useFindWork(filters: WorkFilters) {
  return useInfiniteQuery({
    queryKey: [...useWorkKey(), "find", filters],
    queryFn: ({ pageParam }) => api<WorkPage>(findWorkPath({ ...filters, cursor: pageParam })),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
    retry: retryServerErrors,
    staleTime: STALE_MS,
  });
}

export function useMyApplications(status: ApplicationFilter, limit?: number) {
  return useInfiniteQuery({
    queryKey: [...useWorkKey(), "applications", { status, limit }],
    queryFn: ({ pageParam }) => api<ApplicationPage>(applicationsPath({ status, cursor: pageParam, limit })),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
    retry: retryServerErrors,
    staleTime: STALE_MS,
  });
}

export function useWorkJob(id: string) {
  return useQuery({
    queryKey: [...useWorkKey(), "job", id],
    queryFn: async () => (await api<{ job: WorkerJob }>(`/work/jobs/${id}`)).job,
    retry: retryServerErrors,
  });
}
