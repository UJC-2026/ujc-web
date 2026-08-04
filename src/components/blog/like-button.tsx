import { Heart } from "lucide-react";
import { toggleLike } from "@/app/(app)/blog/actions";
import { cn } from "@/lib/utils";

/** Plain form + server action, so liking works without JS. */
export function LikeButton({
  postId,
  slug,
  liked,
  count,
  canLike,
}: {
  postId: string;
  slug: string;
  liked: boolean;
  count: number;
  canLike: boolean;
}) {
  if (!canLike) {
    return (
      <span className="flex items-center gap-2 text-caption text-muted-foreground">
        <Heart className="size-4" aria-hidden />
        {count} suka
      </span>
    );
  }

  return (
    <form action={toggleLike}>
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="liked" value={String(liked)} />
      <button
        type="submit"
        aria-pressed={liked}
        className={cn(
          "flex items-center gap-2 rounded-pill border px-3.5 py-2 text-caption font-medium transition-colors",
          liked
            ? "border-accent bg-accent-muted text-gold-600 dark:text-accent"
            : "border-border text-muted-foreground hover:border-accent hover:text-primary",
        )}
      >
        <Heart className={cn("size-4", liked && "fill-current")} aria-hidden />
        {count} suka
      </button>
    </form>
  );
}
