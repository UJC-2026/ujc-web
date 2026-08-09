import { describe, expect, it } from "vitest";
import { academicReminderSchema } from "./dashboard";

const base = { title: "Buka e-link", body: "Cek tugas minggu ini.", link: "" };

function parse(patch: Partial<typeof base>) {
  return academicReminderSchema.safeParse({ ...base, ...patch });
}

describe("academicReminderSchema", () => {
  it("accepts a site-relative link", () => {
    expect(parse({ link: "/resources" }).success).toBe(true);
  });

  it("accepts an empty link, which means no link at all", () => {
    expect(parse({ link: "" }).success).toBe(true);
  });

  // The link becomes the target of a notification sent to every member, so an
  // off-site URL would turn this panel into a way to point the whole community
  // at somebody else's site. `//host` and `/\host` are the ones that look
  // internal and are not: both leave the site.
  it("rejects anything that leaves the site", () => {
    for (const link of [
      "https://phishing.example",
      "http://phishing.example",
      "//phishing.example",
      "/\\phishing.example",
      "javascript:alert(1)",
    ]) {
      expect(parse({ link }).success, link).toBe(false);
    }
  });

  it("keeps the wording within what a notification can show", () => {
    expect(parse({ title: "x".repeat(121) }).success).toBe(false);
    expect(parse({ body: "x".repeat(301) }).success).toBe(false);
  });

  it("allows blank wording, which restores the built-in text", () => {
    expect(parse({ title: "", body: "" }).success).toBe(true);
  });
});
