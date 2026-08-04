"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { setPostStatus } from "@/app/(app)/blog/actions";
import type { PublishStatus } from "@/lib/blog/queries";

/** Pengurus/moderator only; the DB guard trigger is the real gate. */
export function PublishControl({
  postId,
  status,
}: {
  postId: string;
  status: PublishStatus;
}) {
  const [busy, setBusy] = useState(false);

  async function apply(next: PublishStatus) {
    setBusy(true);
    const data = new FormData();
    data.set("postId", postId);
    data.set("status", next);
    const result = await setPostStatus({}, data);
    setBusy(false);
    if (result.error) toast.error(result.error);
    else toast.success(result.success);
  }

  return (
    <div className="ml-auto flex flex-wrap gap-2">
      {status !== "terbit" ? (
        <Button size="sm" disabled={busy} onClick={() => apply("terbit")}>
          Terbitkan
        </Button>
      ) : (
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => apply("ditinjau")}
        >
          Tarik dari publik
        </Button>
      )}
    </div>
  );
}
