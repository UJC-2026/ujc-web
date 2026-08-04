"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { createBoardReply } from "@/app/(app)/dashboard/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      {pending ? "Mengirim…" : "Balas"}
    </Button>
  );
}

export function BoardReplyForm({ boardId }: { boardId: string }) {
  const [error, setError] = useState<string>();
  // Remounting the textarea is how the draft gets cleared after a send.
  const [key, setKey] = useState(0);

  async function handleSubmit(formData: FormData) {
    const result = await createBoardReply({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setKey((value) => value + 1);
    toast.success(result.success);
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <input type="hidden" name="boardId" value={boardId} />

      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}

      <Textarea
        key={key}
        name="content"
        rows={2}
        required
        minLength={2}
        maxLength={2000}
        placeholder="Tulis balasan…"
        aria-label="Balasan papan internal"
      />
      <SubmitButton />
    </form>
  );
}
