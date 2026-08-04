import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, Users, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeID } from "@/lib/format";
import { isFull, type UjcEvent } from "@/lib/events/types";

export function EventCard({ event }: { event: UjcEvent }) {
  const full = isFull(event);

  return (
    <article className="relative flex flex-col overflow-hidden rounded-card border border-border bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-accent">
      {event.cover_url ? (
        <Image
          src={event.cover_url}
          alt=""
          width={640}
          height={320}
          className="h-40 w-full object-cover"
        />
      ) : (
        // Themed placeholder so cover-less events still look intentional.
        <div className="flex h-40 w-full items-center justify-center bg-primary/8">
          <CalendarDays className="size-9 text-primary/40" aria-hidden />
        </div>
      )}

      <div className="flex flex-1 flex-col p-5">
        <div className="flex flex-wrap items-center gap-1.5">
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
          {full && <Badge variant="danger">Kuota penuh</Badge>}
        </div>

        <h3 className="mt-3 text-h3 font-medium text-foreground">
          <Link href={`/events/${event.id}`}>
            <span className="absolute inset-0" aria-hidden />
            {event.title}
          </Link>
        </h3>

        <p className="mt-2 flex items-center gap-1.5 text-caption text-muted-foreground">
          <CalendarDays className="size-4 shrink-0" aria-hidden />
          <time dateTime={event.event_date}>
            {formatDateTimeID(event.event_date)}
          </time>
        </p>

        {event.location && (
          <p className="mt-1.5 flex items-center gap-1.5 text-caption text-muted-foreground">
            <MapPin className="size-4 shrink-0" aria-hidden />
            <span className="truncate">{event.location}</span>
          </p>
        )}

        <p className="mt-4 flex items-center gap-1.5 text-caption font-medium text-accent">
          <Users className="size-4" aria-hidden />
          {event.going_count.toLocaleString("id-ID")} akan hadir
          {event.capacity !== null && ` · kuota ${event.capacity}`}
        </p>
      </div>
    </article>
  );
}
