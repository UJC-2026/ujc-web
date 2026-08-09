import { serializeJsonLd } from "./schema";

/**
 * Structured data for search engines. Rendered as a plain `<script>` tag
 * rather than through `next/script`, which is built for loading executable
 * JavaScript — this payload is data and must be in the initial HTML.
 *
 * The escaping that makes this safe lives in `serializeJsonLd`, where it can
 * be tested without rendering anything.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
