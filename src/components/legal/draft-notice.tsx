import { FileWarning } from "lucide-react";

/**
 * Marks a legal page as not yet reviewed by the organisation.
 *
 * These pages describe how UJC actually handles member data — which the code
 * can state truthfully — but the parts that are a legal commitment (contact,
 * retention, jurisdiction) are the organisation's to decide. Showing that
 * plainly is safer than a polished page that reads as binding while nobody
 * has agreed to it.
 */
export function DraftNotice({ children }: { children: React.ReactNode }) {
  return (
    <aside
      role="note"
      className="flex items-start gap-3 rounded-panel border border-danger/40 bg-danger/8 px-5 py-4"
    >
      <FileWarning className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
      <div className="text-caption text-foreground">
        <p className="font-semibold">Draf — belum ditinjau pengurus</p>
        <p className="mt-1 text-muted-foreground">{children}</p>
      </div>
    </aside>
  );
}

/** Inline placeholder for a fact only the organisation can supply. */
export function ToFill({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-accent-muted px-1.5 py-0.5 text-foreground">
      [{children}]
    </mark>
  );
}
