"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { PREFECTURES } from "@/lib/validations/profile";
import { createItem } from "../actions";

const selectClass =
  "h-11 w-full rounded-field border border-border bg-surface px-3.5 text-body text-foreground transition-colors hover:border-border-strong focus-visible:border-primary";

const CONDITIONS = ["Seperti baru", "Bekas - mulus", "Bekas - layak pakai", "Butuh perbaikan"];
const CATEGORIES = ["Elektronik", "Furnitur", "Sepeda", "Peralatan dapur", "Pakaian", "Buku", "Lainnya"];

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Memposting…" : "Pasang barang"}
    </Button>
  );
}

export function NewItemForm({
  defaultCity,
  defaultPrefecture,
}: {
  defaultCity: string | null;
  defaultPrefecture: string | null;
}) {
  const [error, setError] = useState<string>();
  const [isGiveaway, setIsGiveaway] = useState(false);
  const [isAuction, setIsAuction] = useState(false);

  async function handleSubmit(formData: FormData) {
    const result = await createItem({}, formData);
    // A successful create redirects, so reaching here means it failed.
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
          minLength={6}
          maxLength={140}
          placeholder="Contoh: Sepeda mamachari bekas, ban baru"
        />
      </Field>

      <div className="space-y-1.5">
        <span className="text-caption font-medium text-foreground">Foto barang</span>
        <ImageUpload
          name="images"
          bucket="marketplace"
          multiple
          label="Tambah foto"
          hint="Sampai 6 foto, maksimal 5 MB per berkas. Foto asli jauh lebih meyakinkan daripada gambar dari internet."
        />
      </div>

      <Field label="Deskripsi" htmlFor="description" hint="Opsional, tapi sangat membantu.">
        <Textarea
          id="description"
          name="description"
          rows={4}
          placeholder="Ceritakan kondisi, usia pemakaian, kelengkapan, dan alasan dijual…"
        />
      </Field>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Kategori" htmlFor="category">
          <select id="category" name="category" defaultValue="" className={selectClass}>
            <option value="">Pilih kategori</option>
            {CATEGORIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Kondisi" htmlFor="condition">
          <select id="condition" name="condition" defaultValue="" className={selectClass}>
            <option value="">Pilih kondisi</option>
            {CONDITIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Kota" htmlFor="city">
          <Input id="city" name="city" defaultValue={defaultCity ?? ""} />
        </Field>
        <Field label="Prefektur" htmlFor="prefecture">
          <select
            id="prefecture"
            name="prefecture"
            defaultValue={defaultPrefecture ?? ""}
            className={selectClass}
          >
            <option value="">Pilih prefektur</option>
            {PREFECTURES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset className="space-y-3 rounded-field border border-border p-4">
        <legend className="px-1.5 text-caption font-medium text-foreground">
          Cara melepas barang
        </legend>

        <label className="flex items-center gap-2.5 text-caption text-foreground">
          <input
            type="checkbox"
            name="isGiveaway"
            value="true"
            checked={isGiveaway}
            onChange={(event) => {
              setIsGiveaway(event.target.checked);
              if (event.target.checked) setIsAuction(false);
            }}
            className="size-4 rounded border-border accent-[var(--primary)]"
          />
          Gratis / give away
        </label>

        <label className="flex items-center gap-2.5 text-caption text-foreground">
          <input
            type="checkbox"
            name="isAuction"
            value="true"
            checked={isAuction}
            onChange={(event) => {
              setIsAuction(event.target.checked);
              if (event.target.checked) setIsGiveaway(false);
            }}
            className="size-4 rounded border-border accent-[var(--primary)]"
          />
          Lelang dengan batas waktu
        </label>
      </fieldset>

      {!isGiveaway && (
        <Field
          label={isAuction ? "Harga awal lelang (¥)" : "Harga (¥)"}
          htmlFor="price"
          hint={
            isAuction
              ? "Tawaran pertama tidak boleh di bawah angka ini."
              : "Kosongkan kalau harganya nego."
          }
        >
          <Input id="price" name="price" type="number" min={0} step={1} />
        </Field>
      )}

      {isAuction && (
        <Field label="Lelang berakhir" htmlFor="auctionEndAt">
          <Input
            id="auctionEndAt"
            name="auctionEndAt"
            type="datetime-local"
            required
          />
        </Field>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton />
        <Button asChild variant="ghost">
          <Link href="/marketplace">Batal</Link>
        </Button>
      </div>
    </form>
  );
}
