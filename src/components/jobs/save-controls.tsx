import { Bookmark, BookmarkX, Check } from "lucide-react";
import { toggleJobSave } from "@/app/(app)/jobs/actions";
import type { SaveStatus } from "@/lib/jobs/queries";
import { cn } from "@/lib/utils";

const BTN =
  "flex items-center gap-2 rounded-field border px-3.5 py-2.5 text-caption font-medium transition-colors";

/** Plain forms + server action, so this works without JS. */
export function SaveControls({
  jobId,
  current,
}: {
  jobId: string;
  current?: SaveStatus;
}) {
  const button = (
    status: "disimpan" | "dilamar" | "hapus",
    label: string,
    icon: React.ReactNode,
    active: boolean,
  ) => (
    <form action={toggleJobSave}>
      <input type="hidden" name="jobId" value={jobId} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        aria-pressed={status !== "hapus" ? active : undefined}
        className={cn(
          BTN,
          active
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-muted-foreground hover:border-accent hover:text-primary",
        )}
      >
        {icon}
        {label}
      </button>
    </form>
  );

  return (
    <div className="flex flex-wrap gap-2">
      {button(
        "disimpan",
        "Simpan",
        <Bookmark className="size-4" aria-hidden />,
        current === "disimpan",
      )}
      {button(
        "dilamar",
        "Sudah dilamar",
        <Check className="size-4" aria-hidden />,
        current === "dilamar",
      )}
      {current &&
        button(
          "hapus",
          "Hapus tanda",
          <BookmarkX className="size-4" aria-hidden />,
          false,
        )}
    </div>
  );
}
