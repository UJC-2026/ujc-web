"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Label, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { PREFECTURES } from "@/lib/validations/profile";
import { updateProfile } from "@/app/(app)/profile/actions";
import type { Profile } from "@/lib/supabase/types";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Menyimpan…" : label}
    </Button>
  );
}

export function ProfileForm({
  profile,
  submitLabel = "Simpan profil",
  onSaved,
}: {
  profile: Profile;
  submitLabel?: string;
  onSaved?: () => void;
}) {
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await updateProfile({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success);
    onSaved?.();
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="space-y-1.5">
        <span className="text-caption font-medium text-foreground">Foto profil</span>
        <ImageUpload
          name="avatar_url"
          bucket="avatars"
          defaultValue={profile?.avatar_url ?? undefined}
          label="Unggah foto"
          hint="Maksimal 2 MB. JPG, PNG, atau WebP."
          aspect="aspect-square max-w-[10rem]"
        />
      </div>

      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Field label="Nama lengkap" htmlFor="full_name">
        <Input
          id="full_name"
          name="full_name"
          defaultValue={profile.full_name}
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="NIM" htmlFor="nim">
          <Input
            id="nim"
            name="nim"
            inputMode="numeric"
            defaultValue={profile.nim ?? ""}
            required
            placeholder="Contoh: 2210512345"
          />
        </Field>

        <Field label="Kelas" htmlFor="kelas">
          <Input
            id="kelas"
            name="kelas"
            defaultValue={profile.kelas ?? ""}
            required
            placeholder="Contoh: SI-4A"
          />
        </Field>

        <Field label="Program studi" htmlFor="major">
          <Input
            id="major"
            name="major"
            defaultValue={profile.major ?? ""}
            required
            placeholder="Contoh: Sistem Informasi"
          />
        </Field>

        <Field label="Angkatan" htmlFor="angkatan">
          <Input
            id="angkatan"
            name="angkatan"
            inputMode="numeric"
            defaultValue={profile.angkatan ?? ""}
            required
            placeholder="Contoh: 2024"
          />
        </Field>

        <Field label="Prefektur di Jepang" htmlFor="prefecture">
          <select
            id="prefecture"
            name="prefecture"
            defaultValue={profile.prefecture ?? ""}
            required
            className="h-11 w-full rounded-field border border-border bg-surface px-3.5 text-body text-foreground transition-colors hover:border-border-strong focus-visible:border-primary"
          >
            <option value="" disabled>
              Pilih prefektur
            </option>
            {PREFECTURES.map((prefecture) => (
              <option key={prefecture} value={prefecture}>
                {prefecture}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Kota domisili" htmlFor="city">
          <Input
            id="city"
            name="city"
            defaultValue={profile.city ?? ""}
            required
            placeholder="Contoh: Nagoya"
          />
        </Field>
      </div>

      <Field
        label="Motto"
        htmlFor="motto"
        hint="Kalimat singkat yang tampil di kartu profilmu."
      >
        <Input
          id="motto"
          name="motto"
          maxLength={120}
          defaultValue={profile.motto ?? ""}
          placeholder="Ganbarimasu!"
        />
      </Field>

      <Field label="Bio" htmlFor="bio" hint="Maksimal 280 karakter.">
        <Textarea
          id="bio"
          name="bio"
          maxLength={280}
          defaultValue={profile.bio ?? ""}
          placeholder="Ceritakan singkat tentang dirimu, pekerjaan, atau minatmu."
        />
      </Field>

      <div className="flex items-start gap-3 rounded-card border border-border bg-surface-muted/50 p-4">
        <input
          id="is_profile_public"
          name="is_profile_public"
          type="checkbox"
          defaultChecked={profile.is_profile_public}
          className="mt-0.5 size-4 accent-[var(--primary)]"
        />
        <div>
          <Label htmlFor="is_profile_public">Tampilkan profil ke publik</Label>
          <p className="mt-1 text-caption text-muted-foreground">
            Kalau dimatikan, profilmu hanya terlihat olehmu dan moderator.
          </p>
        </div>
      </div>

      <SubmitButton label={submitLabel} />
    </form>
  );
}
