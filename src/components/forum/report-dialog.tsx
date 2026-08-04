"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { AlertCircle, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { reportContent } from "@/app/(app)/forum/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="danger" loading={pending}>
      {pending ? "Mengirim…" : "Kirim laporan"}
    </Button>
  );
}

export function ReportDialog({
  contentType,
  contentId,
}: {
  contentType: "thread" | "reply";
  contentId: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  // Handling the result here rather than in an effect means a repeat submit
  // still closes the dialog, even when the success message is identical.
  async function handleSubmit(formData: FormData) {
    const result = await reportContent({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success);
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger className="flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-caption text-muted-foreground transition-colors hover:bg-surface-muted hover:text-danger">
        <Flag className="size-3.5" aria-hidden />
        Laporkan
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-900/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(28rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-panel border border-border bg-surface p-6">
          <Dialog.Title className="text-h3 text-foreground">
            Laporkan konten ini
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-caption text-muted-foreground">
            Laporanmu masuk ke antrean moderasi dan hanya dilihat moderator.
            Identitasmu tidak ditampilkan ke penulis konten.
          </Dialog.Description>

          <form action={handleSubmit} className="mt-6 space-y-4">
            <input type="hidden" name="contentType" value={contentType} />
            <input type="hidden" name="contentId" value={contentId} />

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            <Field label="Alasan" htmlFor="reason">
              <Textarea
                id="reason"
                name="reason"
                required
                minLength={10}
                maxLength={500}
                placeholder="Contoh: konten ini menawarkan judi online / penipuan."
              />
            </Field>

            <div className="flex justify-end gap-3">
              <Dialog.Close asChild>
                <Button type="button" variant="ghost">
                  Batal
                </Button>
              </Dialog.Close>
              <SubmitButton />
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
