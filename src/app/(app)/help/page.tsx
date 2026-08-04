import type { Metadata } from "next";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CalendarDays,
  GraduationCap,
  HandHeart,
  MessagesSquare,
  ShieldCheck,
  ShoppingBag,
  UserCog,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Cara pakai website",
  description:
    "Panduan singkat memakai website UJC — dari mendaftar sampai memakai forum, marketplace, latihan CBT, dan UJC Peduli.",
};

const STEPS = [
  {
    title: "Daftar dan verifikasi email",
    body: "Pakai email yang aktif. Setelah mendaftar, buka email dan klik tautan verifikasi. Bisa juga masuk dengan akun Google.",
    href: "/register",
    cta: "Buka halaman daftar",
  },
  {
    title: "Lengkapi profil",
    body: "Isi nama, NIM, kelas, program studi, angkatan, dan domisili di Jepang. Prefektur yang kamu isi dipakai untuk menemukan anggota yang tinggal berdekatan.",
    href: "/profile",
    cta: "Edit profil",
  },
  {
    title: "Tunggu verifikasi keanggotaan",
    body: "Pengurus memeriksa data mahasiswa sebelum memberi tanda terverifikasi. Sambil menunggu, kamu sudah bisa memakai hampir semua fitur.",
  },
];

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Forum",
    href: "/forum",
    body: "Tempat bertanya dan berbagi pengalaman. Pilih kategori yang sesuai, tulis judul yang spesifik, lalu jelaskan situasimu — makin jelas ceritanya, makin cepat dapat jawaban. Balasan bisa dibalas lagi, dan jawaban yang membantu bisa kamu beri suara naik.",
  },
  {
    icon: GraduationCap,
    title: "Latihan CBT",
    href: "/cbt",
    body: "Latihan JLPT dan SSW dengan timer. Waktu dihitung sejak kamu menekan mulai, jadi memuat ulang halaman tidak menambah waktu. Pembahasan dan kunci jawaban baru terbuka setelah kamu mengumpulkan jawaban.",
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    href: "/marketplace",
    body: "Jual, beli, atau lelang barang bekas antar anggota — berguna saat mau pulang ke Indonesia. Untuk lelang, tawaranmu harus lebih tinggi dari tawaran tertinggi, dan penjual tidak boleh menawar barangnya sendiri.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Papan lowongan",
    href: "/jobs",
    body: "Hanya lowongan yang sudah ditinjau moderator yang tampil. Kamu bisa menyimpan lowongan atau menandainya sudah dilamar. UJC tidak pernah memungut biaya penyaluran kerja — kalau ada yang meminta uang, laporkan ke pengurus.",
  },
  {
    icon: HandHeart,
    title: "Mentor Senpai-Kouhai",
    href: "/mentorship",
    body: "Minta bimbingan dari anggota yang lebih dulu di Jepang, atau daftarkan dirimu sebagai mentor. Ceritakan apa yang sedang kamu hadapi saat mengajukan — mentor membacanya sebelum menjawab.",
  },
  {
    icon: CalendarDays,
    title: "Kegiatan",
    href: "/events",
    body: "Kopdar, workshop, dan webinar. Konfirmasi kehadiran supaya panitia tahu berapa yang datang. Untuk acara daring, tautan pertemuan muncul setelah kamu menyatakan hadir.",
  },
];

const FAQ = [
  {
    q: "Apakah profil saya terlihat semua orang?",
    a: "Bisa kamu atur. Di halaman profil ada pilihan untuk menyembunyikan profil dari publik — kalau dimatikan, kamu tidak muncul di direktori anggota maupun papan peringkat, dan halaman profilmu tidak bisa dibuka orang lain.",
  },
  {
    q: "Apakah lokasi rumah saya terlihat di peta?",
    a: "Tidak. Peta anggota hanya menampilkan jumlah anggota per prefektur, dan titik yang terlihat adalah pusat prefektur — bukan lokasi siapa pun. Alamatmu tidak pernah dikirim ke halaman peta. Kamu juga bisa memilih tidak dihitung sama sekali.",
  },
  {
    q: "Siapa yang bisa membaca pengajuan UJC Peduli saya?",
    a: "Hanya ketua, wakil ketua, dan bendahara. Pengajuanmu tidak ditampilkan ke anggota lain sampai kamu dan pengurus sepakat untuk menampilkannya. Kalau kamu memilih tetap tertutup, bantuan tetap bisa diupayakan lewat jalur pengurus.",
  },
  {
    q: "Kenapa artikel blog saya belum tampil?",
    a: "Artikel masuk antrean tinjauan pengurus dulu sebelum terbit. Kamu tetap bisa membuka dan menyuntingnya sendiri selama menunggu.",
  },
  {
    q: "Apakah pesan pribadi saya bisa dibaca pengurus?",
    a: "Tidak. Percakapan hanya bisa dibaca pesertanya. Kalau ada yang mengganggu, kamu bisa memblokir orang tersebut lewat halaman percakapan — blokir berlaku dua arah dan juga menghentikan percakapan yang sudah ada.",
  },
  {
    q: "Website ini bisa dipakai tanpa sinyal?",
    a: "Sebagian. Halaman yang sudah pernah kamu buka tetap bisa dibaca saat sambungan putus. Kamu juga bisa memasang website ini ke layar utama HP lewat menu browser, sehingga terasa seperti aplikasi.",
  },
];

export default function HelpPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <Reveal className="max-w-2xl">
        <h1 className="rule-gold text-h1 text-foreground">Cara pakai website</h1>
        <p className="mt-5 text-body text-muted-foreground">
          Panduan singkat dari mendaftar sampai memakai tiap fitur. Kalau masih
          ada yang membingungkan, tanyakan saja di forum — tidak ada pertanyaan
          yang terlalu dasar di sini.
        </p>
      </Reveal>

      <section className="mt-12">
        <h2 className="text-h2 text-foreground">Mulai dari sini</h2>
        <ol className="mt-7 space-y-5">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="flex gap-5 rounded-card border border-border bg-surface p-5"
            >
              <span
                className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-primary text-caption font-semibold text-primary-foreground"
                aria-hidden
              >
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-h3 font-medium text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-body text-muted-foreground">
                  {step.body}
                </p>
                {step.href && (
                  <Button asChild variant="outline" size="sm" className="mt-4">
                    <Link href={step.href}>{step.cta}</Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14">
        <h2 className="text-h2 text-foreground">Fitur utama</h2>
        <RevealGroup className="mt-7 grid gap-5 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <RevealItem key={feature.href}>
              <Card className="h-full">
                <span className="mb-4 flex size-11 items-center justify-center rounded-field bg-surface-muted text-primary">
                  <feature.icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-h3 font-medium text-foreground">
                  <Link
                    href={feature.href}
                    className="transition-colors hover:text-primary"
                  >
                    {feature.title}
                  </Link>
                </h3>
                <p className="mt-2 text-body text-muted-foreground">
                  {feature.body}
                </p>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="mt-14">
        <h2 className="rule-gold text-h2 text-foreground">
          Pertanyaan yang sering muncul
        </h2>
        <dl className="mt-7 space-y-5">
          {FAQ.map((item) => (
            <div
              key={item.q}
              className="rounded-card border border-border bg-surface p-5"
            >
              <dt className="text-h3 font-medium text-foreground">{item.q}</dt>
              <dd className="mt-2 text-body text-muted-foreground">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14 rounded-panel border border-accent/40 bg-accent-muted/30 p-6">
        <h2 className="flex items-center gap-2.5 text-h3 text-foreground">
          <ShieldCheck className="size-5 text-accent" aria-hidden />
          Kalau menemukan sesuatu yang mencurigakan
        </h2>
        <p className="mt-3 text-body text-muted-foreground">
          Setiap thread, balasan, dan barang punya tombol laporkan. Laporanmu
          hanya dilihat moderator, dan identitasmu tidak ditampilkan ke penulis
          konten. Untuk hal mendesak, hubungi pengurus lewat pesan langsung.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/structure">
              <UserCog aria-hidden />
              Lihat daftar pengurus
            </Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/terms">Baca ketentuan layanan</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
