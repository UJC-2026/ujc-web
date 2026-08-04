"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { uploadPhoto } from "@/app/(app)/gallery/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Menyimpan…" : "Tambahkan ke galeri"}
    </Button>
  );
}

export function GalleryUploadForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [key, setKey] = useState(0);

  async function handleSubmit(formData: FormData) {
    const result = await uploadPhoto({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setKey((value) => value + 1);
    toast.success(result.success);
    setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Unggah foto
      </Button>
    );
  }

  return (
    <section className="rounded-panel border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-body font-medium text-foreground">Unggah foto</h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Tutup formulir"
          className="flex size-8 items-center justify-center rounded-field text-muted-foreground transition-colors hover:bg-surface-muted hover:text-primary"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <form key={key} action={handleSubmit} className="mt-5 space-y-5">
        {error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}

        <ImageUpload
          name="imageUrl"
          bucket="gallery"
          label="Pilih foto"
          hint="Maksimal 5 MB. Pastikan yang ada di foto tidak keberatan fotonya dibagikan."
        />

        <Field label="Keterangan" htmlFor="caption" hint="Opsional.">
          <Input
            id="caption"
            name="caption"
            maxLength={200}
            placeholder="Contoh: Kopdar Kanto di Taman Ueno"
          />
        </Field>

        <SubmitButton />
      </form>
    </section>
  );
}
