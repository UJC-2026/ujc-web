"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { PREFECTURES } from "@/lib/validations/profile";
import { createJob } from "../actions";

const selectClass =
  "h-11 w-full rounded-field border border-border bg-surface px-3.5 text-body text-foreground transition-colors hover:border-border-strong focus-visible:border-primary";

const VISA_TYPES = [
  "SSW (Tokutei Ginou)",
  "Ginou Jisshu",
  "Gijutsu / Jinbun Chishiki",
  "Ryugaku (pelajar)",
  "Teijusha / Eijusha",
  "Working Holiday",
];

const CONTRACT_TYPES = ["Seishain", "Keiyaku shain", "Haken", "Baito / paruh waktu"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Menyimpan…" : "Kirim untuk ditinjau"}
    </Button>
  );
}

export function NewJobForm() {
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await createJob({}, formData);
    // Success redirects, so anything returned here is a failure.
    if (result?.error) setError(result.error);
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <Field label="Judul posisi" htmlFor="title">
        <Input id="title" name="title" required minLength={6} maxLength={140}
          placeholder="Contoh: Operator produksi shift malam" />
      </Field>

      <Field label="Nama perusahaan" htmlFor="company">
        <Input id="company" name="company" required minLength={2} maxLength={140} />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Prefektur" htmlFor="locationPrefecture">
          <select id="locationPrefecture" name="locationPrefecture" defaultValue="" className={selectClass}>
            <option value="">Pilih prefektur</option>
            {PREFECTURES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </Field>

        <Field label="Tipe kontrak" htmlFor="contractType">
          <select id="contractType" name="contractType" defaultValue="" className={selectClass}>
            <option value="">Pilih tipe</option>
            {CONTRACT_TYPES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Gaji minimum (¥)" htmlFor="salaryMin" hint="Opsional.">
          <Input id="salaryMin" name="salaryMin" type="number" min={0} step={1} />
        </Field>
        <Field label="Gaji maksimum (¥)" htmlFor="salaryMax" hint="Opsional.">
          <Input id="salaryMax" name="salaryMax" type="number" min={0} step={1} />
        </Field>
      </div>

      <fieldset className="rounded-field border border-border p-4">
        <legend className="px-1.5 text-caption font-medium text-foreground">
          Tipe visa yang diterima
        </legend>
        <div className="mt-2 space-y-2.5">
          {VISA_TYPES.map((visa) => (
            <label key={visa} className="flex items-center gap-2.5 text-caption text-foreground">
              <input type="checkbox" name="visaTypes" value={visa}
                className="size-4 rounded border-border accent-[var(--primary)]" />
              {visa}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Tenggat lamaran" htmlFor="deadline" hint="Opsional.">
        <Input id="deadline" name="deadline" type="date" />
      </Field>

      <Field label="Deskripsi pekerjaan" htmlFor="description">
        <Textarea id="description" name="description" rows={5}
          placeholder="Jam kerja, lokasi kerja, tugas harian, fasilitas…" />
      </Field>

      <Field label="Persyaratan" htmlFor="requirements">
        <Textarea id="requirements" name="requirements" rows={4}
          placeholder="Level bahasa Jepang, pengalaman, sertifikat…" />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <Button asChild variant="ghost">
          <Link href="/jobs">Batal</Link>
        </Button>
      </div>
    </form>
  );
}
