import type { Metadata } from "next";
import Image from "next/image";
import { Handshake, Trash2, Video } from "lucide-react";
import { getPartners, getSiteSetting } from "@/lib/home/queries";
import { requireModerator } from "@/lib/admin/queries";
import { getPengurusRoles } from "@/lib/auth/session";
import {
  AddPartnerForm,
  HomeVideoForm,
} from "@/components/admin/home-content-forms";
import { deletePartner } from "./actions";

export const metadata: Metadata = { title: "Konten beranda" };

export default async function HomeContentPage() {
  const profile = await requireModerator();

  const [partners, videoUrl, divisi] = await Promise.all([
    getPartners(),
    getSiteSetting("home_video_url"),
    getPengurusRoles(profile.id),
  ]);

  // The tables' own policies are what enforce this; the page only decides
  // whether showing the forms would be honest.
  const canEdit = profile.role === "admin" || divisi.includes("media");

  return (
    <div>
      <h2 className="text-h3 text-foreground">Konten beranda</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Video profil komunitas dan daftar partner yang tampil di halaman depan.
      </p>

      {!canEdit && (
        <p className="mt-6 rounded-field border border-border bg-surface px-4 py-3 text-caption text-muted-foreground">
          Hanya admin dan divisi media yang bisa mengubah bagian ini. Kamu bisa
          melihat isinya, tapi perubahannya akan ditolak.
        </p>
      )}

      <section className="mt-8 rounded-panel border border-border bg-surface p-6">
        <h3 className="flex items-center gap-2 text-body font-semibold text-foreground">
          <Video className="size-4.5 text-accent" aria-hidden />
          Video profil komunitas
        </h3>
        <p className="mt-1.5 text-caption text-muted-foreground">
          Tampil di beranda antara bagian fitur dan statistik. Beranda memuat
          gambar sampulnya saja — video baru dimuat setelah pengunjung menekan
          tombol putar.
        </p>

        <HomeVideoForm currentUrl={videoUrl} />
      </section>

      <section className="mt-6 rounded-panel border border-border bg-surface p-6">
        <h3 className="flex items-center gap-2 text-body font-semibold text-foreground">
          <Handshake className="size-4.5 text-accent" aria-hidden />
          Partner &amp; kolaborasi ({partners.length})
        </h3>
        <p className="mt-1.5 text-caption text-muted-foreground">
          Tampil menjelang bagian ajakan bergabung. Kalau daftarnya kosong,
          section-nya tidak ditampilkan sama sekali.
        </p>

        {partners.length > 0 && (
          <ul className="mt-6 space-y-2">
            {partners.map((partner) => (
              <li
                key={partner.id}
                className="flex flex-wrap items-center gap-3 rounded-card border border-border px-4 py-3"
              >
                {partner.logo_url ? (
                  <Image
                    src={partner.logo_url}
                    alt=""
                    width={96}
                    height={32}
                    className="h-8 w-auto max-w-24 object-contain"
                  />
                ) : (
                  <span className="flex size-8 items-center justify-center rounded-field bg-surface-muted text-caption font-semibold text-primary">
                    {partner.name.slice(0, 2).toUpperCase()}
                  </span>
                )}

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-body text-foreground">
                    {partner.name}
                  </span>
                  {partner.website_url && (
                    <span className="block truncate text-caption text-muted-foreground">
                      {partner.website_url}
                    </span>
                  )}
                </span>

                <span className="text-caption text-muted-foreground">
                  urutan {partner.sort_order}
                </span>

                <form action={deletePartner}>
                  <input type="hidden" name="partnerId" value={partner.id} />
                  <button
                    type="submit"
                    aria-label={`Hapus ${partner.name}`}
                    className="flex items-center gap-1.5 rounded-field border border-border px-2.5 py-1.5 text-caption font-medium text-muted-foreground transition-colors hover:border-danger hover:text-danger"
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Hapus
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 border-t border-border pt-6">
          <h4 className="text-caption font-semibold text-foreground">
            Tambah partner
          </h4>
          <AddPartnerForm />
        </div>
      </section>
    </div>
  );
}
