import type { Metadata } from "next";
import { ScrollText } from "lucide-react";
import { getAuditLog } from "@/lib/admin/queries";
import { EmptyState } from "@/components/ui/empty-state";
import { RoleBadge } from "@/components/ui/badge";
import { formatDateTimeID, relativeTime } from "@/lib/format";

export const metadata: Metadata = { title: "Catatan tindakan" };

const ACTION_LABEL: Record<string, string> = {
  "forum.pin": "menyematkan thread",
  "forum.unpin": "melepas sematan thread",
  "moderasi.hapus": "menghapus konten yang dilaporkan",
  "moderasi.tolak": "menutup laporan tanpa menghapus",
  "anggota.ubah_peran": "mengubah peran anggota",
  "anggota.verifikasi": "memverifikasi anggota",
  "anggota.batal_verifikasi": "mencabut verifikasi anggota",
};

export default async function AuditPage() {
  const entries = await getAuditLog();

  return (
    <div>
      <h2 className="text-h3 text-foreground">Catatan tindakan</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Rekam jejak tindakan pengelola: siapa melakukan apa dan kapan. Dicatat
        otomatis dan tidak bisa diubah dari panel ini.
      </p>

      {entries.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            icon={ScrollText}
            title="Belum ada tindakan tercatat"
            description="Begitu ada moderasi atau perubahan peran, riwayatnya muncul di sini."
          />
        </div>
      ) : (
        <ol className="mt-7 space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex flex-wrap items-baseline gap-x-2 gap-y-1 rounded-card border border-border bg-surface px-4 py-3"
            >
              <span className="text-body font-medium text-foreground">
                {entry.actor?.full_name ?? "Akun terhapus"}
              </span>
              {entry.actor && <RoleBadge role={entry.actor.role} />}
              <span className="text-body text-muted-foreground">
                {ACTION_LABEL[entry.action] ?? entry.action}
              </span>
              <time
                dateTime={entry.created_at}
                title={formatDateTimeID(entry.created_at)}
                className="ml-auto text-caption whitespace-nowrap text-muted-foreground"
              >
                {relativeTime(entry.created_at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
