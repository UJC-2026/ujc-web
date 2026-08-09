import { describe, expect, it } from "vitest";
import { actionError } from "./rate-limit";

const FALLBACK = "Thread gagal diposting. Coba lagi sebentar lagi.";

describe("actionError", () => {
  it("passes the database's wording through when rate limited", () => {
    const message =
      "Kamu sudah membuat 5 thread dalam sejam terakhir. Istirahat sebentar, lalu lanjutkan.";
    expect(actionError({ code: "54000", message }, FALLBACK)).toBe(message);
  });

  // Anything else could be a constraint name, a column, or a stack of
  // Postgres jargon — none of it belongs on a member's screen.
  it("hides every other database error behind the fallback", () => {
    expect(
      actionError(
        { code: "23503", message: 'insert violates foreign key "threads_fk"' },
        FALLBACK,
      ),
    ).toBe(FALLBACK);
  });

  it("falls back when there is no error object at all", () => {
    expect(actionError(null, FALLBACK)).toBe(FALLBACK);
  });
});
