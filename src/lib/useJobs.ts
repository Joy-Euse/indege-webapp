import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import { ApiError, api } from "./api";
import type { Job } from "./jobs";
import type { Applicant } from "./work";

export type StatusFilter = "all" | "active" | "open" | "in-progress" | "completed" | "cancelled";

export interface JobSummary {
  open: number;
  inProgress: number;
  completed: number;
  cancelled: number;
  total: number;
  activeWagesRwf: number;
}

interface JobPage {
  jobs: Job[];
  nextCursor: string | null;
}

/** Keyed by user, so nobody sees the previous user's jobs after logging in on the same device. */
export function useJobsKey(): readonly unknown[] {
  const { state } = useAuth();
  return ["jobs", state.user?.id];
}

/** Errors like "not found" will not change on a retry. */
export const retryServerErrors = (failures: number, error: unknown) =>
  failures < 2 && !(error instanceof ApiError && error.status < 500);

/** Lists stay fresh for a short while, and every change made in the app refreshes them at once. */
const LIST_STALE_MS = 30_000;

export function jobListPath(filters: { q?: string; status?: StatusFilter; cursor?: string | null; limit?: number }): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return `/jobs/mine${query ? `?${query}` : ""}`;
}

/** One page of jobs, for short lists such as the dashboard's active jobs. */
export function useJobList(filters: { status?: StatusFilter; limit?: number }) {
  return useQuery({
    queryKey: [...useJobsKey(), "list", filters],
    queryFn: () => api<JobPage>(jobListPath(filters)),
    retry: retryServerErrors,
    staleTime: LIST_STALE_MS,
  });
}

/** Searchable, paged jobs. The previous results stay on screen while new ones load. */
export function useJobSearch(q: string, status: StatusFilter) {
  return useInfiniteQuery({
    queryKey: [...useJobsKey(), "search", { q, status }],
    queryFn: ({ pageParam }) => api<JobPage>(jobListPath({ q, status, cursor: pageParam })),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
    retry: retryServerErrors,
    staleTime: LIST_STALE_MS,
  });
}

export function useJobSummary() {
  return useQuery({
    queryKey: [...useJobsKey(), "summary"],
    queryFn: async () => (await api<{ summary: JobSummary }>("/jobs/summary")).summary,
    retry: retryServerErrors,
    staleTime: LIST_STALE_MS,
  });
}

export function useJob(id: string) {
  return useQuery({
    queryKey: [...useJobsKey(), "job", id],
    queryFn: async () => (await api<{ job: Job }>(`/jobs/${id}`)).job,
    retry: retryServerErrors,
  });
}

/** Workers who applied for one of the customer's jobs. Stored under the job, so changing the job refreshes it. */
export function useApplicants(jobId: string) {
  return useQuery({
    queryKey: [...useJobsKey(), "job", jobId, "applications"],
    queryFn: async () => (await api<{ applications: Applicant[] }>(`/jobs/${jobId}/applications`)).applications,
    retry: retryServerErrors,
    staleTime: LIST_STALE_MS,
  });
}
