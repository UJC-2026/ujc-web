import { ShieldCheck, ShieldX } from "lucide-react";
import { verifyBusiness } from "@/app/(app)/business/actions";

/** Moderator-only; RLS and the guard trigger are the real gates. */
export function VerifyBusiness({
  businessId,
  verified,
}: {
  businessId: string;
  verified: boolean;
}) {
  return (
    <form action={verifyBusiness}>
      <input type="hidden" name="businessId" value={businessId} />
      <input type="hidden" name="verified" value={String(verified)} />
      <button
        type="submit"
        className="flex items-center gap-1.5 rounded-field border border-border px-3 py-1.5 text-caption font-medium text-muted-foreground transition-colors hover:border-accent hover:text-primary"
      >
        {verified ? (
          <>
            <ShieldX className="size-3.5" aria-hidden />
            Cabut verifikasi
          </>
        ) : (
          <>
            <ShieldCheck className="size-3.5" aria-hidden />
            Verifikasi
          </>
        )}
      </button>
    </form>
  );
}
