import { env } from "@/lib/env";
import type { UjcEvent } from "@/lib/events/types";
import { isFull } from "@/lib/events/types";

/**
 * Serializes a schema.org payload for embedding in a `<script>` tag.
 *
 * `JSON.stringify` escapes quotes but not `<`, so an event titled with a
 * closing script tag would end the tag early and turn the rest of the payload
 * into live markup. Replacing every `<` with its JSON unicode escape parses
 * back to the same string, inertly.
 */
export function serializeJsonLd(data: Record<string, unknown>) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** Absolute URL for a site-relative path — schema.org fields never take relative ones. */
export function absoluteUrl(path: string) {
  return new URL(path, env.NEXT_PUBLIC_SITE_URL).toString();
}

/**
 * The community itself, emitted once on the homepage. `@id` is what lets other
 * entities on the site point at this one organization instead of each
 * describing a separate copy of UJC.
 */
export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: "UNSIA Japan Community",
    alternateName: "UJC",
    url: absoluteUrl("/"),
    logo: absoluteUrl("/logo-ujc.svg"),
    description:
      "Wadah mahasiswa program distance learning Universitas Siber Asia yang tinggal dan bekerja di Jepang.",
    areaServed: { "@type": "Country", name: "Japan" },
    parentOrganization: {
      "@type": "CollegeOrUniversity",
      name: "Universitas Siber Asia",
    },
  };
}

/**
 * A single event, for the rich result that shows date and place directly in
 * search. `organizer` is a reference to the homepage `@id` rather than a
 * second description of UJC, so both pages describe one organization.
 */
export function eventSchema(event: UjcEvent) {
  const url = absoluteUrl(`/events/${event.id}`);

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    url,
    startDate: event.event_date,
    description: event.description ?? undefined,
    image: event.cover_url ?? undefined,
    eventAttendanceMode: event.is_online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    // The meeting link is deliberately not published here. It sits on a
    // publicly readable row, but structured data is read by crawlers, and a
    // Zoom link that lands in a search index is a link anyone can walk into.
    // The event page is where an attendee gets it after RSVP.
    location: event.is_online
      ? { "@type": "VirtualLocation", url }
      : {
          "@type": "Place",
          name: event.location ?? "Lokasi diumumkan menyusul",
          address: {
            "@type": "PostalAddress",
            addressRegion: event.prefecture ?? undefined,
            addressCountry: "JP",
          },
        },
    organizer: { "@id": absoluteUrl("/#organization") },
    maximumAttendeeCapacity: event.capacity ?? undefined,
    // Free to attend, but "no seats left" is worth saying in the search result
    // rather than after the click.
    offers: {
      "@type": "Offer",
      price: 0,
      priceCurrency: "JPY",
      url,
      availability: isFull(event)
        ? "https://schema.org/SoldOut"
        : "https://schema.org/InStock",
    },
  };
}
