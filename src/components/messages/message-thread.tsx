"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Check, CheckCheck, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { markRead, sendMessage } from "@/app/(app)/messages/actions";
import { relativeTime } from "@/lib/format";
import { useLiveRows } from "@/lib/realtime/use-live-rows";
import type { Message } from "@/lib/messages/queries";
import { cn } from "@/lib/utils";

function SendButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      {!pending && <Send aria-hidden />}
      {pending ? "Mengirim…" : "Kirim"}
    </Button>
  );
}

export function MessageThread({
  conversationId,
  messages,
  meId,
  blocked,
}: {
  conversationId: string;
  messages: Message[];
  meId: string;
  blocked: boolean;
}) {
  const [error, setError] = useState<string>();
  const [key, setKey] = useState(0);
  const endRef = useRef<HTMLDivElement>(null);
  const markedRef = useRef(false);

  // New messages in this conversation arrive without a manual refresh.
  useLiveRows({
    table: "messages",
    filter: `conversation_id=eq.${conversationId}`,
  });

  // Mark incoming messages read once, after the thread is on screen.
  useEffect(() => {
    if (markedRef.current) return;
    const hasUnread = messages.some(
      (message) => message.sender_id !== meId && message.read_at === null,
    );
    if (!hasUnread) return;

    markedRef.current = true;
    const data = new FormData();
    data.set("conversationId", conversationId);
    void markRead(data);
  }, [conversationId, messages, meId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleSubmit(formData: FormData) {
    const result = await sendMessage({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setKey((value) => value + 1);
  }

  return (
    <>
      <ol className="mt-6 space-y-3">
        {messages.map((message) => {
          const mine = message.sender_id === meId;

          return (
            <li
              key={message.id}
              className={cn("flex", mine ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-card px-4 py-2.5",
                  mine
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-surface text-foreground",
                )}
              >
                <p className="text-body whitespace-pre-line">{message.content}</p>
                <p
                  className={cn(
                    "mt-1 flex items-center justify-end gap-1 text-caption",
                    mine ? "text-primary-foreground/70" : "text-muted-foreground",
                  )}
                >
                  {relativeTime(message.created_at)}
                  {mine &&
                    (message.read_at ? (
                      <CheckCheck className="size-3.5" aria-label="Dibaca" />
                    ) : (
                      <Check className="size-3.5" aria-label="Terkirim" />
                    ))}
                </p>
              </div>
            </li>
          );
        })}
        <div ref={endRef} />
      </ol>

      {messages.length === 0 && (
        <p className="mt-8 text-center text-body text-muted-foreground">
          Belum ada pesan. Sapa duluan, yuk.
        </p>
      )}

      <div className="mt-8">
        {blocked ? (
          <p className="rounded-field border border-border bg-surface-muted px-4 py-3 text-caption text-muted-foreground">
            Kamu memblokir anggota ini. Buka blokir dulu untuk mengirim pesan.
          </p>
        ) : (
          <form action={handleSubmit} className="space-y-3">
            <input type="hidden" name="conversationId" value={conversationId} />

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            <Textarea
              key={key}
              name="content"
              rows={3}
              required
              maxLength={4000}
              placeholder="Tulis pesan…"
              aria-label="Tulis pesan"
            />
            <SendButton />
          </form>
        )}
      </div>
    </>
  );
}
