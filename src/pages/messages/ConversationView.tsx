import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Info, Lock, SendHorizontal } from "lucide-react";
import { type FormEvent, type KeyboardEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorBanner } from "../../components/Form";
import { LoadError, Loading, StatusBadge } from "../../components/JobParts";
import { Avatar } from "../../components/ProfileMenu";
import { Dual, plain, Stacked } from "../../components/Text";
import { api } from "../../lib/api";
import { CATEGORY_LABELS } from "../../lib/jobs";
import {
  formatMessageTime,
  MAX_MESSAGE_LENGTH,
  type Message,
  SEND_BLOCK_TEXT,
  useConversation,
  useMessagesKey,
  useThread,
} from "../../lib/messages";

export function ConversationView() {
  const { id = "" } = useParams();
  const queryClient = useQueryClient();
  const messagesKey = useMessagesKey();
  const conversation = useConversation(id);
  const thread = useThread(id);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottom = useRef(true);

  // Oldest first on screen, while pages arrive newest first.
  const messages: Message[] = thread.data ? [...thread.data.pages].reverse().flatMap((page) => page.messages) : [];
  const newestId = messages[messages.length - 1]?.id;
  const otherUnread = conversation.data?.unread ?? 0;

  // Marks the conversation read when it opens and whenever new messages arrive while it is open.
  useEffect(() => {
    if (!newestId || !otherUnread) return;
    void api(`/conversations/${id}/read`, "POST").then(() =>
      queryClient.invalidateQueries({ queryKey: [...messagesKey] }),
    );
  }, [id, newestId, otherUnread]);

  // Follows new messages, unless the reader has scrolled up to read older ones.
  useLayoutEffect(() => {
    const box = scrollRef.current;
    if (box && stickToBottom.current) box.scrollTop = box.scrollHeight;
  }, [newestId, id]);

  useEffect(() => {
    stickToBottom.current = true;
    setDraft("");
  }, [id]);

  const send = useMutation({
    mutationFn: (body: string) => api<{ message: Message }>(`/conversations/${id}/messages`, "POST", { body }),
    onSuccess: () => {
      setDraft("");
      stickToBottom.current = true;
    },
    // Also after a failure: the other person may have changed their settings, or the job closed.
    onSettled: () => queryClient.invalidateQueries({ queryKey: [...messagesKey] }),
  });

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const body = draft.trim();
    if (body && body.length <= MAX_MESSAGE_LENGTH && !send.isPending) send.mutate(body);
  }

  // Enter sends on a keyboard; Shift+Enter adds a line. Phones use the send button.
  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && window.matchMedia("(pointer: fine)").matches) {
      event.preventDefault();
      submit();
    }
  }

  if (conversation.isPending) return <Loading />;
  if (conversation.isError) return <LoadError error={conversation.error} onRetry={() => void conversation.refetch()} />;
  const { other, job, sendBlock, side } = conversation.data;
  const jobHref = side === "hiring" ? `/customer/jobs/${job.id}` : `/worker/jobs/${job.id}`;
  const tooLong = draft.length > MAX_MESSAGE_LENGTH;

  return (
    <section
      aria-label={`Conversation with ${other.fullName}`}
      className="flex h-[calc(100dvh-13rem)] min-h-96 flex-col overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-line/60 md:h-[calc(100dvh-12rem)]"
    >
      <header className="flex items-center gap-3 border-b border-line p-3">
        <Link to="/messages" aria-label={plain("back")} className="grid size-10 shrink-0 place-items-center rounded-full text-muted hover:bg-surface md:hidden">
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <Avatar name={other.fullName} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-extrabold">{other.fullName}</h2>
          <Link to={jobHref} className="block truncate text-xs text-muted underline-offset-2 hover:underline">
            <Dual k={CATEGORY_LABELS[job.category]} rwClassName="" /> · {job.description}
          </Link>
        </div>
        <StatusBadge status={job.status} />
      </header>

      <div
        ref={scrollRef}
        onScroll={(event) => {
          const box = event.currentTarget;
          stickToBottom.current = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
        }}
        className="flex-1 space-y-2 overflow-y-auto bg-surface/50 p-3 sm:p-4"
        aria-live="polite"
      >
        {thread.hasNextPage && (
          <button
            type="button"
            onClick={() => {
              stickToBottom.current = false;
              void thread.fetchNextPage();
            }}
            disabled={thread.isFetchingNextPage}
            className="mx-auto mb-2 flex min-h-10 items-center rounded-full bg-card px-4 text-xs font-bold text-primary ring-1 ring-primary/30 disabled:opacity-60"
          >
            <Dual k="olderMessages" rwClassName="font-medium text-primary/70" />
          </button>
        )}
        {thread.isPending && <Loading />}
        {thread.isError && <LoadError error={thread.error} onRetry={() => void thread.refetch()} />}
        {thread.isSuccess && messages.length === 0 && (
          <Stacked k="sayHello" className="block py-8 text-center text-sm text-muted" />
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.mine ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%] ${message.mine ? "rounded-br-md bg-primary text-on-fill" : "rounded-bl-md bg-card ring-1 ring-line/60"}`}
            >
              <p className="whitespace-pre-line break-words">{message.body}</p>
              <p className={`mt-0.5 text-right text-[10px] ${message.mine ? "text-on-fill/70" : "text-muted"}`}>
                <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-line p-3">
        {sendBlock ? (
          <p className="flex items-start gap-2 rounded-xl bg-field p-3 text-xs text-muted">
            <Lock className="mt-px size-4 shrink-0" aria-hidden="true" />
            <Stacked k={SEND_BLOCK_TEXT[sendBlock]} />
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-2">
            <ErrorBanner error={send.error} />
            <div className="flex items-end gap-2">
              <label className="sr-only" htmlFor="message-box">
                {plain("writeMessage")}
              </label>
              <textarea
                id="message-box"
                rows={1}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder={plain("writeMessage")}
                aria-invalid={tooLong}
                className={`max-h-32 min-h-11 flex-1 resize-none rounded-xl bg-field px-3.5 py-2.5 text-base outline-none ring-1 ring-transparent focus:bg-card focus:ring-2 focus:ring-primary field-sizing-content ${tooLong ? "ring-2! ring-danger!" : ""}`}
              />
              <button
                type="submit"
                disabled={!draft.trim() || tooLong || send.isPending}
                aria-label={plain("send")}
                className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary text-on-secondary shadow-sm hover:bg-[#e58a1f] disabled:opacity-50"
              >
                <SendHorizontal className="size-5" aria-hidden="true" />
              </button>
            </div>
            {(tooLong || draft.length > MAX_MESSAGE_LENGTH - 100) && (
              <p className={`text-right text-xs ${tooLong ? "font-bold text-danger" : "text-muted"}`}>
                {draft.length}/{MAX_MESSAGE_LENGTH}
              </p>
            )}
            <p className="flex items-center gap-1.5 text-[11px] text-muted">
              <Info className="size-3.5 shrink-0" aria-hidden="true" />
              <Dual k="chatSafety" rwClassName="" />
            </p>
          </form>
        )}
      </div>
    </section>
  );
}
