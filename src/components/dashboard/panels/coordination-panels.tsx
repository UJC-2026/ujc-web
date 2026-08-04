import Link from "next/link";
import { CalendarDays, MessagesSquare, Pin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTimeID, relativeTime } from "@/lib/format";
import { BoardPostForm, CalendarEntryForm } from "../forms";
import { BoardReplyForm } from "../board-reply-form";
import type { BoardPost, CalendarEntry } from "@/lib/dashboard/queries";
import { cn } from "@/lib/utils";

export function PapanPanel({ posts }: { posts: BoardPost[] }) {
  return (
    <div>
      <h2 className="text-h3 text-foreground">Papan internal</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Ruang koordinasi khusus pengurus, terpisah dari forum anggota. Tempat
        yang tepat kalau kamu butuh bantuan divisi lain.
      </p>

      <div className="mt-5">
        <BoardPostForm />
      </div>

      {posts.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={MessagesSquare}
            title="Papan masih kosong"
            description="Mulai obrolan pertama — misalnya minta bantuan untuk proker yang tenggatnya dekat."
          />
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {posts.map((post) => (
            <li
              key={post.id}
              className={cn(
                "rounded-card border bg-surface p-5",
                post.is_pinned ? "border-accent/50" : "border-border",
              )}
            >
              {post.is_pinned && (
                <Badge variant="accent" className="mb-3">
                  <Pin aria-hidden />
                  Disematkan
                </Badge>
              )}

              <div className="flex items-center gap-2.5">
                <Avatar
                  src={post.author?.avatar_url}
                  name={post.author?.full_name ?? "Pengurus"}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="truncate text-caption font-medium text-foreground">
                    {post.author?.full_name ?? "Pengurus"}
                  </p>
                  <p className="text-caption text-muted-foreground">
                    {relativeTime(post.created_at)}
                  </p>
                </div>
              </div>

              <h3 className="mt-3 text-body font-medium text-foreground">
                {post.title}
              </h3>
              <p className="mt-1.5 text-body whitespace-pre-line text-muted-foreground">
                {post.content}
              </p>

              {post.replies.length > 0 && (
                <ul className="mt-4 space-y-3 border-l-2 border-border pl-4">
                  {post.replies.map((reply) => (
                    <li key={reply.id}>
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={reply.author?.avatar_url}
                          name={reply.author?.full_name ?? "Pengurus"}
                          size="sm"
                        />
                        <p className="text-caption font-medium text-foreground">
                          {reply.author?.full_name ?? "Pengurus"}
                        </p>
                        <span className="text-caption text-muted-foreground">
                          {relativeTime(reply.created_at)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-body whitespace-pre-line text-muted-foreground">
                        {reply.content}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4">
                <BoardReplyForm boardId={post.id} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const KIND_LABEL: Record<CalendarEntry["kind"], string> = {
  rapat: "Rapat",
  event: "Kegiatan",
  deadline: "Tenggat",
  penting: "Penting",
  proker: "Tenggat proker",
  tugas: "Tenggat tugas",
};

const KIND_VARIANT: Record<
  CalendarEntry["kind"],
  "primary" | "accent" | "danger" | "outline" | "neutral"
> = {
  rapat: "primary",
  event: "accent",
  deadline: "danger",
  penting: "danger",
  proker: "outline",
  tugas: "neutral",
};

export function KalenderPanel({ entries }: { entries: CalendarEntry[] }) {
  // Group by calendar day so the list reads like an agenda.
  const groups = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const key = entry.at.slice(0, 10);
    const list = groups.get(key) ?? [];
    list.push(entry);
    groups.set(key, list);
  }

  return (
    <div>
      <h2 className="text-h3 text-foreground">Kalender terpadu</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Rapat, kegiatan, tenggat proker, dan tenggat tugas dalam satu agenda —
        tanggal yang sudah ada di tempat lain tidak perlu diisi ulang.
      </p>

      <div className="mt-5">
        <CalendarEntryForm />
      </div>

      {entries.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            icon={CalendarDays}
            title="Belum ada agenda"
            description="Tambahkan rapat atau tanggal penting, atau buat proker dengan tenggat supaya muncul di sini."
          />
        </div>
      ) : (
        <div className="mt-8 space-y-7">
          {[...groups].map(([day, items]) => (
            <section key={day}>
              <h3 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
                {new Intl.DateTimeFormat("id-ID", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }).format(new Date(day))}
              </h3>

              <ul className="mt-3 space-y-2.5">
                {items.map((entry) => (
                    <li
                      key={entry.id}
                      className={cn(
                        "flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3",
                        entry.isPast && "opacity-60",
                      )}
                    >
                      <Badge variant={KIND_VARIANT[entry.kind]}>
                        {KIND_LABEL[entry.kind]}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body text-foreground">
                          {entry.href ? (
                            <Link
                              href={entry.href}
                              className="transition-colors hover:text-primary"
                            >
                              {entry.title}
                            </Link>
                          ) : (
                            entry.title
                          )}
                        </p>
                        <p className="text-caption text-muted-foreground">
                          {formatDateTimeID(entry.at)}
                          {entry.detail && ` · ${entry.detail}`}
                        </p>
                      </div>
                    </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
