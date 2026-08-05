import type { Metadata } from "next";
import Link from "next/link";
import { ClipboardList, ExternalLink, ShieldCheck } from "lucide-react";
import {
  getModerationQueue,
  getPendingSubmissions,
  getQueueTargets,
} from "@/lib/admin/queries";
import { QueueCard } from "@/components/admin/queue-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Antrean moderasi" };

const KIND_LABEL = {
  lowongan: "Lowongan",
  artikel: "Artikel",
  bisnis: "Bisnis",
  karya: "Karya",
} as const;

export default async function ModerationPage() {
  const [queue, pending] = await Promise.all([
    getModerationQueue(),
    getPendingSubmissions(),
  ]);
  const targets = await getQueueTargets(queue);

  return (
    <div>
      <h2 className="text-h3 text-foreground">Antrean moderasi</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Laporan dari anggota dan tanda dari filter otomatis dikumpulkan di satu
        tempat. Menutup laporan tanpa menghapus konten tetap tercatat.
      </p>

      <section className="mt-8">
        <h3 className="flex items-center gap-2 text-body font-semibold text-foreground">
          <ClipboardList className="size-4.5 text-accent" aria-hidden />
          Menunggu persetujuan ({pending.length})
        </h3>
        <p className="mt-1.5 text-caption text-muted-foreground">
          Kiriman yang tertahan di gerbang tinjauan — lowongan, artikel,
          bisnis, dan karya kreatif. Setujui dari halamannya masing-masing.
        </p>
        {pending.length === 0 ? (
          <p className="mt-4 rounded-field border border-border bg-surface px-4 py-3 text-caption text-muted-foreground">
            Tidak ada kiriman yang menunggu persetujuan.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {pending.map((item) => (
              <li
                key={`${item.kind}-${item.id}`}
                className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
              >
                <span className="rounded-pill border border-accent/40 bg-accent-muted/30 px-2.5 py-1 text-caption font-medium text-foreground">
                  {KIND_LABEL[item.kind]}
                </span>
                <span className="min-w-0 flex-1 truncate text-body text-foreground">
                  {item.title}
                </span>
                {item.submitter && (
                  <span className="text-caption text-muted-foreground">
                    oleh {item.submitter}
                  </span>
                )}
                <Link
                  href={item.href}
                  className="flex items-center gap-1.5 text-caption font-medium text-primary transition-colors hover:text-accent"
                >
                  Tinjau
                  <ExternalLink className="size-3.5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <h3 className="mt-10 text-body font-semibold text-foreground">
        Laporan &amp; tanda otomatis
      </h3>
      {queue.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={ShieldCheck}
            title="Antrean bersih"
            description="Tidak ada laporan atau tanda otomatis yang menunggu. Kerja bagus!"
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {queue.map((item) => (
            <QueueCard
              key={`${item.kind}-${item.id}`}
              item={item}
              target={targets[item.contentId]}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
