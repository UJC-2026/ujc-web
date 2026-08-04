import type { MetadataRoute } from "next";
import { env } from "@/lib/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Member-only surfaces. These already require a session, but keeping
      // crawlers out avoids a login wall showing up in search results.
      disallow: [
        "/dashboard",
        "/admin",
        "/messages",
        "/notifications",
        "/settings",
        "/profile",
        "/onboarding",
        "/offline",
      ],
    },
    sitemap: `${env.NEXT_PUBLIC_SITE_URL}/sitemap.xml`,
  };
}
