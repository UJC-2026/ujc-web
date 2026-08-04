"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Check, HelpCircle, X } from "lucide-react";
import { setRsvp } from "@/app/(app)/events/actions";
import { type RsvpStatus } from "@/lib/events/types";
import { cn } from "@/lib/utils";

const OPTIONS: { status: RsvpStatus; label: string; icon: typeof Check }[] = [
  { status: "hadir", label: "Hadir", icon: Check },
  { status: "mungkin", label: "Mungkin", icon: HelpCircle },
  { status: "tidak", label: "Tidak bisa", icon: X },
];

function OptionButton({
  status,
  label,
  icon: Icon,
  current,
}: {
  status: RsvpStatus;
  label: string;
  icon: typeof Check;
  current: RsvpStatus | null;
}) {
  const { pending } = useFormStatus();
  const active = current === status;

  return (
    <button
      type="submit"
      name="status"
      value={status}
      disabled={pending}
      aria-pressed={active}
      className={cn(
        "flex flex-1 items-center justify-center gap-2 rounded-field border px-4 py-2.5 text-caption font-medium transition-all",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none",
        "active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border text-muted-foreground hover:border-accent hover:text-primary",
      )}
    >
      <Icon className="size-4" aria-hidden />
      {label}
    </button>
  );
}

export function RsvpControls({
  eventId,
  initialStatus,
  disabled = false,
  disabledReason,
}: {
  eventId: string;
  initialStatus: RsvpStatus | null;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const chosen = formData.get("status") as RsvpStatus;
    const result = await setRsvp({}, formData);

    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setStatus(chosen);
    toast.success(result.success);
  }

  if (disabled) {
    return (
      <p className="rounded-field border border-border bg-surface-muted px-4 py-3 text-caption text-muted-foreground">
        {disabledReason}
      </p>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3">
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

      <div role="group" aria-label="Konfirmasi kehadiran" className="flex gap-2">
        {OPTIONS.map((option) => (
          <OptionButton key={option.status} {...option} current={status} />
        ))}
      </div>
    </form>
  );
}
