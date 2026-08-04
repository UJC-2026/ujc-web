"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reviewPeduliCase } from "@/app/(app)/peduli/actions";
import type { PeduliStatus } from "@/lib/peduli/queries";

type Decision = "terbitkan" | "sembunyikan" | "mulai" | "tuntaskan";

function DecisionButton({
  decision,
  label,
  variant,
  confirm,
}: {
  decision: Decision;
  label: string;
  variant: "primary" | "outline" | "danger";
  confirm?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      name="decision"
      value={decision}
      size="sm"
      variant={variant === "primary" ? undefined : variant}
      disabled={pending}
      onClick={(event) => {
        // Publishing exposes a private hardship to the whole community, so it
        // asks once before going through.
        if (confirm && !window.confirm(confirm)) event.preventDefault();
      }}
    >
      {label}
    </Button>
  );
}

export function PeduliReviewActions({
  caseId,
  status,
  isPublic,
}: {
  caseId: string;
  status: PeduliStatus;
  isPublic: boolean;
}) {
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await reviewPeduliCase({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success);
  }

  return (
    <form action={handleSubmit} className="space-y-2">
      <input type="hidden" name="caseId" value={caseId} />

      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {!isPublic && (
          <DecisionButton
            decision="terbitkan"
            label="Terbitkan ke anggota"
            variant="primary"
            confirm="Setelah diterbitkan, cerita ini terlihat semua anggota. Pastikan pengaju sudah setuju. Lanjutkan?"
          />
        )}

        {isPublic && status !== "selesai" && (
          <DecisionButton
            decision="sembunyikan"
            label="Sembunyikan lagi"
            variant="outline"
          />
        )}

        {isPublic && status === "diverifikasi" && (
          <DecisionButton decision="mulai" label="Tandai berjalan" variant="outline" />
        )}

        {status !== "selesai" && status !== "pengajuan" && (
          <DecisionButton
            decision="tuntaskan"
            label="Tandai selesai"
            variant="outline"
          />
        )}
      </div>
    </form>
  );
}
