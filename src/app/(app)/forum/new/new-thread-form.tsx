"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/editor/rich-text-editor";
import { createThread, type ForumState } from "../actions";
import type { ForumCategory } from "@/lib/forum/types";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Memposting…" : "Posting thread"}
    </Button>
  );
}

export function NewThreadForm({
  categories,
  defaultCategoryId,
}: {
  categories: ForumCategory[];
  defaultCategoryId: string;
}) {
  const [state, formAction] = useActionState<ForumState, FormData>(
    createThread,
    {},
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {state.error}
        </p>
      )}

      <Field label="Kategori" htmlFor="categoryId">
        <select
          id="categoryId"
          name="categoryId"
          defaultValue={defaultCategoryId}
          required
          className="h-11 w-full rounded-field border border-border bg-surface px-3.5 text-body text-foreground transition-colors hover:border-border-strong focus-visible:border-primary"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>

      <Field
        label="Judul"
        htmlFor="title"
        hint="Judul yang spesifik lebih cepat dapat jawaban."
      >
        <Input
          id="title"
          name="title"
          required
          minLength={10}
          maxLength={160}
          placeholder="Contoh: Cara perpanjang visa student sambil kerja part-time?"
        />
      </Field>

      <div className="space-y-1.5">
        <span className="text-caption font-medium text-foreground">Isi</span>
        <RichTextEditor
          name="content"
          placeholder="Ceritakan detailnya — situasimu, apa yang sudah dicoba, dan apa yang ingin kamu tahu."
        />
      </div>

      <Field
        label="Tag"
        htmlFor="tags"
        hint="Pisahkan dengan koma atau spasi. Maksimal 5 tag. Contoh: visa, kerja, kuliah"
      >
        <Input id="tags" name="tags" placeholder="visa, kerja" />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <Button asChild variant="ghost">
          <Link href="/forum">Batal</Link>
        </Button>
      </div>
    </form>
  );
}
