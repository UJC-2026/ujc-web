import { describe, expect, it } from "vitest";
import { eventSchema, organizationSchema, serializeJsonLd } from "./schema";
import type { UjcEvent } from "@/lib/events/types";

const baseEvent: UjcEvent = {
  id: "e1",
  title: "Kopdar Kansai",
  description: "Kumpul anggota se-Kansai.",
  location: "Umeda",
  prefecture: "Osaka",
  event_date: "2026-09-01T10:00:00.000Z",
  is_online: false,
  meeting_link: "https://zoom.us/j/rahasia-sekali",
  cover_url: null,
  capacity: 2,
  created_by: null,
  created_at: "2026-08-01T00:00:00.000Z",
  organizer: null,
  going_count: 0,
};

describe("serializeJsonLd", () => {
  it("keeps a closing script tag from ending the tag it sits in", () => {
    const out = serializeJsonLd({
      name: "Kopdar </script><img src=x onerror=alert(1)>",
    });

    expect(out).not.toContain("</script>");
    expect(out).not.toContain("<");
  });

  it("still parses back to the original string", () => {
    const name = "Diskusi <visa> & kerja";
    expect(JSON.parse(serializeJsonLd({ name })).name).toBe(name);
  });
});

describe("organizationSchema", () => {
  it("uses absolute URLs, which schema.org requires", () => {
    const org = organizationSchema();
    expect(org.url).toMatch(/^https?:\/\//);
    expect(org.logo).toMatch(/^https?:\/\//);
  });
});

describe("eventSchema", () => {
  it("points organizer at the homepage node instead of redescribing UJC", () => {
    expect(eventSchema(baseEvent).organizer["@id"]).toBe(
      organizationSchema()["@id"],
    );
  });

  // The link lives on a publicly readable row, so nothing stops it being
  // published — which is exactly why the omission needs a test to survive.
  it("never publishes the meeting link", () => {
    const online = { ...baseEvent, is_online: true };
    expect(JSON.stringify(eventSchema(online))).not.toContain("zoom.us");
    expect(JSON.stringify(eventSchema(baseEvent))).not.toContain("zoom.us");
  });

  it("sends an online event to the event page, not to a physical place", () => {
    const location = eventSchema({ ...baseEvent, is_online: true }).location;
    expect(location["@type"]).toBe("VirtualLocation");
  });

  it("describes an offline event by prefecture", () => {
    const location = eventSchema(baseEvent).location as {
      address: { addressRegion?: string };
    };
    expect(location.address.addressRegion).toBe("Osaka");
  });

  it("marks a full event sold out so the search result says so", () => {
    expect(eventSchema({ ...baseEvent, going_count: 2 }).offers.availability).toBe(
      "https://schema.org/SoldOut",
    );
    expect(eventSchema(baseEvent).offers.availability).toBe(
      "https://schema.org/InStock",
    );
  });
});
