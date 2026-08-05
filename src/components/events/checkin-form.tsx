"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, BadgeCheck, ScanLine } from "lucide-react";
import { checkinEvent } from "@/app/(app)/events/checkin-actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Mencatat…" : label}
    </Button>
  );
}

export function CheckinForm({
  eventId,
  /** Present when the member arrived by scanning the event's QR. */
  scannedCode,
}: {
  eventId: string;
  scannedCode?: string;
}) {
  const [error, setError] = useState<string>();
  const [certificate, setCertificate] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await checkinEvent({}, formData);

    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setCertificate(result.certificateNumber ?? "");
    toast.success(result.success, { duration: 7000 });
  }

  if (certificate !== undefined) {
    return <CheckedIn eventId={eventId} certificateNumber={certificate} />;
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="eventId" value={eventId} />
      {/* Distinguishes a scan from a typed code in the attendance record. */}
      <input
        type="hidden"
        name="method"
        value={scannedCode ? "qr" : "kode"}
      />

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      {scannedCode ? (
        <>
          <input type="hidden" name="code" value={scannedCode} />
          <p className="flex items-start gap-2 rounded-field border border-accent/40 bg-accent-muted/40 px-3.5 py-3 text-caption text-muted-foreground">
            <ScanLine className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
            Kode dari QR sudah terbaca. Tinggal konfirmasi kehadiranmu.
          </p>
        </>
      ) : (
        <Field
          label="Kode kehadiran"
          htmlFor="code"
          hint="Kode ditampilkan panitia di lokasi acara atau di ruang webinar."
        >
          <Input
            id="code"
            name="code"
            required
            autoComplete="off"
            placeholder="Contoh: KOPDAR26"
            className="uppercase"
          />
        </Field>
      )}

      <Submit label={scannedCode ? "Konfirmasi kehadiran" : "Catat kehadiran"} />
    </form>
  );
}

function CheckedIn({
  eventId,
  certificateNumber,
}: {
  eventId: string;
  certificateNumber: string;
}) {
  return (
    <div className="rounded-field border border-accent/40 bg-accent-muted/40 p-5">
      <p className="flex items-center gap-2 text-body font-medium text-foreground">
        <BadgeCheck className="size-5 shrink-0 text-primary" aria-hidden />
        Kehadiranmu tercatat
      </p>
      {certificateNumber && (
        <p className="mt-2 text-caption text-muted-foreground">
          Nomor e-sertifikat:{" "}
          <span className="font-medium text-foreground">{certificateNumber}</span>
        </p>
      )}
      <Button asChild variant="outline" className="mt-4">
        <Link href={`/events/${eventId}/sertifikat`}>Lihat e-sertifikat</Link>
      </Button>
    </div>
  );
}
