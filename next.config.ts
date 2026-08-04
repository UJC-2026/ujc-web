import type { NextConfig } from "next";

/**
 * User-uploaded images (avatars, foto barang, cover artikel, galeri) are served
 * from this project's Supabase Storage bucket. The pattern is derived from the
 * same env var the client uses and scoped to the public object path, so
 * next/image cannot be pointed at arbitrary hosts.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const isDev = process.env.NODE_ENV !== "production";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseUrl
      ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)]
      : [],

    // Next 16 refuses to optimize images served from local IP addresses, which
    // blocks the entire storage bucket while Supabase runs on 127.0.0.1 during
    // local development. A hosted Supabase project is a public https host, so
    // this is only ever needed on a developer machine — never in production.
    dangerouslyAllowLocalIP: isDev,
  },
};

export default nextConfig;
