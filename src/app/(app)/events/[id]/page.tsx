import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, CalendarDays, MapPin, QrCode, Users, Video } from "lucide-react";
import { getEventById, getUserRsvp } from "@/lib/events/queries";
import {
  getAttendees,
  getCheckinCode,
  getMyCheckin,
  isCheckinOpen,
} from "@/lib/events/checkin";
import { getCurrentProfile, getPengurusRoles } from "@/lib/auth/session";
import { isFull, isUpcoming } from "@/lib/events/types";
import { formatDateTimeID, relativeTime } from "@/lib/format";
import { JsonLd, eventSchema } from "@/lib/seo/json-ld";
import { env } from "@/lib/env";
import { RsvpControls } from "@/components/events/rsvp-controls";
import { CheckinForm } from "@/components/events/checkin-form";
import { CheckinCodeForm } from "@/components/events/checkin-code-form";
import { QrCode as QrCodeImage } from "@/components/events/qr-code";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ kode?: string }>;
};

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

export default async function EventDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { kode } = await searchParams;

  const [event, profile] = await Promise.all([
    getEventById(id),
    getCurrentProfile(),
  ]);

  if (!event) notFound();

  const [rsvp, myCheckin, checkinOpen, divisi] = profile
    ? await Promise.all([
        getUserRsvp(profile.id, event.id),
        getMyCheckin(event.id, profile.id),
        isCheckinOpen(event.id),
        getPengurusRoles(profile.id),
      ])
    : [null, null, false, []];

  // Only divisi acara and admin may run attendance; the code table and the
  // attendee RPC both enforce this again on their own.
  const runsAttendance =
    profile?.role === "admin" || divisi.includes("acara");

  const [checkinCode, attendees] = runsAttendance
    ? await Promise.all([getCheckinCode(event.id), getAttendees(event.id)])
    : [null, []];

  const upcoming = isUpcoming(event);
  const full = isFull(event);

  // A member who already claimed a seat keeps it even once the event fills up.
  const seatBlocked = full && rsvp !== "hadir";

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <JsonLd data={eventSchema(event)} />

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

      {/* Attendance is a separate act from RSVP: saying you will come is not
          the same as having come, and only the latter earns a certificate. */}
      {profile && (myCheckin || checkinOpen) && (
        <section className="mt-6 rounded-panel border border-border bg-surface p-6">
          <h2 className="flex items-center gap-2 text-h3 text-foreground">
            <QrCode className="size-5 shrink-0 text-primary" aria-hidden />
            Absensi kehadiran
          </h2>

          <div className="mt-5">
            {myCheckin ? (
              <div className="rounded-field border border-accent/40 bg-accent-muted/40 p-5">
                <p className="flex items-center gap-2 text-body font-medium text-foreground">
                  <BadgeCheck className="size-5 shrink-0 text-primary" aria-hidden />
                  Kehadiranmu tercatat {relativeTime(myCheckin.checked_in_at)}
                </p>
                {myCheckin.certificate_number && (
                  <p className="mt-2 text-caption text-muted-foreground">
                    Nomor e-sertifikat:{" "}
                    <span className="font-medium text-foreground">
                      {myCheckin.certificate_number}
                    </span>
                  </p>
                )}
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/events/${event.id}/sertifikat`}>
                    Lihat e-sertifikat
                  </Link>
                </Button>
              </div>
            ) : (
              <CheckinForm eventId={event.id} scannedCode={kode} />
            )}
          </div>
        </section>
      )}

      {runsAttendance && (
        <section className="mt-6 rounded-panel border border-accent/40 bg-accent-muted/20 p-6">
          <h2 className="text-h3 text-foreground">Panel panitia</h2>
          <p className="mt-2 text-caption text-muted-foreground">
            Hanya divisi kegiatan dan admin yang melihat bagian ini.
          </p>

          <div className="mt-6 grid gap-8 sm:grid-cols-[minmax(0,1fr)_auto]">
            <CheckinCodeForm
              eventId={event.id}
              currentCode={checkinCode?.code ?? null}
            />

            {checkinCode && (
              <figure className="flex flex-col items-center gap-3">
                <QrCodeImage
                  value={`${env.NEXT_PUBLIC_SITE_URL}/events/${event.id}?kode=${encodeURIComponent(checkinCode.code)}`}
                  title={`QR absensi untuk ${event.title}`}
                  className="size-44 rounded-field border border-border bg-white p-2"
                />
                <figcaption className="text-center">
                  <span className="block text-caption text-muted-foreground">
                    Pindai atau ketik kode
                  </span>
                  <span className="mt-1 block font-mono text-body font-semibold tracking-wider text-foreground">
                    {checkinCode.code}
                  </span>
                </figcaption>
              </figure>
            )}
          </div>

          <h3 className="mt-8 flex items-center gap-2 text-body font-semibold text-foreground">
            <Users className="size-4.5 text-primary" aria-hidden />
            Sudah hadir ({attendees.length})
          </h3>

          {attendees.length === 0 ? (
            <p className="mt-3 rounded-field border border-border bg-surface px-4 py-3 text-caption text-muted-foreground">
              Belum ada yang absen.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {attendees.map((attendee) => (
                <li
                  key={attendee.user_id}
                  className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-surface px-4 py-3"
                >
                  <Avatar
                    src={attendee.avatar_url}
                    name={attendee.full_name}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 truncate text-body text-foreground">
                    {attendee.full_name}
                  </span>
                  <Badge variant="outline">
                    {attendee.method === "qr" ? "QR" : "Kode"}
                  </Badge>
                  <span className="text-caption text-muted-foreground">
                    {relativeTime(attendee.checked_in_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
