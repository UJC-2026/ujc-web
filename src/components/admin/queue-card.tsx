"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Bot, ExternalLink, Flag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";
import { resolveQueueItem } from "@/app/(app)/admin/actions";
import type { QueueItem } from "@/lib/admin/queries";

const REASON_LABEL: Record<string, string> = {
  scam: "Penipuan",
  provokatif: "Provokatif",
  dewasa: "Konten dewasa",
  judol: "Judi online",
  lainnya: "Lainnya",
};

function DecisionButton({
  decision,
  children,
  variant,
}: {
  decision: "tolak" | "hapus";
  children: React.ReactNode;
  variant: "outline" | "danger";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name="decision"
      value={decision}
      variant={variant}
      size="sm"
      disabled={pending}
    >
      {children}
    </Button>
  );
}

export function QueueCard({
  item,
  target,
}: {
  item: QueueItem;
  target?: { title: string; href: string | null };
}) {
  const [error, setError] = useState<string>();
  const [resolved, setResolved] = useState(false);

  async function handleSubmit(formData: FormData) {
    const result = await resolveQueueItem({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success);
    // Keeps the card out of the way until the revalidated list arrives.
    setResolved(true);
  }

  if (resolved) return null;

  return (
    <li className="rounded-card border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        {item.kind === "flag" ? (
          <Badge variant="accent">
            <Bot aria-hidden />
            Filter otomatis
          </Badge>
        ) : (
          <Badge variant="danger">
            <Flag aria-hidden />
            Dilaporkan anggota
          </Badge>
        )}
        <Badge variant="outline">
          {item.contentType === "thread" ? "Thread" : "Balasan"}
        </Badge>
        <span className="text-caption text-muted-foreground">
          {relativeTime(item.createdAt)}
        </span>
      </div>

      <h3 className="mt-3 text-body font-medium text-foreground">
        {target?.title ?? "Konten sudah tidak ada"}
      </h3>

      <p className="mt-2 text-caption text-muted-foreground">
        <span className="font-medium text-foreground">Alasan: </span>
        {item.kind === "flag"
          ? (REASON_LABEL[item.reason] ?? item.reason)
          : item.reason}
        {item.reporterName && ` — dilaporkan oleh ${item.reporterName}`}
      </p>

      {target?.href && (
        <Link
          href={target.href}
          target="_blank"
          className="mt-3 inline-flex items-center gap-1.5 text-caption font-medium text-primary transition-colors hover:text-accent"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Lihat konten
        </Link>
      )}

      {error && (
        <p
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <form action={handleSubmit} className="mt-4 flex flex-wrap gap-2">
        <input type="hidden" name="kind" value={item.kind} />
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="contentType" value={item.contentType} />
        <input type="hidden" name="contentId" value={item.contentId} />

        <DecisionButton decision="tolak" variant="outline">
          Biarkan &amp; tutup
        </DecisionButton>
        <DecisionButton decision="hapus" variant="danger">
          Hapus konten
        </DecisionButton>
      </form>
    </li>
  );
}
