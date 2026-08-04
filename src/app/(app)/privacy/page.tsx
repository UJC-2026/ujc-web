import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, ToFill } from "@/components/legal/draft-notice";

export const metadata: Metadata = {
  title: "Kebijakan privasi",
  description:
    "Data apa yang dikumpulkan UJC, untuk apa dipakai, siapa yang bisa melihatnya, dan bagaimana kamu mengendalikannya.",
};

/**
 * The factual sections below describe what the application genuinely does —
 * they are derived from the database schema and the RLS policies, not written
 * aspirationally. The bracketed placeholders are commitments only the
 * organisation can make.
 */
export default function PrivacyPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="rule-gold text-h1 text-foreground">Kebijakan privasi</h1>
      <p className="mt-5 text-body text-muted-foreground">
        Halaman ini menjelaskan data apa yang dikumpulkan website UJC, untuk apa
        dipakai, siapa yang bisa melihatnya, dan bagaimana kamu
        mengendalikannya.
      </p>

      <div className="mt-8">
        <DraftNotice>
          Bagian yang menjelaskan cara kerja sistem sudah sesuai dengan
          implementasi sebenarnya. Bagian yang ditandai kurung siku adalah
          komitmen organisasi yang harus diisi dan disetujui pengurus sebelum
          halaman ini dianggap berlaku.
        </DraftNotice>
      </div>

      <div className="prose-ujc mt-10">
        <h2>Data yang kami kumpulkan</h2>
        <p>Hanya yang kamu isikan sendiri, ditambah catatan aktivitasmu di website:</p>
        <ul>
          <li>
            <strong>Identitas &amp; akademik</strong> — nama, email, NIM, kelas,
            program studi, angkatan.
          </li>
          <li>
            <strong>Domisili</strong> — prefektur dan kota. Kami{" "}
            <strong>tidak</strong> meminta alamat lengkap maupun koordinat.
          </li>
          <li>
            <strong>Profil opsional</strong> — foto, bio, motto, tautan sosial.
          </li>
          <li>
            <strong>Aktivitas</strong> — thread, balasan, komentar, artikel,
            barang yang dijual, tawaran lelang, RSVP kegiatan, hasil latihan
            CBT, poin, dan pesan langsung.
          </li>
          <li>
            <strong>Pengajuan UJC Peduli</strong> — cerita dan perkiraan
            kebutuhan dana, bila kamu mengajukan bantuan.
          </li>
        </ul>

        <h2>Siapa yang bisa melihat apa</h2>
        <p>
          Pembatasan di bawah ini dijalankan di lapisan database, bukan sekadar
          disembunyikan dari tampilan.
        </p>
        <ul>
          <li>
            <strong>Profil publik</strong> terlihat anggota lain dan pengunjung.
            Kamu bisa mematikannya lewat <Link href="/profile">halaman profil</Link>;
            setelah dimatikan, kamu hilang dari direktori anggota, papan
            peringkat, dan halaman profilmu tidak bisa dibuka orang lain.
          </li>
          <li>
            <strong>Pesan langsung</strong> hanya bisa dibaca peserta
            percakapan. Pengurus dan admin tidak bisa membacanya.
          </li>
          <li>
            <strong>Lokasi di peta</strong> hanya ditampilkan sebagai jumlah per
            prefektur dan kota. Titik di peta adalah pusat prefektur, bukan
            lokasi siapa pun. Kamu bisa memilih tidak dihitung lewat{" "}
            <Link href="/map">halaman peta</Link>.
          </li>
          <li>
            <strong>Pengajuan UJC Peduli</strong> hanya terbaca ketua, wakil
            ketua, dan bendahara, dan tidak ditampilkan ke anggota lain sampai
            kamu setuju untuk ditampilkan.
          </li>
          <li>
            <strong>Donasi</strong> hanya terlihat donatur yang bersangkutan dan
            bendahara. Kamu bisa memilih anonim; bila anonim, namamu tidak
            ditampilkan di mana pun.
          </li>
          <li>
            <strong>Jawaban latihan CBT</strong> terlihat olehmu dan Divisi
            Pendidikan untuk keperluan evaluasi soal.
          </li>
        </ul>

        <h2>Untuk apa data dipakai</h2>
        <p>
          Menjalankan fitur yang kamu pakai, mempertemukan anggota yang tinggal
          berdekatan, menyalurkan bantuan UJC Peduli, dan menjaga keamanan
          komunitas (moderasi konten dan penanganan laporan). Kami{" "}
          <strong>tidak menjual data anggota</strong> dan tidak memakainya untuk
          iklan.
        </p>

        <h2>Pihak ketiga</h2>
        <p>
          Data disimpan di <strong>Supabase</strong> (database, autentikasi, dan
          penyimpanan berkas). Peta memuat ubin dari{" "}
          <strong>OpenStreetMap</strong>, yang menerima alamat IP-mu saat peta
          ditampilkan — sebagaimana lazimnya permintaan gambar di internet.
        </p>
        <p>
          Lokasi server dan wilayah hukum yang berlaku:{" "}
          <ToFill>diisi pengurus</ToFill>.
        </p>

        <h2>Berapa lama disimpan</h2>
        <p>
          Data akunmu disimpan selama akunmu aktif. Menghapus akun akan menghapus
          profil, pesan, dan aktivitas yang terkait denganmu.
        </p>
        <p>
          Kebijakan penyimpanan catatan keuangan dan penyaluran UJC Peduli:{" "}
          <ToFill>diisi pengurus</ToFill>.
        </p>

        <h2>Hakmu</h2>
        <ul>
          <li>Melihat dan mengubah datamu kapan saja lewat halaman profil.</li>
          <li>Menyembunyikan profil dari publik.</li>
          <li>Keluar dari peta anggota.</li>
          <li>Mematikan jenis notifikasi tertentu.</li>
          <li>
            Meminta ekspor atau penghapusan data pribadimu — hubungi pengurus.
          </li>
        </ul>
        <p>
          Fitur ekspor dan hapus data mandiri belum tersedia di website; saat ini
          permintaan diproses manual oleh pengurus.
        </p>

        <h2>Menghubungi kami</h2>
        <p>
          Pertanyaan soal data pribadi bisa disampaikan ke{" "}
          <ToFill>alamat email resmi UJC</ToFill> atau lewat pesan langsung ke
          pengurus di <Link href="/structure">halaman struktur organisasi</Link>.
        </p>

        <h2>Perubahan</h2>
        <p>
          Bila kebijakan ini berubah, pengurus akan mengumumkannya lewat
          pengumuman komunitas. Terakhir diperbarui:{" "}
          <ToFill>tanggal peninjauan</ToFill>.
        </p>
      </div>
    </div>
  );
}
