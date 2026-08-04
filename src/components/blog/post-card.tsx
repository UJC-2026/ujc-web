import Link from "next/link";
import { Heart, MessageSquare } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { richTextToPlain } from "@/lib/sanitize";
import { relativeTime } from "@/lib/format";
import type { BlogPost } from "@/lib/blog/queries";

const STATUS = {
  draft: { label: "Draf", variant: "outline" as const },
  ditinjau: { label: "Menunggu tinjauan", variant: "danger" as const },
  terbit: null,
};

export function PostCard({ post }: { post: BlogPost }) {
  const badge = STATUS[post.status];
  const preview = richTextToPlain(post.content, 180);

  return (
    <article className="relative rounded-card border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent">
      <div className="flex flex-wrap items-center gap-1.5">
        {badge && <Badge variant={badge.variant}>{badge.label}</Badge>}
        {post.category && <Badge variant="outline">{post.category}</Badge>}
      </div>

      <h2 className="mt-3 text-h3 font-medium text-foreground">
        <Link href={`/blog/${post.slug}`}>
          <span className="absolute inset-0" aria-hidden />
          {post.title}
        </Link>
      </h2>

      {preview && (
        <p className="mt-2 line-clamp-2 text-body text-muted-foreground">{preview}</p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-2">
          <Avatar
            src={post.author?.avatar_url}
            name={post.author?.full_name ?? "Anggota"}
            size="sm"
          />
          <span className="text-caption text-muted-foreground">
            {post.author?.full_name ?? "Anggota UJC"} ·{" "}
            {relativeTime(post.published_at ?? post.created_at)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-caption text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Heart className="size-4" aria-hidden />
            {post.likeCount}
          </span>
          <span className="flex items-center gap-1.5">
            <MessageSquare className="size-4" aria-hidden />
            {post.commentCount}
          </span>
        </div>
      </div>
    </article>
  );
}
