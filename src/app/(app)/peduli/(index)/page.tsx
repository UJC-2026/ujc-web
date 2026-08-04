import type { Metadata } from "next";
import Link from "next/link";
import { HandHeart, HeartHandshake, Users, Wallet } from "lucide-react";
import { getPeduliCases, getPeduliImpact } from "@/lib/peduli/queries";
import { getCurrentUser } from "@/lib/auth/session";
import { CaseCard } from "@/components/peduli/case-card";
import { AjukanBantuanForm } from "@/components/peduli/peduli-forms";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "UJC Peduli",
  description:
    "Program solidaritas UJC untuk anggota yang sakit, terkena musibah, atau menghadapi kesulitan ekonomi di Jepang.",
};

const yen = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export default async function PeduliPage() {
  const [impact, cases, user] = await Promise.all([
    getPeduliImpact(),
    getPeduliCases(),
    getCurrentUser(),
  ]);

  const open = cases.filter((item) => item.status !== "selesai");
  const done = cases.filter((item) => item.status === "selesai");

  const tiles = [
    {
      icon: Users,
      label: "Anggota terbantu",
      value: impact.casesHelped.toLocaleString("id-ID"),
    },
    {
      icon: Wallet,
      label: "Donasi terkumpul",
      value: yen.format(impact.totalCollected),
    },
    {
      icon: HeartHandshake,
      label: "Jumlah donasi",
      value: impact.totalDonations.toLocaleString("id-ID"),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="max-w-2xl">
        <h1 className="rule-gold text-h1 text-foreground">UJC Peduli</h1>
        <p className="mt-5 text-body text-muted-foreground">
          Jauh dari rumah, kabar buruk terasa dua kali lebih berat. UJC Peduli
          adalah kanal gotong royong antar anggota — untuk yang sedang sakit,
          kena musibah, atau menghadapi kesulitan ekonomi dan urusan visa
          mendesak.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-5">
            <span className="flex size-10 items-center justify-center rounded-field bg-surface-muted text-primary">
              <tile.icon className="size-5" aria-hidden />
            </span>
            <p className="mt-4 text-caption text-muted-foreground">
              {tile.label}
            </p>
            <p className="mt-1 text-h2 font-semibold tabular-nums text-foreground">
              {tile.value}
            </p>
          </Card>
        ))}
      </div>

      <section className="mt-10 rounded-panel border border-accent/40 bg-accent-muted/30 p-6">
        <h2 className="text-h3 text-foreground">Sedang butuh bantuan?</h2>
        <p className="mt-2 max-w-2xl text-body text-muted-foreground">
          Tidak perlu sungkan. Pengajuan hanya dibaca pengurus dan tidak
          ditampilkan ke anggota lain sampai kamu setuju. Kalau kamu memilih
          tetap tertutup, bantuan tetap bisa diupayakan lewat jalur pengurus.
        </p>
        <div className="mt-5">
          {user ? (
            <AjukanBantuanForm />
          ) : (
            <Button asChild variant="outline">
              <Link href="/login?next=/peduli">Masuk untuk mengajukan</Link>
            </Button>
          )}
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-h2 text-foreground">Sedang berjalan</h2>

        {open.length === 0 ? (
          <div className="mt-7">
            <EmptyState
              icon={HandHeart}
              title="Belum ada program berjalan"
              description="Saat ini tidak ada pengajuan yang sedang dibuka. Semoga tetap begitu — tapi kalau kamu butuh, kanalnya selalu terbuka."
            />
          </div>
        ) : (
          <RevealGroup className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {open.map((item) => (
              <RevealItem key={item.id}>
                <CaseCard item={item} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>

      {done.length > 0 && (
        <section className="mt-14">
          <h2 className="text-h2 text-foreground">Sudah tuntas</h2>
          <p className="mt-2 text-body text-muted-foreground">
            Terima kasih untuk setiap anggota yang ikut membantu.
          </p>
          <RevealGroup className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {done.map((item) => (
              <RevealItem key={item.id}>
                <CaseCard item={item} />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}
    </div>
  );
}
