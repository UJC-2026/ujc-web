import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { getPeriods } from "@/lib/structure/queries";
import { getMemberStats } from "@/lib/members/queries";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { KizunaMark } from "@/components/brand/motifs";

export const metadata: Metadata = {
  title: "Tentang UJC",
  description:
    "UNSIA Japan Community — wadah mahasiswa program distance learning Universitas Siber Asia yang kuliah sambil bekerja di Jepang.",
};

const PURPOSES = [
  {
    title: "Menemani yang baru datang",
    body: "Bulan-bulan pertama di Jepang adalah yang paling membingungkan: kartu asuransi, rekening bank, aturan sampah, sampai cara menyampaikan sakit ke atasan. Anggota yang sudah lebih dulu di sini menjawabnya di forum dan lewat program mentor.",
  },
  {
    title: "Menjaga kuliah tetap jalan",
    body: "Kuliah daring paling gampang tertinggal saat shift kerja padat. UJC menyediakan latihan CBT, materi belajar, pengingat akademik, dan ruang diskusi supaya tidak ada yang merasa berjuang sendirian.",
  },
  {
    title: "Membuka jalan karier",
    body: "Lowongan yang beredar di grup pesan sering tidak jelas asalnya. Papan lowongan UJC hanya memuat yang sudah ditinjau pengurus, lengkap dengan prefektur, kisaran gaji, dan tipe visa yang diterima.",
  },
  {
    title: "Hadir saat ada yang kesulitan",
    body: "Jauh dari keluarga, kabar buruk terasa dua kali lebih berat. Lewat UJC Peduli, anggota yang sakit, kena musibah, atau kesulitan ekonomi bisa dibantu tanpa harus menceritakan urusannya ke semua orang.",
  },
  {
    title: "Merawat pertemanan",
    body: "Kopdar per prefektur, workshop, dan galeri kegiatan membuat komunitas ini terasa seperti orang sungguhan, bukan sekadar daftar nama di layar.",
  },
];

// The acronym is drawn from the university's own name, so the values are easy
// to recall without a separate glossary.
const VALUES = [
  {
    letter: "U",
    name: "Ulet",
    body: "Kuliah sambil kerja penuh waktu bukan hal ringan. Kami menghargai yang bertahan, bukan yang paling cepat.",
  },
  {
    letter: "N",
    name: "Niat baik",
    body: "Setiap pertanyaan dijawab dengan anggapan penanyanya memang sedang butuh, bukan sedang malas mencari.",
  },
  {
    letter: "S",
    name: "Solidaritas",
    body: "Yang sudah lebih dulu sampai menoleh ke belakang. Itu inti dari senpai-kouhai.",
  },
  {
    letter: "I",
    name: "Integritas",
    body: "Tidak ada pungutan atas nama komunitas, dan tidak ada informasi kerja yang disebar tanpa ditinjau.",
  },
  {
    letter: "A",
    name: "Adaptif",
    body: "Aturan, visa, dan tempat kerja berubah. Komunitas ini ikut menyesuaikan, bukan bertahan pada cara lama.",
  },
];

export default async function AboutPage() {
  // Periods and member counts come from the database rather than being written
  // into the page, so this stays true as the community changes.
  const [stats, periods] = await Promise.all([getMemberStats(), getPeriods()]);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <Reveal className="relative max-w-3xl">
        <KizunaMark
          className="pointer-events-none absolute -top-6 -right-4 size-32 text-brand-blue-100 dark:text-navy-800/50"
          aria-hidden
        />
        <h1 className="rule-gold text-h1 text-foreground">
          Kuliah daring, kerja penuh waktu, dan ribuan kilometer dari rumah
        </h1>
        <p className="mt-6 text-body text-muted-foreground">
          UNSIA Japan Community adalah wadah bagi mahasiswa program{" "}
          <em>distance learning</em> Universitas Siber Asia yang tinggal dan
          bekerja di Jepang. Sebagian dari kami masuk pabrik pukul sepuluh
          malam, sebagian merawat lansia, sebagian mengejar kelas daring di sela
          istirahat. Yang menyatukan: sama-sama menjalani dua hidup sekaligus,
          di negeri yang bukan tempat kami lahir.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/structure">
              Kenali pengurus
              <ArrowRight aria-hidden />
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/events">Lihat kegiatan</Link>
          </Button>
        </div>
      </Reveal>

      <section className="mt-16">
        <h2 className="rule-gold text-h2 text-foreground">Tujuan &amp; fungsi</h2>
        <ol className="mt-9 space-y-8">
          {PURPOSES.map((item, index) => (
            <li key={item.title} className="flex gap-5 sm:gap-7">
              <span
                className="shrink-0 text-h2 font-semibold tabular-nums text-accent/70"
                aria-hidden
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <div>
                <h3 className="text-h3 font-medium text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-body text-muted-foreground">{item.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-16 rounded-panel border border-border bg-surface p-7 sm:p-10">
        <h2 className="text-h2 text-foreground">Visi</h2>
        <blockquote className="mt-5 border-l-2 border-accent pl-5 text-h3 leading-relaxed font-normal text-foreground">
          Tidak ada anggota UJC yang harus menghadapi kuliah, kerja, atau
          kesulitan hidup di Jepang seorang diri.
        </blockquote>

        <h2 className="mt-10 text-h2 text-foreground">Misi</h2>
        <ul className="mt-5 space-y-3 text-body text-muted-foreground">
          {[
            "Menyediakan ruang tanya jawab yang aman dan bebas penghakiman.",
            "Menjaga kelancaran studi lewat materi, latihan, dan pengingat akademik.",
            "Menyaring informasi kerja agar anggota terhindar dari penipuan.",
            "Menggerakkan solidaritas nyata saat ada anggota yang tertimpa kesulitan.",
            "Mempertemukan anggota yang tinggal berdekatan agar komunitas terasa nyata.",
          ].map((line) => (
            <li key={line} className="flex gap-3">
              <span
                className="mt-2.5 size-1.5 shrink-0 rounded-pill bg-accent"
                aria-hidden
              />
              {line}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-16">
        <h2 className="rule-gold text-h2 text-foreground">Nilai UNSIA</h2>
        <p className="mt-5 max-w-2xl text-body text-muted-foreground">
          Lima nilai yang kami pegang, mengambil huruf dari nama kampus kami
          sendiri.
        </p>
        <RevealGroup className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {VALUES.map((value) => (
            <RevealItem key={value.letter}>
              <Card className="h-full">
                <span className="flex size-11 items-center justify-center rounded-field bg-primary text-h3 font-semibold text-primary-foreground">
                  {value.letter}
                </span>
                <h3 className="mt-4 text-h3 font-medium text-foreground">
                  {value.name}
                </h3>
                <p className="mt-2 text-body text-muted-foreground">
                  {value.body}
                </p>
              </Card>
            </RevealItem>
          ))}
        </RevealGroup>
      </section>

      <section className="mt-16">
        <h2 className="rule-gold text-h2 text-foreground">Kepengurusan</h2>
        <p className="mt-5 max-w-2xl text-body text-muted-foreground">
          UJC dijalankan pengurus yang dipilih tiap periode, dibagi ke divisi
          akademik, kegiatan, media, keuangan, dan administrasi.
        </p>

        {periods.length > 0 && (
          <ul className="mt-7 flex flex-wrap gap-2.5">
            {periods.map((period) => (
              <li key={period.id}>
                <Link
                  href={`/structure?period=${encodeURIComponent(period.year_label)}`}
                  className="flex items-center gap-2 rounded-card border border-border bg-surface px-4 py-2.5 text-caption text-foreground transition-colors hover:border-accent hover:text-primary"
                >
                  <Users className="size-4 text-primary" aria-hidden />
                  Periode {period.year_label}
                  {period.is_active && <span className="text-accent">· aktif</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-7 text-body text-muted-foreground">
          Saat ini {stats.total.toLocaleString("id-ID")} anggota terdaftar dari{" "}
          {stats.prefectures.toLocaleString("id-ID")} prefektur.
        </p>
      </section>

      <section className="mt-16 rounded-panel border border-accent/40 bg-accent-muted/30 p-7 text-center sm:p-10">
        <h2 className="text-h2 text-foreground">
          Sedang di Jepang dan kuliah di UNSIA?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-body text-muted-foreground">
          Bergabung gratis. Lengkapi profil, pilih prefekturmu, dan temukan
          anggota lain yang tinggal berdekatan.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/register">Daftar sekarang</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/help">Cara pakai website</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
