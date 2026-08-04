import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, Users, Video } from "lucide-react";
import { getEventById, getUserRsvp } from "@/lib/events/queries";
import { getCurrentProfile } from "@/lib/auth/session";
import { isFull, isUpcoming } from "@/lib/events/types";
import { formatDateTimeID } from "@/lib/format";
import { RsvpControls } from "@/components/events/rsvp-controls";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) return { title: "Kegiatan tidak ditemukan" };

  const description =
    event.description?.slice(0, 155) ??
    `Kegiatan UJC pada ${formatDateTimeID(event.event_date)}.`;

  return {
    title: event.title,
    description,
    openGraph: {
      type: "article",
      title: event.title,
      description,
      images: event.cover_url ? [event.cover_url] : undefined,
    },
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [event, profile] = await Promise.all([
    getEventById(id),
    getCurrentProfile(),
  ]);

  if (!event) notFound();

  const rsvp = profile ? await getUserRsvp(profile.id, event.id) : null;
  const upcoming = isUpcoming(event);
  const full = isFull(event);

  // A member who already claimed a seat keeps it even once the event fills up.
  const seatBlocked = full && rsvp !== "hadir";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <nav aria-label="Remah roti" className="text-caption text-muted-foreground">
        <Link href="/events" className="transition-colors hover:text-primary">
          Kegiatan
        </Link>
        <span aria-hidden> / </span>
        <span className="text-foreground">{event.title}</span>
      </nav>

      {event.cover_url && (
        <Image
          src={event.cover_url}
          alt=""
          width={1200}
          height={480}
          priority
          className="mt-5 h-56 w-full rounded-panel object-cover sm:h-72"
        />
      )}

      <div className="mt-6 flex flex-wrap items-center gap-1.5">
        <Badge variant={event.is_online ? "accent" : "neutral"}>
          {event.is_online ? (
            <>
              <Video aria-hidden />
              Online
            </>
          ) : (
            <>
              <MapPin aria-hidden />
              {event.prefecture ?? "Offline"}
            </>
          )}
        </Badge>
        {!upcoming && <Badge variant="outline">Sudah selesai</Badge>}
        {upcoming && full && <Badge variant="danger">Kuota penuh</Badge>}
      </div>

      <h1 className="mt-3 text-h1 text-foreground">{event.title}</h1>

      <dl className="mt-6 grid gap-4 rounded-panel border border-border bg-surface p-6 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="text-caption text-muted-foreground">Waktu</dt>
            <dd className="text-body text-foreground">
              <time dateTime={event.event_date}>
                {formatDateTimeID(event.event_date)}
              </time>
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="text-caption text-muted-foreground">Lokasi</dt>
            <dd className="text-body text-foreground">
              {event.location ?? (event.is_online ? "Daring" : "Menyusul")}
            </dd>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Users className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <dt className="text-caption text-muted-foreground">Kehadiran</dt>
            <dd className="text-body text-foreground">
              {event.going_count.toLocaleString("id-ID")} akan hadir
              {event.capacity !== null && ` dari kuota ${event.capacity}`}
            </dd>
          </div>
        </div>

        {event.organizer && (
          <div className="flex items-start gap-3">
            <Avatar
              src={event.organizer.avatar_url}
              name={event.organizer.full_name}
              size="sm"
            />
            <div>
              <dt className="text-caption text-muted-foreground">Penyelenggara</dt>
              <dd className="text-body text-foreground">
                {event.organizer.full_name}
              </dd>
            </div>
          </div>
        )}
      </dl>

      {event.description && (
        <div className="mt-8">
          <h2 className="rule-gold text-h3 text-foreground">Tentang kegiatan</h2>
          <p className="mt-5 whitespace-pre-line text-body text-muted-foreground">
            {event.description}
          </p>
        </div>
      )}

      <section className="mt-10 rounded-panel border border-border bg-surface p-6">
        <h2 className="text-h3 text-foreground">Konfirmasi kehadiran</h2>

        <div className="mt-5">
          {!profile ? (
            <div>
              <p className="text-body text-muted-foreground">
                Masuk dulu untuk konfirmasi kehadiran.
              </p>
              <Button asChild className="mt-4">
                <Link href={`/login?next=/events/${event.id}`}>Masuk</Link>
              </Button>
            </div>
          ) : (
            <RsvpControls
              eventId={event.id}
              initialStatus={rsvp}
              disabled={!upcoming || seatBlocked}
              disabledReason={
                !upcoming
                  ? "Kegiatan ini sudah selesai, jadi RSVP sudah ditutup."
                  : "Kuota kegiatan ini sudah penuh. Coba pantau kalau ada yang membatalkan."
              }
            />
          )}
        </div>

        {rsvp === "hadir" && event.is_online && event.meeting_link && upcoming && (
          <div className="mt-5 rounded-field border border-accent/40 bg-accent-muted/40 p-4">
            <p className="text-caption text-muted-foreground">
              Link kegiatan daring — khusus peserta terdaftar.
            </p>
            <Button asChild variant="outline" className="mt-3">
              <a
                href={event.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
              >
                Buka tautan kegiatan
              </a>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
