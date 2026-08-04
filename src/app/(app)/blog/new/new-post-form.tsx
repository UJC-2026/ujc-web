"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { ImageUpload } from "@/components/ui/image-upload";
import { createPost } from "../actions";

const CATEGORIES = [
  "Pengalaman kerja",
  "Kuliah sambil kerja",
  "Hidup di Jepang",
  "Bahasa & budaya",
  "Visa & administrasi",
  "Lainnya",
];

const selectClass =
  "h-11 w-full rounded-field border border-border bg-surface px-3.5 text-body text-foreground transition-colors hover:border-border-strong focus-visible:border-primary";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Menyimpan…" : "Kirim untuk ditinjau"}
    </Button>
  );
}

export function NewPostForm() {
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await createPost({}, formData);
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

      <Field label="Judul" htmlFor="title">
        <Input
          id="title"
          name="title"
          required
          minLength={8}
          maxLength={160}
          placeholder="Contoh: Setahun kerja di pabrik sambil kuliah daring"
        />
      </Field>

      <Field label="Kategori" htmlFor="category">
        <select id="category" name="category" defaultValue="" className={selectClass}>
          <option value="">Pilih kategori</option>
          {CATEGORIES.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </Field>

      <div className="space-y-1.5">
        <span className="text-caption font-medium text-foreground">Gambar sampul</span>
        <ImageUpload
          name="coverImage"
          bucket="blog"
          label="Unggah sampul"
          hint="Opsional. Maksimal 5 MB."
        />
      </div>

      <div className="space-y-1.5">
        <span className="text-caption font-medium text-foreground">Isi artikel</span>
        <RichTextEditor
          name="content"
          placeholder="Mulai dari apa yang paling ingin kamu ceritakan…"
          minHeight="20rem"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <Button asChild variant="ghost">
          <Link href="/blog">Batal</Link>
        </Button>
      </div>
    </form>
  );
}
