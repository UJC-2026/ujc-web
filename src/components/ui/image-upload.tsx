"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

// "partners" is the odd one out: its policies gate on the pengurus role rather
// than on the folder, because a partner logo belongs to the organisation
// rather than to whoever happened to upload it (0031).
type Bucket = "avatars" | "marketplace" | "blog" | "gallery" | "partners";

/**
 * Uploads straight to Supabase Storage from the browser, then hands the public
 * URL back through a hidden input so the surrounding server action just sees a
 * string. Files are written to `{user_id}/…`, which is what the bucket policies
 * check — the path is not a suggestion the client can opt out of.
 */
export function ImageUpload({
  name,
  bucket,
  defaultValue,
  label = "Unggah gambar",
  hint,
  aspect = "aspect-video",
  multiple = false,
}: {
  name: string;
  bucket: Bucket;
  defaultValue?: string | string[];
  label?: string;
  hint?: string;
  aspect?: string;
  multiple?: boolean;
}) {
  const initial = Array.isArray(defaultValue)
    ? defaultValue
    : defaultValue
      ? [defaultValue]
      : [];

  const [urls, setUrls] = useState<string[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    setBusy(true);
    setError(undefined);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Sesi kamu sudah berakhir. Muat ulang halaman lalu coba lagi.");
      setBusy(false);
      return;
    }

    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, file, { upsert: false });

      if (uploadError) {
        // The bucket's own size and MIME limits produce these.
        setError(
          uploadError.message.includes("mime")
            ? "Format berkas tidak didukung. Pakai JPG, PNG, atau WebP."
            : uploadError.message.includes("exceeded")
              ? "Ukuran berkas terlalu besar."
              : "Gambar gagal diunggah. Coba lagi.",
        );
        break;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      uploaded.push(data.publicUrl);
    }

    if (uploaded.length > 0) {
      setUrls((prev) => (multiple ? [...prev, ...uploaded] : uploaded.slice(0, 1)));
    }

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* One input per URL so `formData.getAll(name)` works for galleries. */}
      {urls.map((url) => (
        <input key={url} type="hidden" name={name} value={url} />
      ))}

      {urls.length > 0 && (
        <ul
          className={cn(
            "grid gap-3",
            multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1",
          )}
        >
          {urls.map((url) => (
            <li key={url} className="relative">
              <Image
                src={url}
                alt=""
                width={480}
                height={320}
                className={cn("w-full rounded-field object-cover", aspect)}
              />
              <button
                type="button"
                onClick={() => setUrls((prev) => prev.filter((u) => u !== url))}
                aria-label="Hapus gambar ini"
                className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-pill bg-navy-900/70 text-white transition-colors hover:bg-danger"
              >
                <X className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}

      {(multiple || urls.length === 0) && (
        <label
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2.5 rounded-field border border-dashed border-border px-4 py-6 text-caption font-medium text-muted-foreground transition-colors hover:border-accent hover:text-primary",
            busy && "pointer-events-none opacity-60",
          )}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <ImagePlus className="size-4" aria-hidden />
          )}
          {busy ? "Mengunggah…" : label}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple={multiple}
            disabled={busy}
            onChange={(event) => handleFiles(event.target.files)}
            className="sr-only"
          />
        </label>
      )}

      {hint && <p className="text-caption text-muted-foreground">{hint}</p>}
    </div>
  );
}
