import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, ShieldCheck } from "lucide-react";
import { getCityCounts, getPrefectureCounts } from "@/lib/map/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { LocationSettings } from "@/components/map/location-settings";
import { MemberMapClient } from "@/components/map/member-map-client";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal } from "@/components/motion/reveal";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Peta anggota",
  description:
    "Sebaran anggota UJC per prefektur di Jepang — untuk menemukan yang tinggal berdekatan denganmu.",
};

export default async function MapPage() {
  const profile = await getCurrentProfile();

  const [prefectures, cities] = await Promise.all([
    getPrefectureCounts(),
    getCityCounts(),
  ]);

  // Only the member's own row is readable, so this cannot see anyone else's.
  let myLocation = null;
  if (profile) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("member_locations")
      .select("prefecture, city, is_visible")
      .eq("user_id", profile.id)
      .maybeSingle();
    myLocation = data;
  }

  const total = prefectures.reduce((sum, row) => sum + row.member_count, 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-12">
      <Reveal className="max-w-2xl">
        <h1 className="rule-gold text-h1 text-foreground">Peta anggota</h1>
        <p className="mt-5 text-body text-muted-foreground">
          {total.toLocaleString("id-ID")} anggota tersebar di{" "}
          {prefectures.length.toLocaleString("id-ID")} prefektur. Cari yang
          tinggal berdekatan untuk kopdar atau sekadar saling kenal.
        </p>
      </Reveal>

      <p className="mt-6 flex items-start gap-2.5 rounded-field border border-accent/40 bg-accent-muted/30 px-4 py-3 text-caption text-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden />
        Peta ini hanya menampilkan jumlah anggota per prefektur. Titik yang
        terlihat adalah pusat prefektur, bukan lokasi siapa pun — alamat
        anggota tidak pernah dikirim ke halaman ini.
      </p>

      {prefectures.length === 0 ? (
        <div className="mt-10">
          <EmptyState
            icon={MapPin}
            title="Belum ada anggota di peta"
            description="Belum ada yang mengisi domisili dan bersedia tampil. Kamu bisa jadi yang pertama lewat pengaturan di bawah."
          />
        </div>
      ) : (
        <div className="mt-8">
          <MemberMapClient points={prefectures} />
        </div>
      )}

      {cities.length > 0 && (
        <section className="mt-10">
          <h2 className="rule-gold text-h3 text-foreground">Per kota</h2>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {cities.map((row) => (
              <li
                key={`${row.prefecture}-${row.city ?? "-"}`}
                className="flex items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
              >
                <MapPin className="size-4 shrink-0 text-primary" aria-hidden />
                <span className="min-w-0 flex-1 truncate text-body text-foreground">
                  {row.city ?? "Tidak disebutkan"}
                  <span className="text-muted-foreground"> · {row.prefecture}</span>
                </span>
                <span className="text-caption font-medium text-accent">
                  {row.member_count.toLocaleString("id-ID")}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-12 rounded-panel border border-border bg-surface p-6">
        <h2 className="text-h3 text-foreground">Domisilimu di peta</h2>
        {profile ? (
          <div className="mt-5">
            <LocationSettings current={myLocation} />
          </div>
        ) : (
          <p className="mt-4 text-body text-muted-foreground">
            <Link href="/login?next=/map" className="text-primary hover:underline">
              Masuk
            </Link>{" "}
            untuk menambahkan domisilimu — atau memilih untuk tidak tampil.
          </p>
        )}
      </section>
    </div>
  );
}
