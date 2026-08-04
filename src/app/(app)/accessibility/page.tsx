import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pernyataan aksesibilitas",
  description:
    "Bagaimana website UJC diusahakan bisa dipakai semua anggota, dan apa yang masih perlu diperbaiki.",
};

/**
 * Everything claimed here is something the codebase actually does. Where a
 * standard is only partly met, it says so — an accessibility statement that
 * overclaims is worse than none, because it stops people from reporting.
 */
export default function AccessibilityPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="rule-gold text-h1 text-foreground">
        Pernyataan aksesibilitas
      </h1>
      <p className="mt-5 text-body text-muted-foreground">
        Website UJC diusahakan bisa dipakai siapa saja, termasuk yang memakai
        pembaca layar, hanya papan ketik, atau perangkat dengan layar kecil.
      </p>

      <div className="prose-ujc mt-10">
        <h2>Yang sudah diterapkan</h2>
        <ul>
          <li>
            <strong>Navigasi papan ketik penuh.</strong> Semua tombol, tautan,
            dan formulir bisa dijangkau dengan Tab, dan fokusnya terlihat jelas.
          </li>
          <li>
            <strong>Struktur yang bisa dibaca pembaca layar.</strong> Judul
            berjenjang, daftar memakai penanda daftar sungguhan, dan tombol
            yang hanya berisi ikon punya label tersembunyi.
          </li>
          <li>
            <strong>Menghormati <code>prefers-reduced-motion</code>.</strong>{" "}
            Bila kamu mematikan animasi di pengaturan perangkat, animasi di
            website ini ikut dimatikan.
          </li>
          <li>
            <strong>Kontras warna.</strong> Palet biru navy dan emas dipilih
            agar teks tetap terbaca, baik dalam mode terang maupun gelap.
          </li>
          <li>
            <strong>Mode gelap.</strong> Mengikuti pengaturan perangkat, dan
            bisa diubah manual lewat tombol di bilah atas.
          </li>
          <li>
            <strong>Mobile-first.</strong> Target sentuh dibuat cukup besar
            karena sebagian besar anggota membuka website ini dari HP.
          </li>
        </ul>

        <h2>Yang masih perlu diperbaiki</h2>
        <p>
          Kami belum melakukan audit menyeluruh terhadap WCAG 2.1 AA, jadi
          daftar ini adalah yang kami ketahui sendiri:
        </p>
        <ul>
          <li>
            Peta anggota bergantung pada tampilan visual. Datanya juga
            disediakan sebagai daftar teks per kota di halaman yang sama, tapi
            petanya sendiri belum bisa dinavigasi dengan papan ketik.
          </li>
          <li>
            Gambar yang diunggah anggota sering tidak punya teks alternatif,
            karena pengunggah belum diminta mengisinya.
          </li>
          <li>
            Website belum tersedia dalam Bahasa Jepang, sehingga anggota yang
            lebih nyaman berbahasa Jepang masih kesulitan.
          </li>
          <li>
            Timer pada latihan CBT berjalan mundur tanpa opsi menambah waktu.
          </li>
        </ul>

        <h2>Menemukan hambatan?</h2>
        <p>
          Kalau ada bagian website yang menyulitkanmu, tolong beri tahu kami —
          laporan seperti itu yang paling cepat memperbaiki keadaan. Hubungi
          pengurus lewat <Link href="/messages">pesan langsung</Link> atau lihat{" "}
          <Link href="/structure">daftar pengurus</Link>.
        </p>
        <p>
          Sebutkan halaman mana, apa yang kamu coba lakukan, dan perangkat serta
          alat bantu yang kamu pakai. Itu sangat membantu kami menelusurinya.
        </p>
      </div>
    </div>
  );
}
