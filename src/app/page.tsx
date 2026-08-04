import Link from "next/link";
import {
  BriefcaseBusiness,
  GraduationCap,
  HandHeart,
  MapPin,
  MessagesSquare,
  ShoppingBag,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Hero, type HeroStat } from "@/components/home/hero";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { CountUp } from "@/components/motion/count-up";
import { KizunaMark } from "@/components/brand/motifs";
import { FeaturedGallery } from "@/components/home/featured-gallery";
import { getPhotos } from "@/lib/gallery/queries";

export const revalidate = 300;

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Forum diskusi",
    description:
      "Tanya soal visa, tugas kuliah, atau kehidupan sehari-hari — dijawab sesama anggota yang sudah lebih dulu mengalaminya.",
    href: "/forum",
  },
  {
    icon: GraduationCap,
    title: "Latihan CBT",
    description:
      "Bank soal JLPT N5–N2 dan SSW lengkap dengan timer, skor otomatis, dan pembahasan tiap soal.",
    href: "/cbt",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    description:
      "Jual, lelang, atau berikan barang bekas ke sesama anggota — praktis saat mau pindah kota atau pulang ke Indonesia.",
    href: "/marketplace",
  },
  {
    icon: BriefcaseBusiness,
    title: "Papan lowongan",
    description:
      "Lowongan terverifikasi dengan info gaji, prefektur, dan tipe visa yang diterima. Bebas dari postingan scam.",
    href: "/jobs",
  },
  {
    icon: MapPin,
    title: "Peta anggota",
    description:
      "Cari teman sekota untuk kopdar. Level kota saja, dan kamu bisa memilih untuk tidak tampil.",
    href: "/map",
  },
  {
    icon: HandHeart,
    title: "UJC Peduli",
    description:
      "Kanal solidaritas untuk anggota yang sedang sakit, kena musibah, atau menghadapi kesulitan mendesak.",
    href: "/peduli",
  },
];

async function getCommunityStats(): Promise<HeroStat[]> {
  const supabase = await createClient();

  const [members, prefectures, threads, events] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("prefecture").not("prefecture", "is", null),
    supabase.from("forum_threads").select("*", { count: "exact", head: true }),
    supabase.from("events").select("*", { count: "exact", head: true }),
  ]);

  const uniquePrefectures = new Set(
    (prefectures.data ?? []).map((row) => row.prefecture as string),
  ).size;

  return [
    { label: "Anggota terdaftar", value: members.count ?? 0 },
    { label: "Prefektur", value: uniquePrefectures },
    { label: "Diskusi forum", value: threads.count ?? 0 },
    { label: "Kegiatan", value: events.count ?? 0 },
  ];
}

export default async function HomePage() {
  const [stats, featuredPhotos] = await Promise.all([
    getCommunityStats(),
    getPhotos(true),
  ]);

  return (
    <>
      <Hero stats={stats} />

      <FeaturedGallery photos={featuredPhotos} />

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
        <Reveal className="max-w-2xl">
          <h2 className="rule-gold text-h2 text-foreground">
            Satu tempat untuk semua kebutuhan anggota
          </h2>
          <p className="mt-5 text-body text-muted-foreground">
            Kuliah daring sambil bekerja penuh waktu itu berat kalau dijalani
            sendirian. UJC menyatukan diskusi, belajar, karier, dan solidaritas
            dalam satu tempat.
          </p>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <RevealItem key={feature.href}>
              <Link href={feature.href} className="block h-full">
                <Card interactive className="h-full">
                  <span className="mb-4 flex size-11 items-center justify-center rounded-field bg-surface-muted text-primary">
                    <feature.icon className="size-5" aria-hidden />
                  </span>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription className="mt-2 text-body">
                    {feature.description}
                  </CardDescription>
                </Card>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="relative isolate overflow-hidden border-y border-border bg-surface-muted/60">
        <KizunaMark className="absolute -right-8 -bottom-16 -z-10 text-[18rem] leading-none text-brand-blue-100 dark:text-navy-800/40" />

        <div className="mx-auto w-full max-w-6xl px-4 py-20">
          <Reveal>
            <h2 className="rule-gold text-h2 text-foreground">
              Komunitas yang terus bertumbuh
            </h2>
          </Reveal>

          <RevealGroup className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {stats.map((stat) => (
              <RevealItem key={stat.label}>
                <p className="text-h1 font-semibold text-primary">
                  <CountUp value={stat.value} suffix={stat.suffix} />
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  {stat.label}
                </p>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 sm:py-24">
        <Reveal className="rounded-panel border border-border bg-navy-800 px-7 py-14 text-center sm:px-12">
          <h2 className="mx-auto max-w-2xl text-h2 text-white">
            Siap gabung bareng teman-teman UJC?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-body text-white/70">
            Daftar gratis, lengkapi profil, dan langsung terhubung dengan
            anggota lain di prefekturmu.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="accent" size="lg">
              <Link href="/register">Daftar sekarang</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/25 bg-transparent text-white hover:border-accent hover:text-accent"
            >
              <Link href="/about">Kenali UJC dulu</Link>
            </Button>
          </div>
        </Reveal>
      </section>
    </>
  );
}
