import { ShieldCheck, ShieldX } from "lucide-react";
import { verifyJob } from "@/app/(app)/jobs/actions";

/** Moderator-only; RLS is the real gate. */
export function VerifyControl({
  jobId,
  verified,
}: {
  jobId: string;
  verified: boolean;
}) {
  return (
    <form action={verifyJob}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="verified" value={String(verified)} />
      <button
        type="submit"
        className="flex items-center gap-2 rounded-field border border-border bg-surface px-3.5 py-2.5 text-caption font-medium text-muted-foreground transition-colors hover:border-accent hover:text-primary"
      >
        {verified ? (
          <>
            <ShieldX className="size-4" aria-hidden />
            Cabut verifikasi
          </>
        ) : (
          <>
            <ShieldCheck className="size-4" aria-hidden />
            Verifikasi &amp; terbitkan
          </>
        )}
      </button>
    </form>
  );
}
