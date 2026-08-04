"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { donate, submitPeduliCase } from "@/app/(app)/peduli/actions";

function SubmitButton({ label, busy }: { label: string; busy: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {pending ? busy : label}
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

export function AjukanBantuanForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();

  async function handleSubmit(formData: FormData) {
    const result = await submitPeduliCase({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    toast.success(result.success, { duration: 8000 });
    setOpen(false);
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Plus aria-hidden />
        Ajukan bantuan
      </Button>
    );
  }

  return (
    <section className="rounded-panel border border-border bg-surface p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-h3 text-foreground">Ajukan bantuan</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Pengajuanmu hanya dibaca pengurus dulu. Tidak ada anggota lain yang
            bisa melihatnya sampai kamu dan pengurus sepakat untuk
            menampilkannya.
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
        <ErrorNote message={error} />

        <Field label="Judul singkat" htmlFor="title">
          <Input
            id="title"
            name="title"
            required
            minLength={8}
            maxLength={140}
            placeholder="Contoh: Biaya pengobatan setelah kecelakaan kerja"
          />
        </Field>

        <Field
          label="Kategori"
          htmlFor="category"
          hint="Opsional. Contoh: kesehatan, musibah, ekonomi, visa."
        >
          <Input id="category" name="category" />
        </Field>

        <Field
          label="Ceritakan situasinya"
          htmlFor="description"
          hint="Tulis secukupnya. Kamu tidak wajib membuka detail yang membuatmu tidak nyaman."
        >
          <Textarea
            id="description"
            name="description"
            rows={6}
            required
            minLength={20}
            maxLength={3000}
          />
        </Field>

        <Field
          label="Perkiraan dana dibutuhkan (¥)"
          htmlFor="targetAmount"
          hint="Opsional. Kosongkan kalau belum tahu."
        >
          <Input id="targetAmount" name="targetAmount" type="number" min={1} step={1} />
        </Field>

        <div className="flex flex-wrap items-center gap-3">
          <SubmitButton label="Kirim pengajuan" busy="Mengirim…" />
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
        </div>
      </form>
    </section>
  );
}

const PRESETS = [1000, 3000, 5000, 10000];

export function DonasiForm({ caseId }: { caseId: string }) {
  const [error, setError] = useState<string>();
  const [amount, setAmount] = useState("");
  const [key, setKey] = useState(0);

  async function handleSubmit(formData: FormData) {
    const result = await donate({}, formData);
    if (result.error) {
      setError(result.error);
      return;
    }
    setError(undefined);
    setAmount("");
    setKey((value) => value + 1);
    toast.success(result.success);
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <input type="hidden" name="caseId" value={caseId} />
      <ErrorNote message={error} />

      <div>
        <span className="text-caption font-medium text-foreground">
          Nominal donasi (¥)
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setAmount(String(preset))}
              className="rounded-pill border border-border px-3.5 py-2 text-caption font-medium text-muted-foreground transition-colors hover:border-accent hover:text-primary"
            >
              ¥{preset.toLocaleString("ja-JP")}
            </button>
          ))}
        </div>
        <Input
          id="amount"
          name="amount"
          type="number"
          min={1}
          step={1}
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="Atau isi nominal lain"
          aria-label="Nominal donasi dalam Yen"
          className="mt-3"
        />
      </div>

      <Field label="Pesan dukungan" htmlFor="message" hint="Opsional.">
        <Textarea
          key={key}
          id="message"
          name="message"
          rows={2}
          maxLength={300}
          placeholder="Semoga lekas pulih…"
        />
      </Field>

      <label className="flex items-center gap-2.5 text-caption text-foreground">
        <input
          type="checkbox"
          name="isAnonymous"
          value="true"
          className="size-4 rounded border-border accent-[var(--primary)]"
        />
        Sembunyikan namaku dari daftar donatur
      </label>

      <SubmitButton label="Kirim donasi" busy="Mengirim…" />
    </form>
  );
}
