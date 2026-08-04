import { sanitizeRichText } from "@/lib/sanitize";
import { cn } from "@/lib/utils";

/**
 * Renders stored rich text. Content is sanitized on write, and again here —
 * anything already in the database from before a rule change still gets
 * cleaned before it reaches the DOM.
 */
export function RichText({
  html,
  className,
}: {
  html: string;
  className?: string;
}) {
  return (
    <div
      className={cn("prose-ujc", className)}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
