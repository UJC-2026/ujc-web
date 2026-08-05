import type { Metadata } from "next";
import Link from "next/link";
import { Download, ShieldAlert } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { DeleteAccountForm } from "@/components/settings/delete-account-form";

export const metadata: Metadata = {
  title: "Data & akun",
  robots: { index: false },
};

export default async function DataSettingsPage() {
  const profile = await requireProfile();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/profile" className="transition-colors hover:text-primary">
          Profil
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">Data &amp; akun</span>
      </nav>

      <h1 className="rule-gold mt-4 text-h1 text-foreground">Data &amp; akun</h1>
      <p className="mt-5 text-body text-muted-foreground">
        Ambil salinan datamu atau tutup akunmu sendiri, tanpa perlu menunggu
        pengurus memprosesnya.
      </p>

      <section className="mt-9 rounded-panel border border-border bg-surface p-6">
        <h2 className="flex items-center gap-2 text-h3 text-foreground">
          <Download className="size-5 shrink-0 text-primary" aria-hidden />
          Unduh datamu
        </h2>
        <p className="mt-4 text-body text-muted-foreground">
          Berisi profil, tulisan forum, artikel, barang marketplace, riwayat
          CBT, sertifikat, donasi, dan sisanya — satu berkas JSON.
        </p>
        <p className="mt-2 text-caption text-muted-foreground">
          Berkasnya memuat data pribadimu. Simpan di tempat yang aman.
        </p>

        {/* A plain link, not fetch(): the browser handles the download and the
            file never has to pass through the page. */}
        <Button asChild variant="outline" className="mt-5">
          <a href="/settings/data/export" download>
            <Download aria-hidden />
            Unduh berkas JSON
          </a>
        </Button>
      </section>

      <section className="mt-6 rounded-panel border border-danger/30 bg-danger/5 p-6">
        <h2 className="flex items-center gap-2 text-h3 text-foreground">
          <ShieldAlert className="size-5 shrink-0 text-danger" aria-hidden />
          Hapus akun
        </h2>
        <p className="mt-4 text-body text-muted-foreground">
          Menghapus akun akan menghapus profil, tulisan forum, artikel, barang
          marketplace, pesan, dan riwayat aktivitasmu. Tindakan ini tidak bisa
          dibatalkan.
        </p>
        <p className="mt-2 text-body text-muted-foreground">
          Catatan yang menjadi milik komunitas — donasi UJC Peduli, pembukuan,
          dan jejak audit — tetap tersimpan, tetapi tidak lagi terhubung dengan
          namamu.
        </p>

        {profile.role === "admin" && (
          <p className="mt-4 rounded-field border border-border bg-surface px-4 py-3 text-caption text-muted-foreground">
            Kamu admin. Kalau kamu satu-satunya admin yang tersisa, penghapusan
            akan ditolak — angkat admin lain lebih dulu.
          </p>
        )}

        <DeleteAccountForm />
      </section>
    </div>
  );
}
