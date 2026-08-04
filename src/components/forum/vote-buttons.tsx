import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { toggleVote } from "@/app/(app)/forum/actions";
import { cn } from "@/lib/utils";

/**
 * Server-action driven so voting still works without JS. Each arrow is its own
 * form; clicking the arrow you already picked clears the vote.
 */
export function VoteButtons({
  score,
  currentVote,
  threadId,
  replyId,
  path,
  orientation = "vertical",
  disabled = false,
}: {
  score: number;
  currentVote?: "up" | "down";
  threadId?: string;
  replyId?: string;
  path: string;
  orientation?: "vertical" | "horizontal";
  disabled?: boolean;
}) {
  const buttonClass = (active: boolean) =>
    cn(
      "flex size-8 items-center justify-center rounded-field transition-colors",
      active
        ? "bg-accent-muted text-gold-600 dark:text-accent"
        : "text-muted-foreground hover:bg-surface-muted hover:text-primary",
      disabled && "pointer-events-none opacity-50",
    );

  const hidden = (
    <>
      {threadId && <input type="hidden" name="threadId" value={threadId} />}
      {replyId && <input type="hidden" name="replyId" value={replyId} />}
      <input type="hidden" name="path" value={path} />
    </>
  );

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        orientation === "vertical" && "flex-col",
      )}
    >
      <form action={toggleVote}>
        {hidden}
        <input type="hidden" name="vote" value="up" />
        <button
          type="submit"
          aria-label="Suka"
          aria-pressed={currentVote === "up"}
          disabled={disabled}
          className={buttonClass(currentVote === "up")}
        >
          <ArrowBigUp className="size-5" aria-hidden />
        </button>
      </form>

      <span
        className={cn(
          "min-w-6 text-center text-caption font-semibold tabular-nums",
          currentVote ? "text-accent" : "text-foreground",
        )}
      >
        {score}
      </span>

      <form action={toggleVote}>
        {hidden}
        <input type="hidden" name="vote" value="down" />
        <button
          type="submit"
          aria-label="Tidak suka"
          aria-pressed={currentVote === "down"}
          disabled={disabled}
          className={buttonClass(currentVote === "down")}
        >
          <ArrowBigDown className="size-5" aria-hidden />
        </button>
      </form>
    </div>
  );
}
