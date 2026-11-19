import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Job } from "./jobs";
import { retryServerErrors } from "./useJobs";
import { useWorkKey } from "./work";

export interface MonthEarnings {
  /** "2026-11", Kigali time. */
  month: string;
  receivedRwf: number;
}

export interface EarningsSummary {
  receivedRwf: number;
  receivedJobs: number;
  receivedThisMonthRwf: number;
  waitingRwf: number;
  waitingJobs: number;
  /** Payments the customer recorded that the worker has not confirmed. */
  toConfirm: number;
  upcomingRwf: number;
  upcomingJobs: number;
  /** The last six months, oldest first. */
  byMonth: MonthEarnings[];
}

/** A finished job, with its payment record. */
export type EarningJob = Omit<Job, "landmark">;

export type EarningsFilter = "all" | "waiting" | "received";

interface EarningsPage {
  jobs: EarningJob[];
  nextCursor: string | null;
}

const STALE_MS = 30_000;

export function earningsPath(filters: { status?: EarningsFilter; cursor?: string | null; limit?: number }): string {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return `/work/earnings${query ? `?${query}` : ""}`;
}

/** Under the worker's key, so every change to their jobs refreshes it too. */
export function useEarningsSummary() {
  return useQuery({
    queryKey: [...useWorkKey(), "earnings", "summary"],
    queryFn: async () => (await api<{ summary: EarningsSummary }>("/work/earnings/summary")).summary,
    retry: retryServerErrors,
    staleTime: STALE_MS,
  });
}

export function useEarnings(status: EarningsFilter) {
  return useInfiniteQuery({
    queryKey: [...useWorkKey(), "earnings", "list", { status }],
    queryFn: ({ pageParam }) => api<EarningsPage>(earningsPath({ status, cursor: pageParam })),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
    retry: retryServerErrors,
    staleTime: STALE_MS,
  });
}
