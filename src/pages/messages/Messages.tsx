import { MessageCircle } from "lucide-react";
import { Link, Outlet, useParams } from "react-router-dom";
import { Avatar } from "../../components/ProfileMenu";
import { LoadError, Loading } from "../../components/JobParts";
import { Dual, Stacked } from "../../components/Text";
import { CATEGORY_LABELS } from "../../lib/jobs";
import { type Conversation, formatMessageTime, useInbox, useSide } from "../../lib/messages";

/**
 * The inbox for the dashboard in use. Wide screens show the list beside the open conversation;
 * phones show one or the other.
 */
export function Messages() {
  const { id } = useParams();
  const side = useSide();
  const inbox = useInbox(side);
  const conversations = inbox.data?.pages.flatMap((page) => page.conversations) ?? [];

  return (
    <div className="space-y-4">
      <h1 className={`text-2xl font-extrabold lg:text-3xl ${id ? "hidden md:block" : ""}`}>
        <Dual k="navMessages" />
      </h1>

      <div className="grid gap-4 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-6">
        <section aria-label="Conversations" className={id ? "hidden md:block" : ""}>
          {inbox.isPending && <Loading />}
          {inbox.isError && <LoadError error={inbox.error} onRetry={() => void inbox.refetch()} />}
          {inbox.isSuccess && conversations.length === 0 && (
            <div className="rounded-2xl bg-card p-6 text-sm shadow-sm ring-1 ring-line/60">
              <Stacked k={side === "hiring" ? "noMessagesHiring" : "noMessagesWorking"} className="text-muted" />
            </div>
          )}
          {conversations.length > 0 && (
            <ul className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-line/60">
              {conversations.map((conversation) => (
                <li key={conversation.id} className="border-b border-line last:border-b-0">
                  <InboxRow conversation={conversation} selected={conversation.id === id} />
                </li>
              ))}
            </ul>
          )}
          {inbox.hasNextPage && (
            <button
              type="button"
              onClick={() => void inbox.fetchNextPage()}
              disabled={inbox.isFetchingNextPage}
              className="mt-3 flex min-h-11 w-full items-center justify-center rounded-xl bg-card text-sm font-bold text-primary ring-1 ring-primary/30 hover:bg-primary-soft disabled:opacity-60"
            >
              <Dual k="loadMore" rwClassName="font-medium text-primary/70" />
            </button>
          )}
        </section>

        <div className={id ? "" : "hidden md:block"}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

function InboxRow({ conversation, selected }: { conversation: Conversation; selected: boolean }) {
  const { other, job, lastMessage, unread } = conversation;
  return (
    <Link
      to={`/messages/${conversation.id}`}
      aria-current={selected ? "page" : undefined}
      className={`flex items-start gap-3 p-3.5 transition ${selected ? "bg-primary-soft" : "hover:bg-surface"}`}
    >
      <Avatar name={other.fullName} />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline gap-2">
          <span className={`min-w-0 flex-1 truncate text-sm ${unread ? "font-extrabold" : "font-bold"}`}>{other.fullName}</span>
          {conversation.lastMessageAt && (
            <span className="shrink-0 text-[11px] text-muted">{formatMessageTime(conversation.lastMessageAt)}</span>
          )}
        </span>
        <span className="block truncate text-xs text-muted">
          <Dual k={CATEGORY_LABELS[job.category]} rwClassName="" /> · {job.description}
        </span>
        <span className="mt-0.5 flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate text-sm ${unread ? "font-semibold text-ink" : "text-muted"}`}>
            {lastMessage?.mine && <Dual k="you" rwClassName="" />}
            {lastMessage?.mine && ": "}
            {lastMessage?.body}
          </span>
          {unread > 0 && (
            <span className="grid min-w-5 place-items-center rounded-full bg-secondary px-1.5 text-[11px] font-extrabold text-on-secondary tabular-nums">
              {unread}
              <span className="sr-only"> unread</span>
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}

/** Shown beside the list on wide screens before a conversation is chosen. */
export function NoConversationChosen() {
  return (
    <div className="grid h-full min-h-80 place-items-center rounded-2xl bg-card p-6 text-center shadow-sm ring-1 ring-line/60">
      <div>
        <MessageCircle className="mx-auto size-10 text-primary/40" aria-hidden="true" />
        <Stacked k="chooseConversation" className="mt-3 block text-sm text-muted" />
      </div>
    </div>
  );
}
