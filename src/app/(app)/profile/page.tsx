import type { Metadata } from "next";
import { requireProfile } from "@/lib/auth/session";
import { profileCompletion } from "@/lib/validations/profile";
import { ProfileForm } from "@/components/profile/profile-form";
import { Avatar } from "@/components/ui/avatar";
import { RoleBadge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Profil saya",
};

export default async function ProfilePage() {
  const profile = await requireProfile();
  const completion = profileCompletion(profile);

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
    </div>
  );
}
