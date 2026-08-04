import Link from "next/link";
import {
  CalendarCheck,
  MessageSquare,
  Reply,
  Star,
  Trophy,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/format";
import type {
  ActivityItem,
  LeaderboardRow,
  MemberSummary,
} from "@/lib/dashboard/queries";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function RingkasanPanel({
  summary,
  name,
  leaderboard,
  meId,
}: {
  summary: MemberSummary;
  name: string;
  leaderboard: LeaderboardRow[];
  meId: string;
}) {
  // Progress toward the next 100-point level.
  const intoLevel = summary.points % 100;

  const tiles = [
    { icon: Star, label: "Poin", value: summary.points },
    { icon: Trophy, label: "Level", value: summary.level },
    { icon: MessageSquare, label: "Thread dibuat", value: summary.threads },
    { icon: Reply, label: "Balasan ditulis", value: summary.replies },
    { icon: CalendarCheck, label: "Kegiatan diikuti", value: summary.eventsJoined },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-h3 text-foreground">Halo, {name.split(" ")[0]}</h2>
        <p className="mt-2 text-body text-muted-foreground">
          Ini ringkasan aktivitasmu di UJC sejauh ini.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-5">
            <span className="flex size-10 items-center justify-center rounded-field bg-surface-muted text-primary">
              <tile.icon className="size-5" aria-hidden />
            </span>
            <p className="mt-4 text-caption text-muted-foreground">
              {tile.label}
            </p>
            <p className="mt-1 text-h2 font-semibold tabular-nums text-foreground">
              {tile.value.toLocaleString("id-ID")}
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-caption font-medium text-foreground">
            Menuju level {summary.level + 1}
          </p>
          <p className="text-caption tabular-nums text-muted-foreground">
            {intoLevel}/100 poin
          </p>
        </div>
        <div
          className="mt-3 h-2.5 overflow-hidden rounded-pill bg-surface-muted"
          role="progressbar"
          aria-valuenow={intoLevel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Kemajuan menuju level ${summary.level + 1}`}
        >
          <span
            className="block h-full rounded-pill bg-accent"
            style={{ width: `${intoLevel}%` }}
          />
        </div>
        <p className="mt-3 text-caption text-muted-foreground">
          Kumpulkan poin dengan ikut diskusi forum, mengerjakan latihan CBT, dan
          hadir di kegiatan komunitas.
        </p>
      </Card>

      {leaderboard.length > 0 && (
        <section>
          <h3 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
            Papan peringkat bulan ini
          </h3>
          <ol className="mt-3 space-y-2">
            {leaderboard.slice(0, 10).map((row, index) => {
              const isMe = row.user_id === meId;
              return (
                <li
                  key={row.user_id}
                  className={cn(
                    "flex items-center gap-3 rounded-card border px-4 py-2.5",
                    isMe
                      ? "border-accent bg-accent-muted/40"
                      : "border-border bg-surface",
                  )}
                >
                  <span className="w-6 shrink-0 text-caption font-semibold tabular-nums text-muted-foreground">
                    {index + 1}
                  </span>
                  <Avatar src={row.avatar_url} name={row.full_name} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-body text-foreground">
                    {row.full_name}
                    {isMe && (
                      <span className="ml-1.5 text-caption text-accent">(kamu)</span>
                    )}
                  </span>
                  <span className="text-caption font-medium tabular-nums text-accent">
                    {row.total_points.toLocaleString("id-ID")}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/forum/new">
          <Badge variant="outline">Mulai diskusi</Badge>
        </Link>
        <Link href="/events">
          <Badge variant="outline">Lihat kegiatan</Badge>
        </Link>
        <Link href="/profile">
          <Badge variant="outline">Edit profil</Badge>
        </Link>
      </div>
    </div>
  );
}

export function AktivitasPanel({ items }: { items: ActivityItem[] }) {
  return (
    <div>
      <h2 className="text-h3 text-foreground">Aktivitas terbaru</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Jejak diskusi yang kamu mulai dan balas.
      </p>

      {items.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            icon={MessageSquare}
            title="Belum ada aktivitas"
            description="Begitu kamu memulai atau membalas diskusi, jejaknya muncul di sini."
          />
        </div>
      ) : (
        <ul className="mt-7 space-y-3">
          {items.map((item) => (
            <li
              key={`${item.kind}-${item.id}`}
              className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-field bg-surface-muted text-primary">
                {item.kind === "thread" ? (
                  <MessageSquare className="size-4" aria-hidden />
                ) : (
                  <Reply className="size-4" aria-hidden />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-body text-foreground">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="transition-colors hover:text-primary"
                    >
                      {item.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                </p>
                <p className="text-caption text-muted-foreground">
                  {item.kind === "thread" ? "Kamu memulai diskusi" : "Kamu membalas"}
                  {" · "}
                  {relativeTime(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

