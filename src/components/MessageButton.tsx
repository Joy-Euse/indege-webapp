import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { StringKey } from "../i18n/strings";
import { openConversation, useMessagesKey } from "../lib/messages";
import { ErrorBanner } from "./Form";
import { Dual } from "./Text";

interface MessageButtonProps {
  jobId: string;
  /** Needed when the customer opens it. Left out by the worker. */
  workerId?: string;
  conversationId: string | null | undefined;
  canMessage: boolean | undefined;
  label: StringKey;
}

/**
 * Opens the conversation about a job, starting it if needed. Hidden when the other person's
 * settings don't allow it and there is no conversation yet, so nobody is offered a dead end.
 */
export function MessageButton({ jobId, workerId, conversationId, canMessage, label }: MessageButtonProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesKey = useMessagesKey();
  const open = useMutation({
    mutationFn: () => openConversation(jobId, workerId),
    onSuccess: async (conversation) => {
      await queryClient.invalidateQueries({ queryKey: [...messagesKey] });
      navigate(`/messages/${conversation.id}`);
    },
  });

  if (!conversationId && !canMessage) return null;

  return (
    <div className="space-y-2">
      <ErrorBanner error={open.error} />
      <button
        type="button"
        onClick={() => (conversationId ? navigate(`/messages/${conversationId}`) : open.mutate())}
        disabled={open.isPending}
        className="flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-card text-sm font-bold text-primary ring-1 ring-primary/30 hover:bg-primary-soft disabled:opacity-60"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        <Dual k={label} rwClassName="font-medium text-primary/70" />
      </button>
    </div>
  );
}
