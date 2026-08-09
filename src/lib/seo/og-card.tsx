/**
 * The shared look for every generated Open Graph card.
 *
 * Rendered by Satori, not by React DOM: only flexbox and a subset of CSS
 * work, every element with more than one child needs an explicit
 * `display: flex`, and there is no Tailwind here — the design tokens are
 * repeated as literals below because a stylesheet cannot reach this far.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

// Mirrors globals.css. Kept narrow on purpose: a card is a wordmark, a
// headline, and one line of context.
const NAVY_900 = "#0f172a";
const NAVY_800 = "#1e3a8a";
const GOLD_500 = "#d4a017";
const BLUE_100 = "#dbeafe";

/**
 * Satori has no line clamping, so long titles are cut here instead of
 * overflowing the canvas.
 */
function clamp(text: string, limit: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > limit ? `${clean.slice(0, limit).trimEnd()}…` : clean;
}

export function OgCard({
  eyebrow,
  title,
  meta,
}: {
  /** What kind of thing this is — "Kegiatan", "Forum · Visa", "Marketplace". */
  eyebrow: string;
  title: string;
  /** One line of context: a date, a price, a location. */
  meta?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px 80px",
        backgroundColor: NAVY_900,
        // A wash of the primary navy in one corner, so the card is not a flat
        // rectangle. Satori supports gradients; it does not support filters.
        backgroundImage: `radial-gradient(circle at 88% 12%, ${NAVY_800} 0%, ${NAVY_900} 55%)`,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 26,
            letterSpacing: 1,
            color: GOLD_500,
            textTransform: "uppercase",
          }}
        >
          {clamp(eyebrow, 60)}
        </div>

        {/* The gold hairline that sits under section headings site-wide. */}
        <div
          style={{
            width: 96,
            height: 3,
            marginTop: 22,
            backgroundColor: GOLD_500,
          }}
        />
      </div>

      <div
        style={{
          display: "flex",
          fontSize: 62,
          lineHeight: 1.2,
          fontWeight: 600,
          color: "#ffffff",
        }}
      >
        {clamp(title, 110)}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            flexShrink: 1,
            marginRight: 40,
            fontSize: 28,
            color: BLUE_100,
          }}
        >
          {meta ? clamp(meta, 64) : ""}
        </div>

        {/* Never let a long date-and-place line wrap the wordmark: it is the
            one element that has to stay a single unit on every card. */}
        <div
          style={{
            display: "flex",
            flexShrink: 0,
            alignItems: "center",
            whiteSpace: "nowrap",
            fontSize: 26,
            color: BLUE_100,
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              marginRight: 14,
              borderRadius: 7,
              backgroundColor: GOLD_500,
            }}
          />
          UNSIA Japan Community
        </div>
      </div>
    </div>
  );
}
