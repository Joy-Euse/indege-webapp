import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import type { StringKey } from "../i18n/strings";
import type { PublicProfile } from "./account";
import { api } from "./api";
import type { JobCategory, JobStatus } from "./jobs";
import { retryServerErrors } from "./useJobs";

export type Side = "hiring" | "working";
export type MessagePermission = "NOBODY" | "HIRED" | "APPLICANTS";
export type SendBlock = "CLOSED" | "NOT_ALLOWED" | "UNAVAILABLE";

export interface Message {
  id: string;
  body: string;
  createdAt: string;
  mine: boolean;
}

export interface Conversation {
  id: string;
  side: Side;
  job: { id: string; category: JobCategory; description: string; status: JobStatus };
  other: PublicProfile;
  lastMessage: Message | null;
  lastMessageAt: string | null;
  unread: number;
  sendBlock: SendBlock | null;
}

export const MAX_MESSAGE_LENGTH = 1000;

export const SEND_BLOCK_TEXT: Record<SendBlock, StringKey> = {
  CLOSED: "chatClosed",
  NOT_ALLOWED: "chatNotAllowed",
  UNAVAILABLE: "chatUnavailable",
};

/** The options in settings. The wording differs by side, because the people on the other side differ. */
export const PERMISSION_OPTIONS: Record<Side, { value: MessagePermission; label: StringKey; text: StringKey }[]> = {
  hiring: [
    { value: "NOBODY", label: "msgNobody", text: "msgNobodyText" },
    { value: "HIRED", label: "msgHiringHired", text: "msgHiringHiredText" },
    { value: "APPLICANTS", label: "msgHiringApplicants", text: "msgHiringApplicantsText" },
  ],
  working: [
    { value: "NOBODY", label: "msgNobody", text: "msgNobodyText" },
    { value: "HIRED", label: "msgWorkingHired", text: "msgWorkingHiredText" },
    { value: "APPLICANTS", label: "msgWorkingApplicants", text: "msgWorkingApplicantsText" },
  ],
};

/** Customers read their hiring inbox and workers their working one, so the two never mix. */
export function useSide(): Side {
  const { state } = useAuth();
  return state.user?.activeRole === "WORKER" ? "working" : "hiring";
}

/** Keyed by user, so a shared device never shows the previous person's messages. */
export function useMessagesKey(): readonly unknown[] {
  const { state } = useAuth();
  return ["messages", state.user?.id];
}

// Polling until there is a live connection. Only while the tab is visible, which is React Query's default.
const INBOX_POLL_MS = 15_000;
const THREAD_POLL_MS = 5_000;
const UNREAD_POLL_MS = 30_000;

interface InboxPage {
  conversations: Conversation[];
  nextCursor: string | null;
}

interface MessagePage {
  messages: Message[];
  olderCursor: string | null;
}

export function useInbox(side: Side) {
  return useInfiniteQuery({
    queryKey: [...useMessagesKey(), "inbox", side],
    queryFn: ({ pageParam }) =>
      api<InboxPage>(`/conversations?side=${side}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    retry: retryServerErrors,
    refetchInterval: INBOX_POLL_MS,
  });
}

export function useUnreadCount(side: Side, enabled = true) {
  return useQuery({
    queryKey: [...useMessagesKey(), "unread", side],
    queryFn: async () => (await api<{ unread: number }>(`/conversations/unread?side=${side}`)).unread,
    enabled,
    retry: retryServerErrors,
    refetchInterval: UNREAD_POLL_MS,
  });
}

export function useConversation(id: string) {
  return useQuery({
    queryKey: [...useMessagesKey(), "conversation", id],
    queryFn: async () => (await api<{ conversation: Conversation }>(`/conversations/${id}`)).conversation,
    retry: retryServerErrors,
    refetchInterval: INBOX_POLL_MS,
  });
}

/** Pages go back in time: the first page is the newest messages, and each next page is older. */
export function useThread(id: string) {
  return useInfiniteQuery({
    queryKey: [...useMessagesKey(), "thread", id],
    queryFn: ({ pageParam }) =>
      api<MessagePage>(`/conversations/${id}/messages${pageParam ? `?before=${encodeURIComponent(pageParam)}` : ""}`),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.olderCursor,
    retry: retryServerErrors,
    refetchInterval: THREAD_POLL_MS,
  });
}

/** Finds or starts the conversation about a job. Customers name the worker; workers leave it out. */
export async function openConversation(jobId: string, workerId?: string): Promise<Conversation> {
  return (await api<{ conversation: Conversation }>("/conversations", "POST", { jobId, workerId })).conversation;
}

/** "14:05" today, "Mon 14:05" this week, otherwise "3 Nov". */
export function formatMessageTime(value: string, now = new Date()): string {
  const date = new Date(value);
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(date);
  const days = (now.getTime() - date.getTime()) / 86_400_000;
  if (days < 6) return new Intl.DateTimeFormat("en-GB", { weekday: "short", hour: "2-digit", minute: "2-digit" }).format(date);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(date);
}
