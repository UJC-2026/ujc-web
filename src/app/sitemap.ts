import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Static pages plus whatever is publicly readable. The queries run through the
 * anonymous client, so RLS decides what belongs here — an unpublished article
 * or an unverified job listing simply never comes back.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_SITE_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/forum",
    "/events",
    "/resources",
    "/marketplace",
    "/cbt",
    "/jobs",
    "/mentorship",
    "/peduli",
    "/blog",
    "/members",
    "/map",
    "/structure",
    "/gallery",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.7,
  }));

  const supabase = await createClient();

  const [threads, posts, events, items, jobs] = await Promise.all([
    supabase
      .from("forum_threads")
      .select("id, updated_at, category:forum_categories(slug)")
      .order("updated_at", { ascending: false })
      .limit(500),
    supabase
      .from("blog_posts")
      .select("slug, published_at")
      .eq("status", "terbit")
      .limit(500),
    supabase.from("events").select("id, created_at").limit(500),
    supabase.from("marketplace_items").select("id, created_at").limit(500),
    supabase.from("jobs").select("id, created_at").eq("is_verified", true).limit(500),
  ]);

  const dynamic: MetadataRoute.Sitemap = [];

  for (const row of threads.data ?? []) {
    const category = Array.isArray(row.category) ? row.category[0] : row.category;
    if (!category) continue;
    dynamic.push({
      url: `${base}/forum/${category.slug}/${row.id}`,
      lastModified: new Date(row.updated_at as string),
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const row of posts.data ?? []) {
    dynamic.push({
      url: `${base}/blog/${row.slug}`,
      lastModified: new Date((row.published_at as string) ?? Date.now()),
      changeFrequency: "monthly",
      priority: 0.6,
    });
  }

  for (const row of events.data ?? []) {
    dynamic.push({ url: `${base}/events/${row.id}`, priority: 0.5 });
  }
  for (const row of items.data ?? []) {
    dynamic.push({ url: `${base}/marketplace/${row.id}`, priority: 0.5 });
  }
  for (const row of jobs.data ?? []) {
    dynamic.push({ url: `${base}/jobs/${row.id}`, priority: 0.5 });
  }

  return [...staticRoutes, ...dynamic];
}
