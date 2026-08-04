import DOMPurify from "isomorphic-dompurify";

/**
 * Rich text from the forum editor is stored as HTML, so it must be sanitized
 * before it is ever written or rendered. The allowlist mirrors exactly what
 * the Tiptap toolbar can produce — anything else is an injection attempt.
 */
const ALLOWED_TAGS = [
  "p", "br", "strong", "em", "s", "code", "pre",
  "h2", "h3", "ul", "ol", "li", "blockquote", "a", "img",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "title"];

export function sanitizeRichText(html: string) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // block javascript:, data: and other non-navigational schemes on links/images
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|\/|#)/i,
    FORBID_ATTR: ["style", "onerror", "onclick", "onload"],
  });
}

/** Strips markup so rich text can be used in previews, search, and meta tags. */
export function richTextToPlain(html: string, limit = 200) {
  const text = DOMPurify.sanitize(html, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] })
    .replace(/\s+/g, " ")
    .trim();
  return text.length > limit ? `${text.slice(0, limit).trimEnd()}…` : text;
}
