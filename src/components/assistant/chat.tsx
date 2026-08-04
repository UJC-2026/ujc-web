"use client";

import { useEffect, useRef, useState } from "react";
import { AlertCircle, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import type { ChatMessage } from "@/lib/assistant/queries";
import { cn } from "@/lib/utils";

const STARTERS = [
  "Apa saja yang harus diurus di minggu pertama setelah sampai di Jepang?",
  "Bagaimana cara membagi waktu kuliah daring dengan kerja shift malam?",
  "Apa bedanya kokumin kenko hoken dan shakai hoken?",
  "Bagaimana cara menolak ajakan nomikai tanpa terasa kasar?",
];

export function AssistantChat({
  sessionId,
  initialMessages,
  remaining,
}: {
  sessionId: string;
  initialMessages: ChatMessage[];
  remaining: number;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const [left, setLeft] = useState(remaining);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, streaming]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || pending) return;

    setPending(true);
    setError(undefined);
    setDraft("");
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${prev.length}`,
        role: "user",
        content: question,
        created_at: new Date().toISOString(),
      },
    ]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: question }),
      });

      if (!response.ok || !response.body) {
        const payload = await response.json().catch(() => null);
        setError(payload?.error ?? "Asisten sedang tidak bisa dihubungi.");
        setPending(false);
        return;
      }

      // The answer arrives progressively, so it appears as it is written
      // rather than after a long silence.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setStreaming(answer);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `local-answer-${prev.length}`,
          role: "assistant",
          content: answer,
          created_at: new Date().toISOString(),
        },
      ]);
      setStreaming("");
      setLeft((value) => Math.max(0, value - 1));
    } catch {
      setError("Sambungan terputus. Coba lagi sebentar lagi.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      {messages.length === 0 && !streaming && (
        <div className="mt-8 rounded-panel border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2.5 text-h3 text-foreground">
            <Sparkles className="size-5 text-accent" aria-hidden />
            Mau tanya apa?
          </h2>
          <p className="mt-2 text-body text-muted-foreground">
            Asisten ini tahu konteks hidup di Jepang sambil kuliah daring. Untuk
            urusan visa, pajak, dan hukum, jawabannya sengaja mengarahkan ke
            sumber resmi — bukan memberi kepastian.
          </p>
          <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {STARTERS.map((starter) => (
              <li key={starter}>
                <button
                  type="button"
                  onClick={() => send(starter)}
                  className="w-full rounded-card border border-border bg-surface-muted/40 px-4 py-3 text-left text-caption text-foreground transition-colors hover:border-accent hover:text-primary"
                >
                  {starter}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <ol className="mt-8 space-y-4">
        {messages.map((message) => (
          <li
            key={message.id}
            className={cn(
              "flex",
              message.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[85%] rounded-card px-4 py-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface text-foreground",
              )}
            >
              <p className="text-body whitespace-pre-line">{message.content}</p>
            </div>
          </li>
        ))}

        {streaming && (
          <li className="flex justify-start">
            <div className="max-w-[85%] rounded-card border border-border bg-surface px-4 py-3 text-foreground">
              <p className="text-body whitespace-pre-line">{streaming}</p>
            </div>
          </li>
        )}

        {pending && !streaming && (
          <li className="flex justify-start" aria-live="polite">
            <div className="rounded-card border border-border bg-surface px-4 py-3 text-body text-muted-foreground">
              Sedang menyusun jawaban…
            </div>
          </li>
        )}
        <div ref={endRef} />
      </ol>

      <div className="mt-8">
        {error && (
          <p
            role="alert"
            className="mb-3 flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void send(draft);
          }}
          className="space-y-3"
        >
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(draft);
              }
            }}
            rows={3}
            maxLength={2000}
            placeholder="Tulis pertanyaanmu… (Enter untuk kirim, Shift+Enter untuk baris baru)"
            aria-label="Pertanyaan untuk asisten"
            disabled={pending || left <= 0}
          />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-caption text-muted-foreground">
              Sisa {left.toLocaleString("id-ID")} pertanyaan hari ini.
            </p>
            <Button type="submit" size="sm" loading={pending} disabled={left <= 0}>
              {!pending && <Send aria-hidden />}
              {pending ? "Menjawab…" : "Kirim"}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
