import { describe, expect, it } from "vitest";
import { reportSchema } from "./forum";

const base = {
  contentId: "11111111-1111-4111-8111-111111111111",
  reason: "Barang ini terlihat seperti penipuan.",
};

describe("reportSchema", () => {
  // The marketplace report button used to send "thread" for an item. The
  // report saved, the moderation queue looked it up in forum_threads, found
  // nothing, and "hapus" deleted zero rows while marking the report resolved.
  it("accepts a marketplace item as its own kind of content", () => {
    expect(reportSchema.safeParse({ ...base, contentType: "barang" }).success).toBe(
      true,
    );
  });

  it("still accepts forum content", () => {
    for (const contentType of ["thread", "reply"]) {
      expect(reportSchema.safeParse({ ...base, contentType }).success).toBe(true);
    }
  });

  it("rejects a kind nothing knows how to moderate", () => {
    expect(
      reportSchema.safeParse({ ...base, contentType: "artikel" }).success,
    ).toBe(false);
  });

  it("still requires a reason a moderator can act on", () => {
    expect(
      reportSchema.safeParse({ ...base, contentType: "barang", reason: "scam" })
        .success,
    ).toBe(false);
  });
});
