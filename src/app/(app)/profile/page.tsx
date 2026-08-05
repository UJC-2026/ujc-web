import type { Metadata } from "next";
import Link from "next/link";
import { Award, ShieldCheck } from "lucide-react";
import { requireProfile } from "@/lib/auth/session";
import { getMemberBadges, getBadgeCatalogue } from "@/lib/badges/queries";
import { getMyCertificates } from "@/lib/events/checkin";
import { BadgeGrid } from "@/components/badges/badge-grid";
import { profileCompletion } from "@/lib/validations/profile";
import { formatDateID } from "@/lib/format";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Profil saya",
};

export default async function ProfilePage() {
  const profile = await requireProfile();
  const completion = profileCompletion(profile);

  const [certificates, badges, catalogue] = await Promise.all([
    getMyCertificates(profile.id),
    getMemberBadges(profile.id),
    getBadgeCatalogue(),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12">
      <div className="flex items-center gap-4">
        <Avatar src={profile.avatar_url} name={profile.full_name} size="lg" />
        <div>
          <h1 className="text-h2 text-foreground">{profile.full_name}</h1>
          <div className="mt-1.5">
            <RoleBadge role={profile.role} />
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-card border border-border bg-surface p-5">
        <div className="flex items-center justify-between text-caption">
          <span className="font-medium text-foreground">
            Kelengkapan profil
          </span>
          <span className="text-accent font-semibold">{completion}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={completion}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Kelengkapan profil"
          className="mt-2.5 h-2 overflow-hidden rounded-pill bg-surface-muted"
        >
          <div
            className="h-full rounded-pill bg-accent transition-[width] duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
        {completion < 100 && (
          <p className="mt-3 text-caption text-muted-foreground">
            Lengkapi profilmu supaya anggota lain lebih mudah mengenalimu.
          </p>
        )}
      </div>

      <div className="mt-8 rounded-panel border border-border bg-surface p-6 sm:p-7">
        <h2 className="rule-gold text-h3 text-foreground">Data diri</h2>
        <div className="mt-7">
          <ProfileForm profile={profile} />
        </div>
      </div>

      <div className="mt-8 rounded-panel border border-border bg-surface p-6 sm:p-7">
        <h2 className="rule-gold text-h3 text-foreground">Lencana</h2>
        <p className="mt-5 text-caption text-muted-foreground">
          {badges.length > 0
            ? `${badges.length} dari ${catalogue.length} lencana terkumpul.`
            : `Belum ada lencana. Ada ${catalogue.length} yang bisa dikumpulkan dari aktivitas di forum, CBT, blog, kegiatan, dan UJC Peduli.`}
        </p>

        {badges.length > 0 && <BadgeGrid badges={badges} className="mt-5" />}
      </div>

      {certificates.length > 0 && (
        <div className="mt-8 rounded-panel border border-border bg-surface p-6 sm:p-7">
          <h2 className="rule-gold text-h3 text-foreground">E-sertifikat</h2>
          <p className="mt-5 text-caption text-muted-foreground">
            Terbit otomatis setiap kali kehadiranmu di sebuah kegiatan tercatat.
          </p>

          <ul className="mt-5 space-y-2">
            {certificates.map((certificate) => (
              <li key={certificate.certificate_number}>
                <Link
                  href={`/events/${certificate.event?.id}/sertifikat`}
                  className="flex flex-wrap items-center gap-3 rounded-card border border-border px-4 py-3 transition-colors hover:border-accent"
                >
                  <Award className="size-5 shrink-0 text-accent" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-body text-foreground">
                      {certificate.event?.title ?? "Kegiatan UJC"}
                    </span>
                    <span className="block font-mono text-caption text-muted-foreground">
                      {certificate.certificate_number}
                    </span>
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {formatDateID(certificate.issued_at)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/settings/data"
        className="mt-8 flex items-center gap-3 rounded-panel border border-border bg-surface px-6 py-5 transition-colors hover:border-accent"
      >
        <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block text-body font-medium text-foreground">
            Data &amp; akun
          </span>
          <span className="block text-caption text-muted-foreground">
            Unduh salinan datamu, atau hapus akun.
          </span>
        </span>
      </Link>
    </div>
  );
}
