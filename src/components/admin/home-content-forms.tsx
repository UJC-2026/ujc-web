"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import {
  addPartner,
  saveHomeVideo,
  type HomeContentState,
} from "@/app/(app)/admin/beranda/actions";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? pendingLabel : label}
    </Button>
  );
}

function ErrorNote({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      {message}
    </p>
  );
}

export function HomeVideoForm({ currentUrl }: { currentUrl: string | null }) {
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result: HomeContentState = await saveHomeVideo({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success);
  }

  return (
    <form action={handleSubmit} className="mt-6 space-y-4">
      <ErrorNote message={error} />

      <Field
        label="Tautan video YouTube"
        htmlFor="url"
        hint="Kosongkan untuk menyembunyikan section video dari beranda."
      >
        <Input
          id="url"
          name="url"
          defaultValue={currentUrl ?? ""}
          autoComplete="off"
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </Field>

      <Submit label="Simpan video" pendingLabel="Menyimpan…" />
    </form>
  );
}

export function AddPartnerForm() {
  const [error, setError] = useState<string>();
  // Remounts the fields after a successful add so the form comes back empty;
  // `state.success` in an effect would not re-fire for an identical message.
  const [formKey, setFormKey] = useState(0);

  async function handleSubmit(formData: FormData) {
    const result: HomeContentState = await addPartner({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setFormKey((key) => key + 1);
    toast.success(result.success);
  }

  return (
    <form key={formKey} action={handleSubmit} className="mt-6 space-y-4">
      <ErrorNote message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama partner" htmlFor="name">
          <Input id="name" name="name" required minLength={2} maxLength={120} />
        </Field>

        <Field label="Urutan tampil" htmlFor="sortOrder" hint="Angka kecil tampil lebih dulu.">
          <Input
            id="sortOrder"
            name="sortOrder"
            type="number"
            min={0}
            max={999}
            defaultValue={0}
          />
        </Field>
      </div>

      <Field label="Situs web" htmlFor="websiteUrl" hint="Opsional.">
        <Input id="websiteUrl" name="websiteUrl" placeholder="https://" />
      </Field>

      <ImageUpload
        name="logoUrl"
        bucket="partners"
        label="Logo partner"
        hint="Opsional. Kalau kosong, nama partner yang ditampilkan."
        aspect="aspect-[3/1]"
      />

      <Field label="Deskripsi singkat" htmlFor="description" hint="Opsional, maksimal 200 karakter.">
        <Textarea id="description" name="description" rows={2} maxLength={200} />
      </Field>

      <Submit label="Tambah partner" pendingLabel="Menambahkan…" />
    </form>
  );
}
