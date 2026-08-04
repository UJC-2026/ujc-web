import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, ToFill } from "@/components/legal/draft-notice";

export const metadata: Metadata = {
  title: "Ketentuan layanan",
  description:
    "Aturan komunitas UJC, hak dan tanggung jawab anggota, serta cara moderasi dijalankan.",
};

/**
 * The community rules here match what the moderation system actually enforces
 * (keyword filtering, report queue, verification gates). The commitments that
 * bind the organisation are left as placeholders.
 */
export default function TermsPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <h1 className="rule-gold text-h1 text-foreground">Ketentuan layanan</h1>
      <p className="mt-5 text-body text-muted-foreground">
        Aturan main memakai website UJC, dan apa yang bisa kamu harapkan dari
        pengurus.
      </p>

      <div className="mt-8">
        <DraftNotice>
          Aturan komunitas di bawah sudah sesuai dengan yang benar-benar
          ditegakkan sistem. Bagian dalam kurung siku adalah keputusan
          organisasi yang harus diisi dan disetujui pengurus sebelum halaman ini
          dianggap berlaku.
        </DraftNotice>
      </div>

      <div className="prose-ujc mt-10">
        <h2>Siapa yang boleh bergabung</h2>
        <p>
          Website ini untuk mahasiswa program <em>distance learning</em>{" "}
          Universitas Siber Asia yang tinggal atau bekerja di Jepang, serta
          alumni yang masih aktif di komunitas. Pengurus memverifikasi status
          kemahasiswaan sebelum memberi tanda terverifikasi.
        </p>

        <h2>Aturan komunitas</h2>
        <p>Yang tidak boleh diposting di forum, blog, marketplace, maupun pesan:</p>
        <ul>
          <li>
            <strong>Penipuan</strong> — investasi bodong, penggandaan uang,
            permintaan transfer di muka, dan sejenisnya.
          </li>
          <li>
            <strong>Judi online</strong> dalam bentuk apa pun, termasuk
            promosi situs dan kode rujukan.
          </li>
          <li>
            <strong>Konten dewasa</strong> dan materi yang tidak pantas.
          </li>
          <li>
            <strong>Provokasi</strong> — ujaran kebencian atas dasar suku,
            agama, ras, asal daerah, atau status pekerjaan.
          </li>
          <li>
            Data pribadi orang lain tanpa izin, termasuk foto yang orangnya
            keberatan dibagikan.
          </li>
        </ul>
        <p>
          Sistem menyaring kata kunci secara otomatis dan menandai konten yang
          mencurigakan untuk ditinjau moderator. Penandaan otomatis tidak
          langsung menghapus apa pun — keputusan tetap di tangan moderator.
        </p>

        <h2>Jual beli antar anggota</h2>
        <p>
          UJC menyediakan tempatnya, tetapi <strong>bukan pihak dalam
          transaksi</strong>. Kesepakatan, pembayaran, dan penyerahan barang
          adalah urusan penjual dan pembeli. Tulis kondisi barang sejujurnya, dan
          periksa barang sebelum membayar.
        </p>
        <p>
          Dalam lelang, tawaran yang sudah dikirim tidak bisa ditarik, dan
          penjual tidak boleh menawar barangnya sendiri — keduanya ditegakkan
          sistem.
        </p>

        <h2>Lowongan kerja</h2>
        <p>
          Lowongan hanya boleh dipasang pengurus dan harus lolos tinjauan
          moderator sebelum tampil. <strong>UJC tidak memungut biaya apa pun
          untuk penyaluran kerja.</strong> Bila ada yang meminta uang atas nama
          komunitas, laporkan ke pengurus.
        </p>
        <p>
          UJC tidak menjamin keakuratan isi lowongan maupun hasil lamaranmu.
        </p>

        <h2>UJC Peduli</h2>
        <p>
          Pengajuan bantuan ditinjau pengurus dan tidak ditampilkan ke anggota
          lain tanpa persetujuan pengaju. Donasi bersifat sukarela dan tidak
          dapat ditarik kembali setelah disalurkan.
        </p>
        <p>
          Mekanisme penyaluran, pelaporan, dan pertanggungjawaban dana:{" "}
          <ToFill>diisi pengurus</ToFill>.
        </p>

        <h2>Konten yang kamu buat</h2>
        <p>
          Tulisan, foto, dan barang yang kamu unggah tetap milikmu. Dengan
          mengunggahnya, kamu memberi izin kepada UJC untuk menampilkannya di
          website ini. Kamu bisa menghapus kontenmu kapan saja — kecuali foto
          yang sudah dipilih tampil di beranda, yang penghapusannya lewat
          pengurus.
        </p>

        <h2>Moderasi dan sanksi</h2>
        <p>
          Moderator dapat menghapus konten yang melanggar dan, bila
          pelanggarannya berulang atau berat, membatasi akses akun. Setiap
          tindakan moderasi tercatat dalam catatan tindakan internal.
        </p>
        <p>
          Tahapan sanksi dan mekanisme banding: <ToFill>diisi pengurus</ToFill>.
        </p>

        <h2>Batasan tanggung jawab</h2>
        <p>
          Website ini disediakan apa adanya oleh komunitas yang dijalankan
          sukarela. UJC tidak bertanggung jawab atas kerugian akibat transaksi
          antar anggota, informasi yang diposting anggota, atau gangguan layanan.
        </p>
        <p>
          Ketentuan hukum yang berlaku dan penyelesaian sengketa:{" "}
          <ToFill>diisi pengurus</ToFill>.
        </p>

        <h2>Perubahan</h2>
        <p>
          Ketentuan ini dapat berubah seiring berkembangnya komunitas.
          Perubahan penting akan diumumkan. Terakhir diperbarui:{" "}
          <ToFill>tanggal peninjauan</ToFill>.
        </p>

        <p>
          Lihat juga <Link href="/privacy">kebijakan privasi</Link> dan{" "}
          <Link href="/help">panduan pemakaian website</Link>.
        </p>
      </div>
    </div>
  );
}
