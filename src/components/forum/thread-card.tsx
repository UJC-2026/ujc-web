import Link from "next/link";
import { ArrowBigUp, Eye, MessageSquare, Pin } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { richTextToPlain } from "@/lib/sanitize";
import { relativeTime } from "@/lib/format";
import type { ForumThread } from "@/lib/forum/types";

export function ThreadCard({
  thread,
  categorySlug,
}: {
  thread: ForumThread;
  categorySlug: string;
}) {
  const preview = richTextToPlain(thread.content, 160);

  return (
    <article className="relative rounded-card border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent">
      <div className="flex items-center gap-2.5">
        <Avatar
          src={thread.author?.avatar_url}
          name={thread.author?.full_name ?? "Anggota"}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-caption font-medium text-foreground">
            {thread.author?.full_name ?? "Anggota UJC"}
          </p>
          <p className="text-caption text-muted-foreground">
            {relativeTime(thread.created_at)}
          </p>
        </div>
        {thread.is_pinned && (
          <Badge variant="accent">
            <Pin aria-hidden />
            Disematkan
          </Badge>
        )}
      </div>

      <h2 className="mt-3.5 text-h3 font-medium text-foreground">
        <Link
          href={`/forum/${categorySlug}/${thread.id}`}
          className="transition-colors hover:text-primary focus-visible:text-primary"
        >
          {/* stretches the click target across the whole card */}
          <span className="absolute inset-0" aria-hidden />
          {thread.title}
        </Link>
      </h2>

      {preview && (
        <p className="mt-2 line-clamp-2 text-body text-muted-foreground">
          {preview}
        </p>
      )}

      {thread.tags.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {thread.tags.map((tag) => (
            <li key={tag}>
              <Badge variant="outline">#{tag}</Badge>
            </li>
          ))}
        </ul>
      )}

      <dl className="mt-4 flex flex-wrap items-center gap-5 text-caption text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ArrowBigUp className="size-4" aria-hidden />
          <dt className="sr-only">Skor</dt>
          <dd>{thread.score}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageSquare className="size-4" aria-hidden />
          <dt className="sr-only">Balasan</dt>
          <dd>{thread.reply_count}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <Eye className="size-4" aria-hidden />
          <dt className="sr-only">Dilihat</dt>
          <dd>{thread.view_count}</dd>
        </div>
      </dl>
    </article>
  );
}
