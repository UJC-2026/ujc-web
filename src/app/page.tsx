import Link from "next/link";
import Image from "next/image";
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
import { ProfileVideo } from "@/components/home/profile-video";
import { getPhotos } from "@/lib/gallery/queries";
import { getPartners, getSiteSetting, youtubeId } from "@/lib/home/queries";
import { JsonLd, organizationSchema } from "@/lib/seo/json-ld";

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
  const [stats, featuredPhotos, partners, videoUrl] = await Promise.all([
    getCommunityStats(),
    getPhotos(true),
    getPartners(),
    getSiteSetting("home_video_url"),
  ]);

  // Both sections below stay out of the page entirely until there is something
  // to put in them — an empty "Partner & kolaborasi" strip reads worse than no
  // strip at all on a community that has not signed any yet.
  const videoId = youtubeId(videoUrl);

  return (
    <>
      <JsonLd data={organizationSchema()} />

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

      {/* Between the "what UJC is" section and the statistics, where the spec
          asks for it: the numbers land differently after seeing the people. */}
      {videoId && (
        <section className="mx-auto w-full max-w-4xl px-4 pb-20 sm:pb-24">
          <Reveal>
            <h2 className="rule-gold text-h2 text-foreground">
              Sehari-hari anggota UJC
            </h2>
            <p className="mt-5 max-w-2xl text-body text-muted-foreground">
              Kuliah daring di sela shift, kopdar akhir pekan, dan cerita
              anggota yang sudah lebih dulu menjalaninya.
            </p>
            <div className="mt-9">
              <ProfileVideo
                videoId={videoId}
                title="Video profil UNSIA Japan Community"
              />
            </div>
          </Reveal>
        </section>
      )}

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

      {partners.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 pt-20 sm:pt-24">
          <Reveal className="max-w-2xl">
            <h2 className="rule-gold text-h2 text-foreground">
              Partner &amp; kolaborasi
            </h2>
            <p className="mt-5 text-body text-muted-foreground">
              Pihak yang berjalan bersama UJC — kampus, penyalur kerja, dan
              komunitas Indonesia lain di Jepang.
            </p>
          </Reveal>

          <RevealGroup className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => {
              const card = (
                <Card
                  interactive={Boolean(partner.website_url)}
                  className="flex h-full flex-col"
                >
                  {partner.logo_url ? (
                    <Image
                      src={partner.logo_url}
                      alt={partner.name}
                      width={200}
                      height={64}
                      className="h-12 w-auto max-w-[12rem] object-contain"
                    />
                  ) : (
                    <span className="flex h-12 items-center text-h3 font-semibold text-primary">
                      {partner.name}
                    </span>
                  )}

                  {partner.logo_url && (
                    <CardTitle className="mt-4">{partner.name}</CardTitle>
                  )}
                  {partner.description && (
                    <CardDescription className="mt-2 text-body">
                      {partner.description}
                    </CardDescription>
                  )}
                </Card>
              );

              return (
                <RevealItem key={partner.id}>
                  {partner.website_url ? (
                    <a
                      href={partner.website_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="block h-full"
                    >
                      {card}
                    </a>
                  ) : (
                    card
                  )}
                </RevealItem>
              );
            })}
          </RevealGroup>
        </section>
      )}

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
