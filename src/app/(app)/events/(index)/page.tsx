import type { Metadata } from "next";
import { CalendarDays, History } from "lucide-react";
import { getEvents } from "@/lib/events/queries";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Reveal, RevealGroup, RevealItem } from "@/components/motion/reveal";

export const metadata: Metadata = {
  title: "Kegiatan",
  description:
    "Kalender kegiatan UJC — kopdar, workshop, seminar, dan webinar untuk anggota di Jepang.",
};

export default async function EventsPage() {
  const [upcoming, past] = await Promise.all([
    getEvents({ scope: "upcoming" }),
    getEvents({ scope: "past", limit: 6 }),
  ]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12">
      <Reveal className="max-w-xl">
        <h1 className="rule-gold text-h1 text-foreground">Kegiatan</h1>
        <p className="mt-5 text-body text-muted-foreground">
          Kopdar, workshop, dan webinar UJC. Daftar RSVP supaya panitia tahu
          berapa yang datang — dan supaya kamu dapat pengingatnya.
        </p>
      </Reveal>

      <section className="mt-12">
        <h2 className="text-h2 text-foreground">Akan datang</h2>

        {upcoming.length === 0 ? (
          <div className="mt-7">
            <EmptyState
              icon={CalendarDays}
              title="Belum ada kegiatan terjadwal"
              description="Panitia belum mengumumkan kegiatan berikutnya. Pantau terus halaman ini, ya."
            />
          </div>
        ) : (
          <RevealGroup className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((event) => (
              <RevealItem key={event.id}>
                <EventCard event={event} />
              </RevealItem>
            ))}
          </RevealGroup>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-16">
          <h2 className="flex items-center gap-2 text-h2 text-foreground">
            <History className="size-6 text-muted-foreground" aria-hidden />
            Sudah lewat
          </h2>
          <RevealGroup className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((event) => (
              <RevealItem key={event.id}>
                <EventCard event={event} />
              </RevealItem>
            ))}
          </RevealGroup>
        </section>
      )}
    </div>
  );
}
