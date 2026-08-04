import type { Metadata } from "next";
import Link from "next/link";
import { CalendarClock, GraduationCap, PlayCircle, Users } from "lucide-react";
import { getWorkshops, getMyRegistrations } from "@/lib/directory/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { RegisterButton } from "@/components/directory/register-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";
import { formatDateTimeID } from "@/lib/format";

export const metadata: Metadata = {
  title: "Workshop & webinar",
  description:
    "Jadwal dan pendaftaran workshop, seminar, dan webinar UJC — lengkap dengan materi dan rekaman setelah acara.",
};

const TYPE_LABEL = {
  workshop: "Workshop",
  seminar: "Seminar",
  webinar: "Webinar",
} as const;

export default async function WorkshopsPage() {
  const profile = await getCurrentProfile();
  const [workshops, registered] = await Promise.all([
    getWorkshops(),
    profile ? getMyRegistrations(profile.id) : Promise.resolve(new Set<string>()),
  ]);

  const upcoming = workshops.filter((w) => !w.isPast);
  const past = workshops.filter((w) => w.isPast);

  const card = (w: (typeof workshops)[number]) => (
    <article className="flex h-full flex-col rounded-card border border-border bg-surface p-5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="primary">{TYPE_LABEL[w.type]}</Badge>
        {w.isFull && !w.isPast && <Badge variant="danger">Kuota penuh</Badge>}
        {registered.has(w.id) && <Badge variant="success">Kamu terdaftar</Badge>}
      </div>

      <h3 className="mt-3 text-h3 font-medium text-foreground">{w.title}</h3>

      {w.speaker && (
        <p className="mt-1.5 text-caption text-muted-foreground">
          Narasumber: {w.speaker}
        </p>
      )}

      {w.description && (
        <p className="mt-3 line-clamp-3 text-body text-muted-foreground">
          {w.description}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <CalendarClock className="size-4" aria-hidden />
          {formatDateTimeID(w.scheduled_at)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users className="size-4" aria-hidden />
          {w.registered_count.toLocaleString("id-ID")} terdaftar
          {w.capacity !== null && ` / ${w.capacity}`}
        </span>
      </div>

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        {!w.isPast && profile && (
          <RegisterButton
            workshopId={w.id}
            registered={registered.has(w.id)}
            disabled={w.isFull && !registered.has(w.id)}
          />
        )}
        {!w.isPast && !profile && (
          <Button asChild size="sm" variant="outline">
            <Link href="/login?next=/workshops">Masuk untuk daftar</Link>
          </Button>
        )}

        {/* Meeting link only after registering; recordings are open to all. */}
        {!w.isPast && w.meeting_link && registered.has(w.id) && (
          <Button asChild size="sm" variant="outline">
            <a href={w.meeting_link} target="_blank" rel="noopener noreferrer">
              Buka tautan acara
            </a>
          </Button>
        )}
        {w.recording_url && (
          <Button asChild size="sm" variant="outline">
            <a href={w.recording_url} target="_blank" rel="noopener noreferrer">
              <PlayCircle aria-hidden />
              Rekaman
            </a>
          </Button>
        )}
        {w.material_url && (
          <Button asChild size="sm" variant="ghost">
            <a href={w.material_url} target="_blank" rel="noopener noreferrer">
              Materi
            </a>
          </Button>
        )}
      </div>
    </article>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="max-w-2xl">
        <h1 className="rule-gold text-h1 text-foreground">Workshop &amp; webinar</h1>
        <p className="mt-5 text-body text-muted-foreground">
          Belajar bareng anggota lain — dari persiapan JLPT sampai tips kerja di
          Jepang. Materi dan rekaman tetap bisa diakses setelah acara selesai.
        </p>
      </Reveal>

      <section className="mt-12">
        <h2 className="text-h2 text-foreground">Akan datang</h2>
        {upcoming.length === 0 ? (
          <div className="mt-7">
            <EmptyState
              icon={GraduationCap}
              title="Belum ada yang terjadwal"
              description="Divisi Pendidikan belum mengumumkan acara berikutnya. Pantau terus halaman ini, ya."
            />
          </div>
        ) : (
          <RevealGroup className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((w) => (
              <RevealItem key={w.id}>{card(w)}</RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-14">
          <h2 className="text-h2 text-foreground">Arsip</h2>
          <p className="mt-2 text-body text-muted-foreground">
            Ketinggalan acaranya? Materi dan rekamannya masih ada.
          </p>
          <RevealGroup className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((w) => (
              <RevealItem key={w.id}>{card(w)}</RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}
    </div>
  );
}
