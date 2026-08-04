"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import * as Dialog from "@radix-ui/react-dialog";
import { toast } from "sonner";
import { AlertCircle, HandHeart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Textarea } from "@/components/ui/input";
import { requestMentoring } from "@/app/(app)/mentorship/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Mengirim…" : "Kirim permintaan"}
    </Button>
  );
}

export function RequestDialog({
  mentorId,
  mentorName,
}: {
  mentorId: string;
  mentorName: string;
}) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await requestMentoring({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success, { duration: 6000 });
    setOpen(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button size="sm">
          <HandHeart aria-hidden />
          Ajukan bimbingan
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-navy-900/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(32rem,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-panel border border-border bg-surface p-6">
          <Dialog.Title className="text-h3 text-foreground">
            Ajukan bimbingan ke {mentorName}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-caption text-muted-foreground">
            Ceritakan sedikit tentang situasimu dan apa yang ingin kamu
            pelajari. Mentor akan melihat pesan ini sebelum menjawab.
          </Dialog.Description>

          <form action={handleSubmit} className="mt-6 space-y-4">
            <input type="hidden" name="mentorId" value={mentorId} />

            {error && (
              <p
                role="alert"
                className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}

            <Field label="Pesan untuk mentor" htmlFor="message">
              <Textarea
                id="message"
                name="message"
                rows={5}
                required
                minLength={20}
                maxLength={1000}
                placeholder="Contoh: Saya baru 3 bulan di Nagoya, masih bingung urus perpanjangan visa sambil kerja shift…"
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
