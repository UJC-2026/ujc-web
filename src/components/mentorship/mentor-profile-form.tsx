"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { upsertMentorProfile } from "@/app/(app)/mentorship/actions";
import type { Mentor } from "@/lib/mentorship/queries";

const FIELDS = [
  "Adaptasi awal di Jepang",
  "Urusan visa & imigrasi",
  "Cari kerja / pindah kerja",
  "Kuliah daring sambil kerja",
  "Bahasa Jepang & JLPT",
  "Keuangan & pajak",
  "Kesehatan & asuransi",
];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Menyimpan…" : "Simpan profil mentor"}
    </Button>
  );
}

export function MentorProfileForm({ mentor }: { mentor: Mentor | null }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await upsertMentorProfile({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success);
    setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        {mentor ? "Ubah profil mentor" : "Daftar sebagai mentor"}
      </Button>
    );
  }

  return (
    <div className="rounded-panel border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-body font-medium text-foreground">
          {mentor ? "Ubah profil mentor" : "Daftar sebagai mentor"}
        </h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Tutup formulir"
          className="flex size-8 items-center justify-center rounded-field text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <form action={handleSubmit} className="mt-5 space-y-5">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <fieldset className="rounded-field border border-border p-4">
          <legend className="px-1.5 text-caption font-medium text-foreground">
            Bidang yang bisa kamu bantu
          </legend>
          <div className="mt-2 space-y-2.5">
            {FIELDS.map((field) => (
              <label
                key={field}
                className="flex items-center gap-2.5 text-caption text-foreground"
              >
                <input
                  type="checkbox"
                  name="expertise"
                  value={field}
                  defaultChecked={mentor?.expertise.includes(field)}
                  className="size-4 rounded border-border accent-[var(--primary)]"
                />
                {field}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Kota" htmlFor="city" hint="Opsional.">
          <Input id="city" name="city" defaultValue={mentor?.city ?? ""} />
        </Field>

        <Field
          label="Ringkasan pengalaman"
          htmlFor="experienceSummary"
          hint="Ceritakan sudah berapa lama di Jepang dan apa yang pernah kamu lalui."
        >
          <Textarea
            id="experienceSummary"
            name="experienceSummary"
            rows={4}
            required
            minLength={20}
            maxLength={2000}
            defaultValue={mentor?.experience_summary ?? ""}
          />
        </Field>

        <Field
          label="Kuota bimbingan"
          htmlFor="capacity"
          hint="Berapa mentee yang sanggup kamu dampingi sekaligus (1-10)."
        >
          <Input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            max={10}
            defaultValue={mentor?.capacity ?? 3}
          />
        </Field>

        <label className="flex items-center gap-2.5 text-caption text-foreground">
          <input
            type="checkbox"
            name="isAvailable"
            value="true"
            defaultChecked={mentor?.is_available ?? true}
            className="size-4 rounded border-border accent-[var(--primary)]"
          />
          Sedang menerima permintaan bimbingan baru
        </label>

        <SubmitButton />
      </form>
    </div>
  );
}
