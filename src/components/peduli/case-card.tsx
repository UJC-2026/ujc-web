import Link from "next/link";
import { HeartHandshake, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { PeduliCase } from "@/lib/peduli/queries";

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

const STATUS_VARIANT = {
  pengajuan: "outline",
  diverifikasi: "neutral",
  berjalan: "primary",
  selesai: "success",
} as const;

export function CaseCard({ item }: { item: PeduliCase }) {
  const pct =
    item.target_amount && item.target_amount > 0
      ? Math.min(
          Math.round((item.collected_amount / item.target_amount) * 100),
          100,
        )
      : null;

  return (
    <article className="relative flex h-full flex-col rounded-card border border-border bg-surface p-5 transition-all duration-200 hover:-translate-y-1 hover:border-accent">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant={STATUS_VARIANT[item.status]}>
          {STATUS_LABEL[item.status]}
        </Badge>
        {item.category && <Badge variant="outline">{item.category}</Badge>}
        {!item.is_public && <Badge variant="danger">Belum tampil publik</Badge>}
      </div>

      <h3 className="mt-3 text-h3 font-medium text-foreground">
        <Link href={`/peduli/${item.id}`}>
          <span className="absolute inset-0" aria-hidden />
          {item.title}
        </Link>
      </h3>

      {item.description && (
        <p className="mt-2 line-clamp-3 text-body text-muted-foreground">
          {item.description}
        </p>
      )}

      <div className="mt-auto pt-5">
        {pct !== null && (
          <>
            <div
              className="h-2.5 overflow-hidden rounded-pill bg-surface-muted"
              role="progressbar"
              aria-valuenow={pct}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`Terkumpul ${pct} persen dari target`}
            >
              <span
                className="block h-full rounded-pill bg-accent"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-2 text-caption text-muted-foreground">
              <span className="font-medium text-foreground">
                {yen.format(item.collected_amount)}
              </span>{" "}
              dari {yen.format(item.target_amount!)} ({pct}%)
            </p>
          </>
        )}

        {pct === null && (
          <p className="text-caption text-muted-foreground">
            Terkumpul{" "}
            <span className="font-medium text-foreground">
              {yen.format(item.collected_amount)}
            </span>
          </p>
        )}

        <p className="mt-2 flex items-center gap-1.5 text-caption text-accent">
          {item.donation_count > 0 ? (
            <>
              <Users className="size-4" aria-hidden />
              {item.donation_count.toLocaleString("id-ID")} donasi
            </>
          ) : (
            <>
              <HeartHandshake className="size-4" aria-hidden />
              Jadi yang pertama membantu
            </>
          )}
        </p>
      </div>
    </article>
  );
}
