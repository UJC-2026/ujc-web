"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Keeps the create forms out of the way until needed, so a panel still reads
 * as a list first and a form second.
 */
export function CollapsibleForm({
  openLabel,
  title,
  children,
}: {
  openLabel: string;
  title: string;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {openLabel}
      </Button>
    );
  }

  return (
    <section className="rounded-panel border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-body font-medium text-foreground">{title}</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Tutup formulir"
          className="flex size-8 items-center justify-center rounded-field text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="mt-5">{children(() => setOpen(false))}</div>
    </section>
  );
}
