"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { CollapsibleForm } from "./collapsible-form";
import {
  createBoardPost,
  createCalendarEntry,
  createCashEntry,
  createContentSlot,
  createMeetingNote,
  createProgram,
  createTask,
  type DashboardState,
} from "@/app/(app)/dashboard/actions";
import { DIVISI_LABEL, type Divisi } from "@/lib/supabase/types";
import type { PengurusOption, Program } from "@/lib/dashboard/queries";

const selectClass =
  "h-11 w-full rounded-field border border-border bg-surface px-3.5 text-body text-foreground transition-colors hover:border-border-strong focus-visible:border-primary";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" loading={pending}>
      {pending ? "Menyimpan…" : label}
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

/** Shared submit handling: report the error inline, toast + close on success. */
function useFormAction(
  action: (prev: DashboardState, data: FormData) => Promise<DashboardState>,
  close: () => void,
) {
  const [error, setError] = useState<string>();

  return {
    error,
    handle: async (formData: FormData) => {
      const result = await action({}, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setError(undefined);
      toast.success(result.success);
      close();
    },
  };
}

export function ProgramForm({ divisiOptions }: { divisiOptions: Divisi[] }) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <CollapsibleForm openLabel="Tambah proker" title="Program kerja baru">
      {(close) => <ProgramFields divisiOptions={divisiOptions} close={close} today={today} />}
    </CollapsibleForm>
  );
}

function ProgramFields({
  divisiOptions,
  close,
  today,
}: {
  divisiOptions: Divisi[];
  close: () => void;
  today: string;
}) {
  const { error, handle } = useFormAction(createProgram, close);

  return (
    <form action={handle} className="space-y-5">
      <ErrorNote message={error} />

      <Field label="Divisi" htmlFor="divisi">
        <select id="divisi" name="divisi" required className={selectClass}>
          {divisiOptions.map((divisi) => (
            <option key={divisi} value={divisi}>
              {DIVISI_LABEL[divisi]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Judul proker" htmlFor="title">
        <Input id="title" name="title" required minLength={4} maxLength={140} />
      </Field>

      <Field label="Deskripsi" htmlFor="description" hint="Opsional.">
        <Textarea id="description" name="description" rows={3} />
      </Field>

      <Field
        label="Target / indikator"
        htmlFor="target"
        hint="Opsional. Contoh: 6 kopdar dalam setahun."
      >
        <Input id="target" name="target" />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Mulai" htmlFor="startDate">
          <Input id="startDate" name="startDate" type="date" defaultValue={today} />
        </Field>
        <Field label="Selesai" htmlFor="endDate">
          <Input id="endDate" name="endDate" type="date" />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Anggaran (¥)" htmlFor="budget" hint="Opsional.">
          <Input id="budget" name="budget" type="number" min={0} step={1} />
        </Field>
        <Field label="Status" htmlFor="status">
          <select id="status" name="status" defaultValue="rencana" className={selectClass}>
            <option value="rencana">Rencana</option>
            <option value="berjalan">Berjalan</option>
            <option value="tertunda">Tertunda</option>
            <option value="selesai">Selesai</option>
          </select>
        </Field>
      </div>

      <SubmitButton label="Simpan proker" />
    </form>
  );
}

export function TaskForm({
  programs,
  pengurus,
}: {
  programs: Program[];
  pengurus: PengurusOption[];
}) {
  return (
    <CollapsibleForm openLabel="Tambah tugas" title="Tugas baru">
      {(close) => (
        <TaskFields programs={programs} pengurus={pengurus} close={close} />
      )}
    </CollapsibleForm>
  );
}

function TaskFields({
  programs,
  pengurus,
  close,
}: {
  programs: Program[];
  pengurus: PengurusOption[];
  close: () => void;
}) {
  const { error, handle } = useFormAction(createTask, close);

  return (
    <form action={handle} className="space-y-5">
      <ErrorNote message={error} />

      <Field label="Judul tugas" htmlFor="task-title">
        <Input
          id="task-title"
          name="title"
          required
          minLength={4}
          maxLength={140}
          placeholder="Contoh: Desain poster kopdar"
        />
      </Field>

      <Field label="Deskripsi" htmlFor="task-description" hint="Opsional.">
        <Textarea id="task-description" name="description" rows={2} />
      </Field>

      <Field label="Penanggung jawab" htmlFor="assignedTo">
        <select id="assignedTo" name="assignedTo" required className={selectClass}>
          {pengurus.map((option) => (
            <option key={option.id} value={option.id}>
              {option.full_name} — {DIVISI_LABEL[option.divisi]}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Bagian dari proker" htmlFor="programId" hint="Opsional.">
        <select id="programId" name="programId" defaultValue="" className={selectClass}>
          <option value="">Tidak terkait proker</option>
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.title}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Tenggat" htmlFor="dueDate" hint="Opsional.">
          <Input id="dueDate" name="dueDate" type="date" />
        </Field>
        <Field label="Prioritas" htmlFor="priority">
          <select id="priority" name="priority" defaultValue="sedang" className={selectClass}>
            <option value="rendah">Rendah</option>
            <option value="sedang">Sedang</option>
            <option value="tinggi">Tinggi</option>
          </select>
        </Field>
      </div>

      <SubmitButton label="Buat tugas" />
    </form>
  );
}

export function NoteForm() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <CollapsibleForm openLabel="Tambah notulen" title="Notulen rapat baru">
      {(close) => <NoteFields close={close} today={today} />}
    </CollapsibleForm>
  );
}

function NoteFields({ close, today }: { close: () => void; today: string }) {
  const { error, handle } = useFormAction(createMeetingNote, close);

  return (
    <form action={handle} className="space-y-5">
      <ErrorNote message={error} />

      <Field label="Judul rapat" htmlFor="note-title">
        <Input
          id="note-title"
          name="title"
          required
          minLength={4}
          maxLength={140}
          placeholder="Contoh: Rapat koordinasi kopdar Kanto"
        />
      </Field>

      <Field label="Tanggal rapat" htmlFor="meetingDate">
        <Input
          id="meetingDate"
          name="meetingDate"
          type="date"
          defaultValue={today}
          required
        />
      </Field>

      <Field label="Isi notulen" htmlFor="note-content" hint="Opsional.">
        <Textarea
          id="note-content"
          name="content"
          rows={5}
          placeholder="Poin pembahasan, keputusan, dan tindak lanjut…"
        />
      </Field>

      <SubmitButton label="Simpan notulen" />
    </form>
  );
}

export function ContentSlotForm() {
  // datetime-local wants "YYYY-MM-DDTHH:mm" in local time, not an ISO string.
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <CollapsibleForm openLabel="Jadwalkan konten" title="Jadwal konten baru">
      {(close) => <ContentSlotFields close={close} now={local} />}
    </CollapsibleForm>
  );
}

function ContentSlotFields({
  close,
  now,
}: {
  close: () => void;
  now: string;
}) {
  const { error, handle } = useFormAction(createContentSlot, close);

  return (
    <form action={handle} className="space-y-5">
      <ErrorNote message={error} />

      <Field label="Judul konten" htmlFor="slot-title">
        <Input
          id="slot-title"
          name="title"
          required
          minLength={4}
          maxLength={140}
          placeholder="Contoh: Reels kegiatan kopdar Kanto"
        />
      </Field>

      <Field
        label="Jenis"
        htmlFor="slot-type"
        hint="Opsional. Contoh: Instagram, YouTube, pengumuman."
      >
        <Input id="slot-type" name="type" />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Jadwal tayang" htmlFor="scheduledAt">
          <Input
            id="scheduledAt"
            name="scheduledAt"
            type="datetime-local"
            defaultValue={now}
            required
          />
        </Field>
        <Field label="Status" htmlFor="slot-status">
          <select
            id="slot-status"
            name="status"
            defaultValue="rencana"
            className={selectClass}
          >
            <option value="rencana">Rencana</option>
            <option value="proses">Proses</option>
            <option value="terbit">Terbit</option>
          </select>
        </Field>
      </div>

      <SubmitButton label="Simpan jadwal" />
    </form>
  );
}

export function BoardPostForm() {
  return (
    <CollapsibleForm openLabel="Tulis pesan" title="Pesan baru di papan internal">
      {(close) => <BoardPostFields close={close} />}
    </CollapsibleForm>
  );
}

function BoardPostFields({ close }: { close: () => void }) {
  const { error, handle } = useFormAction(createBoardPost, close);

  return (
    <form action={handle} className="space-y-5">
      <ErrorNote message={error} />

      <Field label="Judul" htmlFor="board-title">
        <Input
          id="board-title"
          name="title"
          required
          minLength={4}
          maxLength={140}
          placeholder="Contoh: Butuh bantuan desain poster kopdar"
        />
      </Field>

      <Field label="Isi pesan" htmlFor="board-content">
        <Textarea
          id="board-content"
          name="content"
          rows={4}
          required
          minLength={4}
          maxLength={4000}
          placeholder="Jelaskan apa yang dibutuhkan dan kapan tenggatnya…"
        />
      </Field>

      <label className="flex items-center gap-2.5 text-caption text-foreground">
        <input
          type="checkbox"
          name="isPinned"
          value="true"
          className="size-4 rounded border-border accent-[var(--primary)]"
        />
        Sematkan di atas papan
      </label>

      <SubmitButton label="Kirim pesan" />
    </form>
  );
}

export function CalendarEntryForm() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);

  return (
    <CollapsibleForm openLabel="Tambah agenda" title="Agenda baru">
      {(close) => <CalendarEntryFields close={close} now={local} />}
    </CollapsibleForm>
  );
}

function CalendarEntryFields({
  close,
  now,
}: {
  close: () => void;
  now: string;
}) {
  const { error, handle } = useFormAction(createCalendarEntry, close);

  return (
    <form action={handle} className="space-y-5">
      <ErrorNote message={error} />

      <Field label="Judul agenda" htmlFor="cal-title">
        <Input
          id="cal-title"
          name="title"
          required
          minLength={4}
          maxLength={140}
          placeholder="Contoh: Rapat pleno pengurus"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Jenis" htmlFor="cal-type">
          <select
            id="cal-type"
            name="type"
            defaultValue="rapat"
            className={selectClass}
          >
            <option value="rapat">Rapat</option>
            <option value="event">Kegiatan</option>
            <option value="deadline">Tenggat</option>
            <option value="penting">Tanggal penting</option>
          </select>
        </Field>
        <Field label="Waktu" htmlFor="startAt">
          <Input
            id="startAt"
            name="startAt"
            type="datetime-local"
            defaultValue={now}
            required
          />
        </Field>
      </div>

      <SubmitButton label="Simpan agenda" />
    </form>
  );
}

export function CashForm() {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <CollapsibleForm openLabel="Catat transaksi" title="Transaksi kas baru">
      {(close) => <CashFields close={close} today={today} />}
    </CollapsibleForm>
  );
}

function CashFields({ close, today }: { close: () => void; today: string }) {
  const { error, handle } = useFormAction(createCashEntry, close);

  return (
    <form action={handle} className="space-y-5">
      <ErrorNote message={error} />

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Jenis" htmlFor="type">
          <select id="type" name="type" defaultValue="pemasukan" className={selectClass}>
            <option value="pemasukan">Pemasukan</option>
            <option value="pengeluaran">Pengeluaran</option>
          </select>
        </Field>
        <Field label="Jumlah (¥)" htmlFor="amount">
          <Input id="amount" name="amount" type="number" min={1} step={1} required />
        </Field>
      </div>

      <Field
        label="Kategori"
        htmlFor="category"
        hint="Opsional. Contoh: Iuran anggota, Kegiatan, Operasional."
      >
        <Input id="category" name="category" />
      </Field>

      <Field label="Keterangan" htmlFor="cash-description" hint="Opsional.">
        <Input id="cash-description" name="description" />
      </Field>

      <Field label="Tanggal" htmlFor="occurredOn">
        <Input
          id="occurredOn"
          name="occurredOn"
          type="date"
          defaultValue={today}
          required
        />
      </Field>

      <SubmitButton label="Catat transaksi" />
    </form>
  );
}
