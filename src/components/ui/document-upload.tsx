"use client";

import { useRef, useState } from "react";
import { FileUp, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const ACCEPT = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
].join(",");

/**
 * Uploads organisation paperwork to the private `documents` bucket.
 *
 * Unlike ImageUpload this hands back the **object path**, not a URL: the
 * bucket is not public, so a stored link would be dead on arrival. The path is
 * signed into a short-lived URL when the archive is rendered.
 *
 * Files land in `{user_id}/…`, which is exactly what the bucket's insert
 * policy checks — the prefix is not a convention the client can opt out of.
 */
export function DocumentUpload({
  name,
  onFileName,
}: {
  name: string;
  /** Lets the surrounding form prefill its title field from the file name. */
  onFileName?: (fileName: string) => void;
}) {
  const [path, setPath] = useState<string>("");
  const [label, setLabel] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

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

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
    const objectPath = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("documents")
      .upload(objectPath, file, { upsert: false });

    if (uploadError) {
      // The bucket's own MIME allowlist and 10MB ceiling produce these.
      setError(
        uploadError.message.includes("mime")
          ? "Format berkas tidak didukung. Pakai PDF, DOCX, XLSX, JPG, atau PNG."
          : uploadError.message.includes("exceeded")
            ? "Ukuran berkas melebihi 10MB."
            : "Berkas gagal diunggah. Coba lagi.",
      );
      setBusy(false);
      return;
    }

    setPath(objectPath);
    setLabel(file.name);
    onFileName?.(file.name.replace(/\.[^.]+$/, ""));
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={path} />

      {path && (
        <div className="flex items-center gap-3 rounded-field border border-border bg-surface px-3.5 py-3">
          <FileUp className="size-4 shrink-0 text-primary" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-caption text-foreground">
            {label}
          </span>
          <button
            type="button"
            onClick={() => {
              setPath("");
              setLabel("");
            }}
            aria-label="Hapus berkas terpilih"
            className="flex size-7 shrink-0 items-center justify-center rounded-pill text-muted-foreground transition-colors hover:bg-surface-muted hover:text-danger"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="text-caption text-danger">
          {error}
        </p>
      )}

      {!path && (
        <label
          className={cn(
            "flex cursor-pointer items-center justify-center gap-2.5 rounded-field border border-dashed border-border px-4 py-6 text-caption font-medium text-muted-foreground transition-colors hover:border-accent hover:text-primary",
            busy && "pointer-events-none opacity-60",
          )}
        >
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden />
          ) : (
            <FileUp className="size-4" aria-hidden />
          )}
          {busy ? "Mengunggah…" : "Pilih berkas"}
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            disabled={busy}
            onChange={(event) => handleFile(event.target.files)}
            className="sr-only"
          />
        </label>
      )}

      <p className="text-caption text-muted-foreground">
        PDF, DOCX, XLSX, JPG, atau PNG. Maksimal 10MB. Hanya pengurus yang bisa
        membukanya.
      </p>
    </div>
  );
}
