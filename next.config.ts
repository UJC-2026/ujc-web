import type { NextConfig } from "next";

/**
 * User-uploaded images (avatars, foto barang, cover artikel, galeri) are served
 * from this project's Supabase Storage bucket. The pattern is derived from the
 * same env var the client uses and scoped to the public object path, so
 * next/image cannot be pointed at arbitrary hosts.
 *
 * This file runs *before* the Zod validation in `src/lib/env.ts`, so a
 * malformed value reaches here first. Left unguarded, `new URL()` throws a bare
 * `ERR_INVALID_URL` naming neither the variable nor the problem — and on Vercel
 * the offending value is redacted from the build log, so there is nothing to go
 * on. The guard below is what turns that into something actionable.
 */
function storagePattern(): URL[] {
  // Trimmed because a value pasted into a dashboard field very often carries
  // a leading or trailing space, which is invisible and breaks the URL.
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return [];

  try {
    return [
      new URL(`${raw}/storage/v1/object/public/**`),
      // YouTube serves per-video thumbnails publicly; the creative hub uses
      // them so a video card looks like the video without any API key.
      new URL("https://img.youtube.com/vi/**"),
    ];
  } catch {
    throw new Error(
      [
        "NEXT_PUBLIC_SUPABASE_URL bukan URL yang valid.",
        "",
        "Isinya harus Project URL lengkap beserta skema-nya, contoh:",
        "  https://abcdefghijklm.supabase.co",
        "",
        "Penyebab yang paling sering:",
        "  - awalan https:// tidak ikut tersalin",
        "  - yang tertempel anon key atau project ref, bukan Project URL",
        "  - ada spasi atau baris kosong ikut tersalin",
        "",
        "Salin ulang dari Supabase → Project Settings → API → Project URL.",
      ].join("\n"),
    );
  }
}

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: storagePattern(),

    // Next 16 refuses to optimize images served from local IP addresses, which
    // blocks the entire storage bucket while Supabase runs on 127.0.0.1 during
    // local development. A hosted Supabase project is a public https host, so
    // this is only ever needed on a developer machine — never in production.
    dangerouslyAllowLocalIP: isDev,
  },
};

export default nextConfig;
