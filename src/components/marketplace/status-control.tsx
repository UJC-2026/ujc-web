import { updateItemStatus } from "@/app/(app)/marketplace/actions";
import type { ItemStatus } from "@/lib/marketplace/queries";

const OPTIONS: { value: ItemStatus; label: string }[] = [
  { value: "tersedia", label: "Masih tersedia" },
  { value: "dipesan", label: "Sudah dipesan" },
  { value: "terjual", label: "Sudah terjual" },
];

/** Plain form + server action, so it works without JS. RLS limits it to the seller. */
export function StatusControl({
  itemId,
  status,
}: {
  itemId: string;
  status: ItemStatus;
}) {
  return (
    <form action={updateItemStatus} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="itemId" value={itemId} />
      <label className="sr-only" htmlFor={`item-status-${itemId}`}>
        Status barang
      </label>
      <select
        id={`item-status-${itemId}`}
        name="status"
        defaultValue={status}
        className="h-10 rounded-field border border-border bg-surface px-3 text-caption text-foreground transition-colors hover:border-border-strong focus-visible:border-primary"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        type="submit"
        className="rounded-field border border-border px-3.5 py-2 text-caption font-medium text-muted-foreground transition-colors hover:border-accent hover:text-primary"
      >
        Perbarui
      </button>
    </form>
  );
}
