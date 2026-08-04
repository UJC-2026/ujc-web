import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { getModerationQueue, getQueueTargets } from "@/lib/admin/queries";
import { QueueCard } from "@/components/admin/queue-card";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Antrean moderasi" };

export default async function ModerationPage() {
  const queue = await getModerationQueue();
  const targets = await getQueueTargets(queue);

  return (
    <div>
      <h2 className="text-h3 text-foreground">Antrean moderasi</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Laporan dari anggota dan tanda dari filter otomatis dikumpulkan di satu
        tempat. Menutup laporan tanpa menghapus konten tetap tercatat.
      </p>

      {queue.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            icon={ShieldCheck}
            title="Antrean bersih"
            description="Tidak ada laporan atau tanda otomatis yang menunggu. Kerja bagus!"
          />
        </div>
      ) : (
        <ul className="mt-7 space-y-4">
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
