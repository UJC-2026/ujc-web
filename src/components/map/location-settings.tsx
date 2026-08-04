"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PREFECTURES } from "@/lib/validations/profile";
import { saveLocation } from "@/app/(app)/map/actions";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? "Menyimpan…" : "Simpan"}
    </Button>
  );
}

export function LocationSettings({
  current,
}: {
  current: { prefecture: string; city: string | null; is_visible: boolean } | null;
}) {
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await saveLocation({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success, { duration: 6000 });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {error && (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-field border border-danger/30 bg-danger/8 px-3.5 py-3 text-caption text-danger"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Prefektur" htmlFor="prefecture">
          <select
            id="prefecture"
            name="prefecture"
            required
            defaultValue={current?.prefecture ?? ""}
            className="h-11 w-full rounded-field border border-border bg-surface px-3.5 text-body text-foreground transition-colors hover:border-border-strong focus-visible:border-primary"
          >
            <option value="">Pilih prefektur</option>
            {PREFECTURES.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </Field>

        <Field label="Kota" htmlFor="city" hint="Opsional. Cukup nama kota, bukan alamat.">
          <Input id="city" name="city" defaultValue={current?.city ?? ""} />
        </Field>
      </div>

      <label className="flex items-start gap-2.5 text-caption text-foreground">
        <input
          type="checkbox"
          name="isVisible"
          value="true"
          defaultChecked={current?.is_visible ?? true}
          className="mt-0.5 size-4 rounded border-border accent-[var(--primary)]"
        />
        <span>
          Hitung aku di peta anggota.
          <span className="block text-muted-foreground">
            Yang tampil hanya angka per prefektur dan kota — namamu tidak
            muncul di peta.
          </span>
        </span>
      </label>

      <SubmitButton />
    </form>
  );
}
