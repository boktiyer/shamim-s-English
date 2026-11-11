import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Public course catalog (published courses only), cached and shared by all
 * visitors. Uses the public key without cookies; RLS only returns published
 * courses. Admin course changes call updateTag("courses") to refresh it.
 */

export type CatalogCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: "hsc_1st" | "hsc_2nd" | "admission";
  price: number;
  original_price: number | null;
  duration_weeks: number | null;
  thumbnail_url: string | null;
  is_featured: boolean;
};

const FIELDS = "id, slug, title, subtitle, description, category, price, original_price, duration_weeks, thumbnail_url, is_featured";

function publicClient() {
  const env = getSupabaseEnv();
  return env ? createClient(env.url, env.key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
}

export async function getPublishedCourses(): Promise<CatalogCourse[]> {
  "use cache";
  cacheTag("courses");
  cacheLife("minutes");
  const supabase = publicClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("courses")
    .select(FIELDS)
    .eq("status", "published")
    .order("is_featured", { ascending: false })
    .order("published_at", { ascending: false });
  if (error) console.error("[catalog]", error.message);
  return (data ?? []) as CatalogCourse[];
}

export async function getPublishedCourseBySlug(slug: string): Promise<CatalogCourse | null> {
  const courses = await getPublishedCourses();
  return courses.find((c) => c.slug === slug) ?? null;
}
