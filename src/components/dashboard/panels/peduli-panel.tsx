import Link from "next/link";
import { HeartHandshake, Lock, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { relativeTime } from "@/lib/format";
import { PeduliReviewActions } from "../peduli-review-actions";
import type { PeduliReviewCase } from "@/lib/peduli/queries";

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

const STATUS_LABEL = {
  pengajuan: "Menunggu tinjauan",
  diverifikasi: "Terverifikasi",
  berjalan: "Sedang berjalan",
  selesai: "Selesai",
} as const;

export function PeduliPanel({
  cases,
  canReview,
}: {
  cases: PeduliReviewCase[];
  canReview: boolean;
}) {
  const pending = cases.filter((item) => item.status === "pengajuan");
  const active = cases.filter(
    (item) => item.status !== "pengajuan" && item.status !== "selesai",
  );
  const done = cases.filter((item) => item.status === "selesai");

  return (
    <div>
      <h2 className="text-h3 text-foreground">UJC Peduli</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Tinjau pengajuan bantuan dan pantau penyalurannya.
      </p>

      <p className="mt-4 flex items-start gap-2.5 rounded-field border border-accent/40 bg-accent-muted/30 px-4 py-3 text-caption text-foreground">
        <Lock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        Isi pengajuan bersifat pribadi. Panel ini sengaja hanya terbuka untuk
        ketua, wakil, dan bendahara — bukan seluruh pengurus. Jangan
        membagikan detailnya ke luar tanpa izin pengaju.
      </p>

      {!canReview && (
        <p className="mt-3 flex items-start gap-2.5 rounded-field border border-border bg-surface-muted px-4 py-3 text-caption text-muted-foreground">
          <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
          Kamu bisa membaca untuk keperluan penyaluran dana, tapi hanya ketua,
          wakil, atau admin yang boleh menerbitkan dan mengubah status.
        </p>
      )}

      {cases.length === 0 ? (
        <div className="mt-7">
          <EmptyState
            icon={HeartHandshake}
            title="Belum ada pengajuan"
            description="Pengajuan bantuan dari anggota akan muncul di sini untuk ditinjau."
          />
        </div>
      ) : (
        <div className="mt-7 space-y-8">
          {[
            ["Menunggu tinjauan", pending] as const,
            ["Sedang berjalan", active] as const,
            ["Sudah tuntas", done] as const,
          ].map(([label, list]) =>
            list.length === 0 ? null : (
              <section key={label}>
                <h3 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
                  {label} ({list.length})
                </h3>

                <ul className="mt-3 space-y-3">
                  {list.map((item) => (
                    <li
                      key={item.id}
                      className="rounded-card border border-border bg-surface p-4"
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant={
                            item.status === "selesai" ? "success" : "primary"
                          }
                        >
                          {STATUS_LABEL[item.status]}
                        </Badge>
                        {item.category && (
                          <Badge variant="outline">{item.category}</Badge>
                        )}
                        <Badge variant={item.is_public ? "neutral" : "danger"}>
                          {item.is_public ? "Tampil publik" : "Belum tampil"}
                        </Badge>
                      </div>

                      <p className="mt-2.5 text-body font-medium text-foreground">
                        <Link
                          href={`/peduli/${item.id}`}
                          className="transition-colors hover:text-primary"
                        >
                          {item.title}
                        </Link>
                      </p>

                      {item.description && (
                        <p className="mt-1.5 line-clamp-2 text-caption text-muted-foreground">
                          {item.description}
                        </p>
                      )}

                      <p className="mt-2 text-caption text-muted-foreground">
                        {item.submitter
                          ? `Diajukan ${item.submitter.full_name}`
                          : "Pengaju tidak diketahui"}{" "}
                        · {relativeTime(item.created_at)}
                        {" · "}
                        {yen.format(item.collected_amount)} terkumpul
                        {item.target_amount
                          ? ` dari ${yen.format(item.target_amount)}`
                          : ""}
                      </p>

                      {canReview && (
                        <div className="mt-3.5">
                          <PeduliReviewActions
                            caseId={item.id}
                            status={item.status}
                            isPublic={item.is_public}
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ),
          )}
        </div>
      )}
    </div>
  );
}
