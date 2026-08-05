"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { submitWork } from "@/app/(app)/creative-hub/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Mengirim…" : "Kirim untuk ditinjau"}
    </Button>
  );
}

export function SubmitWorkForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await submitWork({}, formData);
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
        Bagikan karyamu
      </Button>
    );
  }

  return (
    <section className="rounded-panel border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-h3 text-foreground">Bagikan karyamu</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Tempel tautan videomu, foto, tulisan, atau musik. Tautan YouTube
            otomatis tampil dengan thumbnail videonya.
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
          <p role="alert" className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <Field label="Judul karya" htmlFor="title">
          <Input id="title" name="title" required minLength={3} maxLength={120}
            placeholder="Contoh: Vlog sehari kerja di pabrik sambil kuliah" />
        </Field>

        <Field label="Tautan" htmlFor="url"
          hint="YouTube, Instagram, TikTok, Facebook, atau blog pribadi.">
          <Input id="url" name="url" type="url" required
            placeholder="https://www.youtube.com/watch?v=…" />
        </Field>

        <Field label="Cerita singkat" htmlFor="description">
          <Textarea id="description" name="description" rows={3} maxLength={600}
            placeholder="Opsional — konteks di balik karyanya." />
        </Field>

        <Submit />
      </form>
    </section>
  );
}
