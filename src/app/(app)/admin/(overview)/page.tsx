import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarDays,
  MessagesSquare,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getAdminStats, getPrefectureBreakdown } from "@/lib/admin/queries";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "Ikhtisar" };

function StatTile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Users;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <span className="flex size-10 items-center justify-center rounded-field bg-surface-muted text-primary">
        <Icon className="size-5" aria-hidden />
      </span>
      <p className="mt-4 text-caption text-muted-foreground">{label}</p>
      <p className="mt-1 text-h2 font-semibold tabular-nums text-foreground">
        {value.toLocaleString("id-ID")}
      </p>
      {hint && <p className="mt-1 text-caption text-muted-foreground">{hint}</p>}
    </Card>
  );
}

export default async function AdminOverviewPage() {
  const [stats, prefectures] = await Promise.all([
    getAdminStats(),
    getPrefectureBreakdown(),
  ]);

  const needsAttention = stats.pendingReports + stats.newFlags;
  const busiest = prefectures[0]?.count ?? 1;

  return (
    <div className="space-y-10">
      {needsAttention > 0 && (
        <Link
          href="/admin/moderasi"
          className="flex items-center gap-3 rounded-panel border border-accent/40 bg-accent-muted/40 px-5 py-4 transition-colors hover:border-accent"
        >
          <AlertTriangle className="size-5 shrink-0 text-accent" aria-hidden />
          <p className="text-body text-foreground">
            <strong className="font-semibold">
              {needsAttention.toLocaleString("id-ID")} hal
            </strong>{" "}
            menunggu ditinjau di antrean moderasi.
          </p>
        </Link>
      )}

      <section>
        <h2 className="text-h3 text-foreground">Ringkasan komunitas</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatTile
            icon={Users}
            label="Anggota terdaftar"
            value={stats.members}
            hint={`${stats.verifiedMembers.toLocaleString("id-ID")} terverifikasi`}
          />
          <StatTile
            icon={MessagesSquare}
            label="Diskusi forum"
            value={stats.threads}
            hint={`${stats.replies.toLocaleString("id-ID")} balasan`}
          />
          <StatTile
            icon={CalendarDays}
            label="Kegiatan"
            value={stats.events}
            hint={`${stats.upcomingEvents.toLocaleString("id-ID")} akan datang`}
          />
          <StatTile
            icon={ShieldCheck}
            label="Perlu ditinjau"
            value={needsAttention}
            hint={`${stats.pendingReports} laporan · ${stats.newFlags} tanda otomatis`}
          />
        </div>
      </section>

      <section>
        <h2 className="text-h3 text-foreground">Sebaran anggota per prefektur</h2>

        {prefectures.length === 0 ? (
          <p className="mt-5 text-body text-muted-foreground">
            Belum ada anggota yang mengisi prefektur domisili.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {prefectures.map((row) => (
              <li key={row.prefecture} className="flex items-center gap-4">
                <span className="w-28 shrink-0 truncate text-caption text-foreground">
                  {row.prefecture}
                </span>
                <span
                  className="h-2.5 rounded-pill bg-primary/70"
                  style={{ width: `${Math.max((row.count / busiest) * 100, 4)}%` }}
                  aria-hidden
                />
                <span className="text-caption tabular-nums text-muted-foreground">
                  {row.count.toLocaleString("id-ID")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-h3 text-foreground">Pintasan</h2>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/admin/moderasi">
            <Badge variant="outline">Antrean moderasi</Badge>
          </Link>
          <Link href="/admin/audit">
            <Badge variant="outline">Catatan tindakan</Badge>
          </Link>
          <Link href="/events">
            <Badge variant="outline">Lihat kegiatan</Badge>
          </Link>
        </div>
      </section>
    </div>
  );
}
