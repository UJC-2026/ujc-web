import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, ShieldCheck } from "lucide-react";
import {
  getCaseDonations,
  getPeduliCase,
  type PeduliCase,
} from "@/lib/peduli/queries";
import { getCurrentProfile, getPengurusRoles } from "@/lib/auth/session";
import { DonasiForm } from "@/components/peduli/peduli-forms";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { relativeTime } from "@/lib/format";

type PageProps = { params: Promise<{ id: string }> };

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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getPeduliCase(id);

  if (!item) return { title: "Program tidak ditemukan" };

  // A case that is not public yet must not leak its title into metadata.
  if (!item.is_public) {
    return { title: "Pengajuan UJC Peduli", robots: { index: false } };
  }

  return {
    title: `${item.title} · UJC Peduli`,
    description: item.description?.slice(0, 155),
  };
}

function progressOf(item: PeduliCase) {
  if (!item.target_amount || item.target_amount <= 0) return null;
  return Math.min(
    Math.round((item.collected_amount / item.target_amount) * 100),
    100,
  );
}

export default async function PeduliCasePage({ params }: PageProps) {
  const { id } = await params;

  const [item, profile] = await Promise.all([
    getPeduliCase(id),
    getCurrentProfile(),
  ]);

  // RLS already hides cases the caller may not see, so a miss is a 404.
  if (!item) notFound();

  const roles = profile ? await getPengurusRoles(profile.id) : [];
  const isPengurus = roles.length > 0 || profile?.role === "admin";

  // Donations are only readable by the donor, bendahara, and pimpinan.
  const donations = isPengurus ? await getCaseDonations(item.id) : [];

  const pct = progressOf(item);
  const canDonate = item.is_public && item.status !== "selesai";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/peduli" className="transition-colors hover:text-primary">
          UJC Peduli
        </Link>
      </nav>

      {!item.is_public && (
        <p className="mt-5 flex items-start gap-2.5 rounded-panel border border-accent/40 bg-accent-muted/40 px-4 py-3.5 text-caption text-foreground">
          <Lock className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
          Pengajuan ini belum ditampilkan ke anggota lain. Hanya kamu sebagai
          pengaju dan pengurus yang bisa membuka halaman ini.
        </p>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        <Badge variant={item.status === "selesai" ? "success" : "primary"}>
          {STATUS_LABEL[item.status]}
        </Badge>
        {item.category && <Badge variant="outline">{item.category}</Badge>}
      </div>

      <h1 className="mt-3 text-h1 text-foreground">{item.title}</h1>

      <section className="mt-7 rounded-panel border border-border bg-surface p-6">
        {pct !== null ? (
          <>
            <div
              className="h-3 overflow-hidden rounded-pill bg-surface-muted"
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
            <p className="mt-3 text-body text-foreground">
              <span className="font-semibold">
                {yen.format(item.collected_amount)}
              </span>{" "}
              <span className="text-muted-foreground">
                terkumpul dari target {yen.format(item.target_amount!)} ({pct}%)
              </span>
            </p>
          </>
        ) : (
          <p className="text-body text-foreground">
            <span className="font-semibold">
              {yen.format(item.collected_amount)}
            </span>{" "}
            <span className="text-muted-foreground">terkumpul sejauh ini</span>
          </p>
        )}

        <p className="mt-1.5 text-caption text-muted-foreground">
          Dari {item.donation_count.toLocaleString("id-ID")} donasi ·{" "}
          Dibuka {relativeTime(item.created_at)}
        </p>
      </section>

      {item.description && (
        <div className="mt-8">
          <h2 className="rule-gold text-h3 text-foreground">Ceritanya</h2>
          <p className="mt-5 text-body whitespace-pre-line text-muted-foreground">
            {item.description}
          </p>
        </div>
      )}

      <section className="mt-10 rounded-panel border border-border bg-surface p-6">
        <h2 className="text-h3 text-foreground">Ikut membantu</h2>

        {!profile ? (
          <div className="mt-5">
            <p className="text-body text-muted-foreground">
              Masuk dulu untuk berdonasi.
            </p>
            <Button asChild className="mt-4">
              <Link href={`/login?next=/peduli/${item.id}`}>Masuk</Link>
            </Button>
          </div>
        ) : !canDonate ? (
          <p className="mt-5 text-body text-muted-foreground">
            {item.status === "selesai"
              ? "Program ini sudah tuntas. Terima kasih untuk semua yang sudah membantu."
              : "Program ini belum dibuka untuk donasi."}
          </p>
        ) : (
          <div className="mt-5">
            <DonasiForm caseId={item.id} />
          </div>
        )}
      </section>

      {isPengurus && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-h3 text-foreground">
            <ShieldCheck className="size-5 text-accent" aria-hidden />
            Riwayat donasi
          </h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Hanya terlihat pengurus. Donatur yang memilih anonim tidak
            ditampilkan namanya di sini.
          </p>

          {donations.length === 0 ? (
            <p className="mt-5 text-body text-muted-foreground">
              Belum ada donasi masuk.
            </p>
          ) : (
            <ul className="mt-5 space-y-2.5">
              {donations.map((donation) => (
                <li
                  key={donation.id}
                  className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-body text-foreground">
                      {donation.donor?.full_name ?? "Anonim"}
                    </p>
                    {donation.message && (
                      <p className="text-caption text-muted-foreground">
                        “{donation.message}”
                      </p>
                    )}
                    <p className="text-caption text-muted-foreground">
                      {relativeTime(donation.created_at)}
                    </p>
                  </div>
                  <span className="text-body font-medium tabular-nums text-success">
                    {yen.format(donation.amount)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
