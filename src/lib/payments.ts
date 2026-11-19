import { keepPreviousData, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "./api";
import type { Job } from "./jobs";
import { retryServerErrors, useJobsKey } from "./useJobs";

export interface CustomerPaymentsSummary {
  paidRwf: number;
  paidJobs: number;
  paidThisMonthRwf: number;
  /** Not paid yet, or the worker said the payment never arrived. */
  toPayRwf: number;
  toPayJobs: number;
  disputed: number;
  /** Hired jobs past their start time that are not marked done. */
  toFinish: number;
  upcomingRwf: number;
  upcomingJobs: number;
  byMonth: { month: string; paidRwf: number }[];
}

/** A finished job, with the worker who did it. */
export type PaymentJob = Job & { worker: { id: string; fullName: string } | null };

export type PaymentFilter = "all" | "to-pay" | "paid";

interface PaymentPage {
  jobs: PaymentJob[];
  nextCursor: string | null;
}

const STALE_MS = 30_000;

export function paymentsPath(filters: { status?: PaymentFilter; cursor?: string | null; limit?: number }): string {
  const params = new URLSearchParams();
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.cursor) params.set("cursor", filters.cursor);
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();
  return `/payments${query ? `?${query}` : ""}`;
}

/** Under the customer's jobs key, so marking a job done or paying refreshes it too. */
export function usePaymentsSummary() {
  return useQuery({
    queryKey: [...useJobsKey(), "payments", "summary"],
    queryFn: async () => (await api<{ summary: CustomerPaymentsSummary }>("/payments/summary")).summary,
    retry: retryServerErrors,
    staleTime: STALE_MS,
  });
}

export function usePayments(status: PaymentFilter) {
  return useInfiniteQuery({
    queryKey: [...useJobsKey(), "payments", "list", { status }],
    queryFn: ({ pageParam }) => api<PaymentPage>(paymentsPath({ status, cursor: pageParam })),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: keepPreviousData,
    retry: retryServerErrors,
    staleTime: STALE_MS,
  });
}
