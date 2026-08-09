import {
  BookOpen,
  CalendarClock,
  FileText,
  Megaphone,
  NotebookPen,
  Paperclip,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateID, formatDateTimeID, relativeTime } from "@/lib/format";
import {
  NoteForm,
  ContentSlotForm,
  AcademicReminderForm,
  DocumentForm,
} from "../forms";
import type {
  AcademicReminder,
  Announcement,
  CbtCategory,
  ContentSlot,
  MeetingNote,
  OrgDocument,
} from "@/lib/dashboard/queries";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-caption font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  );
}

export function AdministrasiPanel({
  notes,
  documents,
  canWrite,
}: {
  notes: MeetingNote[];
  documents: OrgDocument[];
  canWrite: boolean;
}) {
  return (
    <div>
      <h2 className="text-h3 text-foreground">Administrasi</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Notulen rapat dan arsip dokumen organisasi. Hanya sekretaris yang bisa
        menambah; pengurus lain membaca.
      </p>

      {canWrite && (
        <div className="mt-5">
          <NoteForm />
        </div>
      )}

      <section className="mt-8">
        <SectionHeading>Notulen rapat</SectionHeading>

        {notes.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={NotebookPen}
              title="Belum ada notulen"
              description="Catatan rapat yang dibuat sekretaris akan muncul di sini."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-3">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-card border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <p className="text-body font-medium text-foreground">
                    {note.title}
                  </p>
                  <span className="text-caption text-muted-foreground">
                    {formatDateID(note.meeting_date)}
                  </span>
                </div>
                {note.content && (
                  <p className="mt-2 line-clamp-3 text-caption whitespace-pre-line text-muted-foreground">
                    {note.content}
                  </p>
                )}
                {note.author && (
                  <p className="mt-2 text-caption text-muted-foreground">
                    Dicatat oleh {note.author.full_name}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <SectionHeading>Arsip dokumen</SectionHeading>
        {canWrite && <DocumentForm />}

        {documents.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={Paperclip}
              title="Belum ada dokumen"
              description="Surat dan berkas organisasi yang diunggah akan terdaftar di sini."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
              >
                <FileText className="size-4 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  {doc.isMissing ? (
                    // The row outlived its file. Saying so beats a link that
                    // opens an error page.
                    <p className="truncate text-body text-muted-foreground line-through">
                      {doc.title}
                    </p>
                  ) : (
                    <a
                      href={doc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-body text-foreground transition-colors hover:text-primary"
                    >
                      {doc.title}
                    </a>
                  )}
                  <p className="text-caption text-muted-foreground">
                    {doc.isMissing
                      ? "Berkasnya tidak ada lagi di penyimpanan"
                      : `${doc.category ?? "Tanpa kategori"} · ${relativeTime(doc.created_at)}`}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const SLOT_VARIANT: Record<string, "outline" | "primary" | "success"> = {
  rencana: "outline",
  proses: "primary",
  terbit: "success",
};

export function MediaPanel({
  slots,
  announcements,
  canWrite,
}: {
  slots: ContentSlot[];
  announcements: Announcement[];
  canWrite: boolean;
}) {
  return (
    <div>
      <h2 className="text-h3 text-foreground">Media &amp; publikasi</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Kalender konten dan pengumuman komunitas. Hanya divisi media yang bisa
        menjadwalkan.
      </p>

      {canWrite && (
        <div className="mt-5">
          <ContentSlotForm />
        </div>
      )}

      <section className="mt-8">
        <SectionHeading>Kalender konten</SectionHeading>

        {slots.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={CalendarClock}
              title="Belum ada konten terjadwal"
              description="Jadwalkan postingan supaya tim media tahu apa yang tayang kapan."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {slots.map((slot) => (
              <li
                key={slot.id}
                className="rounded-card border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={SLOT_VARIANT[slot.status] ?? "outline"}>
                    {slot.status}
                  </Badge>
                  {slot.type && <Badge variant="neutral">{slot.type}</Badge>}
                </div>
                <p className="mt-2.5 text-body font-medium text-foreground">
                  {slot.title}
                </p>
                <p className="mt-1 text-caption text-muted-foreground">
                  {formatDateTimeID(slot.scheduled_at)}
                  {slot.assignee && ` · ${slot.assignee.full_name}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <SectionHeading>Pengumuman</SectionHeading>

        {announcements.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={Megaphone}
              title="Belum ada pengumuman"
              description="Pengumuman yang dikirim ke anggota akan tercatat di sini."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {announcements.map((item) => (
              <li
                key={item.id}
                className="rounded-card border border-border bg-surface p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={item.sent_at ? "success" : "outline"}>
                    {item.sent_at ? "Terkirim" : "Draf"}
                  </Badge>
                  {item.channel.map((channel) => (
                    <Badge key={channel} variant="neutral">
                      {channel}
                    </Badge>
                  ))}
                </div>
                <p className="mt-2.5 text-body font-medium text-foreground">
                  {item.title}
                </p>
                <p className="mt-1 line-clamp-2 text-caption text-muted-foreground">
                  {item.content}
                </p>
                {item.sent_at && (
                  <p className="mt-2 text-caption text-muted-foreground">
                    {relativeTime(item.sent_at)}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function AkademikPanel({
  categories,
  resourceCount,
  reminder,
}: {
  categories: CbtCategory[];
  resourceCount: number;
  reminder: AcademicReminder;
}) {
  const totalQuestions = categories.reduce(
    (sum, category) => sum + category.questionCount,
    0,
  );

  return (
    <div>
      <h2 className="text-h3 text-foreground">Akademik</h2>
      <p className="mt-2 text-body text-muted-foreground">
        Bank soal CBT dan materi belajar. Hanya divisi pendidikan yang bisa
        mengubah isinya.
      </p>

      <div className="mt-7 grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <span className="flex size-10 items-center justify-center rounded-field bg-surface-muted text-primary">
            <BookOpen className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-caption text-muted-foreground">Kategori tes</p>
          <p className="mt-1 text-h2 font-semibold tabular-nums text-foreground">
            {categories.length}
          </p>
        </Card>
        <Card className="p-5">
          <span className="flex size-10 items-center justify-center rounded-field bg-surface-muted text-primary">
            <FileText className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-caption text-muted-foreground">Total soal</p>
          <p className="mt-1 text-h2 font-semibold tabular-nums text-foreground">
            {totalQuestions.toLocaleString("id-ID")}
          </p>
        </Card>
        <Card className="p-5">
          <span className="flex size-10 items-center justify-center rounded-field bg-surface-muted text-primary">
            <Paperclip className="size-5" aria-hidden />
          </span>
          <p className="mt-4 text-caption text-muted-foreground">Materi belajar</p>
          <p className="mt-1 text-h2 font-semibold tabular-nums text-foreground">
            {resourceCount.toLocaleString("id-ID")}
          </p>
        </Card>
      </div>

      <section className="mt-8">
        <SectionHeading>Reminder akhir pekan</SectionHeading>
        <AcademicReminderForm reminder={reminder} />
      </section>

      <section className="mt-8">
        <SectionHeading>Bank soal per kategori</SectionHeading>

        {categories.length === 0 ? (
          <div className="mt-3">
            <EmptyState
              icon={BookOpen}
              title="Belum ada kategori tes"
              description="Kategori JLPT dan SSW akan muncul di sini beserta jumlah soalnya."
            />
          </div>
        ) : (
          <ul className="mt-3 space-y-2.5">
            {categories.map((category) => (
              <li
                key={category.id}
                className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-body font-medium text-foreground">
                      {category.name}
                    </p>
                    <Badge variant={category.is_published ? "success" : "outline"}>
                      {category.is_published ? "Terbit" : "Draf"}
                    </Badge>
                    <Badge variant="neutral">
                      {category.type.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-caption text-muted-foreground">
                    Durasi {category.duration_minutes} menit
                  </p>
                </div>
                <span
                  className={
                    category.questionCount === 0
                      ? "text-caption font-medium text-danger"
                      : "text-caption font-medium text-accent"
                  }
                >
                  {category.questionCount} soal
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
