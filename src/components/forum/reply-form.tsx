"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { createReply } from "@/app/(app)/forum/actions";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} size="sm">
      {pending ? "Mengirim…" : label}
    </Button>
  );
}

export function ReplyForm({
  threadId,
  parentReplyId = null,
  placeholder = "Tulis balasanmu…",
  submitLabel = "Kirim balasan",
  onDone,
  autoFocusKey,
}: {
  threadId: string;
  parentReplyId?: string | null;
  placeholder?: string;
  submitLabel?: string;
  onDone?: () => void;
  autoFocusKey?: string;
}) {
  const [error, setError] = useState<string>();
  // Bumping this remounts the editor, which is how the draft gets cleared
  // after a successful post.
  const [editorKey, setEditorKey] = useState(0);

  async function handleSubmit(formData: FormData) {
    const result = await createReply({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setEditorKey((key) => key + 1);
    toast.success(result.success);
    onDone?.();
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <input type="hidden" name="threadId" value={threadId} />
      {parentReplyId && (
        <input type="hidden" name="parentReplyId" value={parentReplyId} />
      )}

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <RichTextEditor
        key={`${autoFocusKey ?? "root"}-${editorKey}`}
        name="content"
        placeholder={placeholder}
        minHeight="6rem"
      />

      <div className="flex items-center gap-2">
        <SubmitButton label={submitLabel} />
        {onDone && (
          <Button type="button" variant="ghost" size="sm" onClick={onDone}>
            Batal
          </Button>
        )}
      </div>
    </form>
  );
}
