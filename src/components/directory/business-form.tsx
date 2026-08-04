"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { submitBusiness } from "@/app/(app)/business/actions";

const CATEGORIES = [
  "Jasa titip", "Terjemahan", "Katering & makanan", "Potong rambut",
  "Fotografi", "Les & bimbingan", "Jasa kirim", "Lainnya",
];

const selectClass =
  "h-11 w-full rounded-field border border-border bg-surface px-3.5 text-body text-foreground transition-colors hover:border-border-strong focus-visible:border-primary";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Mengirim…" : "Kirim untuk ditinjau"}
    </Button>
  );
}

export function BusinessForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await submitBusiness({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success, { duration: 7000 });
    setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Daftarkan usahamu
      </Button>
    );
  }

  return (
    <section className="rounded-panel border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-h3 text-foreground">Daftarkan usahamu</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Pengurus meninjau dulu sebelum usahamu tampil, supaya direktori ini
            tetap bisa dipercaya anggota lain.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Tutup formulir"
          className="flex size-8 shrink-0 items-center justify-center rounded-field text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <form action={handleSubmit} className="mt-6 space-y-5">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <Field label="Nama usaha" htmlFor="name">
          <Input id="name" name="name" required minLength={2} maxLength={120}
            placeholder="Contoh: Titip Jastip Nagoya" />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Kategori" htmlFor="category">
            <select id="category" name="category" defaultValue="" className={selectClass}>
              <option value="">Pilih kategori</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Kota" htmlFor="city">
            <Input id="city" name="city" placeholder="Contoh: Nagoya" />
          </Field>
        </div>

        <Field label="Deskripsi layanan" htmlFor="description">
          <Textarea id="description" name="description" rows={4} required
            minLength={20} maxLength={1000}
            placeholder="Jelaskan apa yang kamu tawarkan, jangkauan wilayah, dan kisaran harga." />
        </Field>

        <Field label="Kontak" htmlFor="contact"
          hint="Nomor WhatsApp, LINE, atau Instagram yang bisa dihubungi.">
          <Input id="contact" name="contact" />
        </Field>

        <div className="space-y-1.5">
          <span className="text-caption font-medium text-foreground">Foto</span>
          <ImageUpload name="images" bucket="gallery" multiple
            label="Tambah foto" hint="Opsional, maksimal 4 foto." />
        </div>

        <Submit />
      </form>
    </section>
  );
}
