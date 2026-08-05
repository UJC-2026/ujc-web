"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { setCheckinCode } from "@/app/(app)/events/checkin-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function Submit({ hasCode }: { hasCode: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" loading={pending}>
      {hasCode ? "Ganti kode" : "Buka absensi"}
    </Button>
  );
}

export function CheckinCodeForm({
  eventId,
  currentCode,
}: {
  eventId: string;
  currentCode: string | null;
}) {
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await setCheckinCode({}, formData);

    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success);
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Field
        label="Kode kehadiran"
        htmlFor="code"
        hint={
          currentCode
            ? "Mengganti kode membuat QR lama tidak berlaku lagi."
            : "4–24 karakter. Anggota memasukkan kode ini, atau memindai QR-nya."
        }
      >
        <Input
          id="code"
          name="code"
          required
          minLength={4}
          maxLength={24}
          autoComplete="off"
          defaultValue={currentCode ?? ""}
          placeholder="Contoh: KOPDAR26"
        />
      </Field>

      <Submit hasCode={!!currentCode} />
    </form>
  );
}
