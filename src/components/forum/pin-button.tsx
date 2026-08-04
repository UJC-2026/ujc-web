import { Pin, PinOff } from "lucide-react";
import { togglePin } from "@/app/(app)/forum/actions";

/** Moderator control. RLS is the real gate; this only hides the affordance. */
export function PinButton({
  threadId,
  pinned,
  path,
}: {
  threadId: string;
  pinned: boolean;
  path: string;
}) {
  return (
    <form action={togglePin}>
      <input type="hidden" name="threadId" value={threadId} />
      <input type="hidden" name="pinned" value={String(pinned)} />
      <input type="hidden" name="path" value={path} />
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-caption text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary"
      >
        {pinned ? (
          <>
            <PinOff className="size-3.5" aria-hidden />
            Lepas sematan
          </>
        ) : (
          <>
            <Pin className="size-3.5" aria-hidden />
            Sematkan
          </>
        )}
      </button>
    </form>
  );
}
