import type { Metadata } from "next";
import Link from "next/link";
import { MessageSquarePlus, ServerOff, Trash2 } from "lucide-react";
import { env } from "@/lib/env";
import { requireProfile } from "@/lib/auth/session";
import { getMessages, getQuota, getSessions } from "@/lib/assistant/queries";
import { AssistantChat } from "@/components/assistant/chat";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { startConversation, deleteConversation } from "./actions";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Asisten UJC",
  robots: { index: false },
};

export default async function AssistantPage({
  searchParams,
}: {
  searchParams: Promise<{ sesi?: string }>;
}) {
  await requireProfile();
  const { sesi } = await searchParams;

  // Rendered rather than hidden: a member who finds this page should learn why
  // it is quiet, not meet a form that silently fails on submit.
  if (!env.ANTHROPIC_API_KEY) {
    return (
      <div className="mx-auto w-full max-w-2xl px-4 py-12">
        <h1 className="rule-gold text-h1 text-foreground">Asisten UJC</h1>
        <div className="mt-8 flex items-start gap-3 rounded-panel border border-border bg-surface p-6">
          <ServerOff className="mt-0.5 size-5 shrink-0 text-muted-foreground" aria-hidden />
          <div>
            <h2 className="text-h3 text-foreground">Belum diaktifkan</h2>
            <p className="mt-2 text-body text-muted-foreground">
              Asisten membutuhkan kunci API model yang berbayar, dan pengurus
              belum mengaktifkannya. Sementara ini, pertanyaanmu paling cepat
              dijawab di forum — di sana yang menjawab anggota yang benar-benar
              pernah mengalaminya.
            </p>
            <Button asChild className="mt-5">
              <Link href="/forum">Buka forum</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const [sessions, quota] = await Promise.all([getSessions(), getQuota()]);
  const active = sesi ?? sessions[0]?.id;
  const messages = active ? await getMessages(active) : [];
  const remaining = Math.max(0, quota.quota - quota.used);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="rule-gold text-h1 text-foreground">Asisten UJC</h1>
          <p className="mt-5 max-w-2xl text-body text-muted-foreground">
            Tanya apa saja soal hidup, kuliah, dan kerja di Jepang. Jawabannya
            bantuan awal, bukan nasihat resmi — untuk visa, pajak, dan hukum,
            asisten ini sengaja mengarahkanmu ke instansi yang berwenang.
          </p>
        </div>
        <form action={startConversation}>
          <Button type="submit" variant="outline" size="sm">
            <MessageSquarePlus aria-hidden />
            Percakapan baru
          </Button>
        </form>
      </div>

      <div className="mt-9 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside>
          <h2 className="text-caption font-semibold text-foreground">
            Percakapanmu
          </h2>
          {sessions.length === 0 ? (
            <p className="mt-3 text-caption text-muted-foreground">
              Belum ada. Mulai dari pertanyaan pertamamu.
            </p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {sessions.map((session) => (
                <li key={session.id} className="flex items-center gap-1.5">
                  <Link
                    href={`/assistant?sesi=${session.id}`}
                    className={cn(
                      "min-w-0 flex-1 truncate rounded-field px-3 py-2 text-caption transition-colors",
                      session.id === active
                        ? "bg-surface-muted text-primary"
                        : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
                    )}
                  >
                    {session.title ?? relativeTime(session.created_at)}
                  </Link>
                  <form action={deleteConversation}>
                    <input type="hidden" name="sessionId" value={session.id} />
                    <button
                      type="submit"
                      aria-label="Hapus percakapan"
                      className="flex size-8 items-center justify-center rounded-field text-muted-foreground transition-colors hover:bg-surface-muted hover:text-danger"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <div className="min-w-0">
          {active ? (
            <AssistantChat
              key={active}
              sessionId={active}
              initialMessages={messages}
              remaining={remaining}
            />
          ) : (
            <div className="rounded-panel border border-border bg-surface p-8 text-center">
              <p className="text-body text-muted-foreground">
                Mulai percakapan baru untuk bertanya.
              </p>
              <form action={startConversation} className="mt-5">
                <Button type="submit">
                  <MessageSquarePlus aria-hidden />
                  Mulai
                </Button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
