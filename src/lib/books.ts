import { cacheLife, cacheTag } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Public book catalog (published books only), cached for all visitors.
 * Admin book changes and new orders (stock) call updateTag("books").
 */

export type CatalogBook = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string;
  pages: number | null;
  price: number;
  original_price: number | null;
  stock: number;
  /** Cover image URL (uploaded or external), or null */
  cover: string | null;
  /** Public sample PDF URL, or null */
  sample: string | null;
};

export const BOOK_BUCKET = "book-assets";

/** Public URL of a file in the public book-assets bucket. */
export function bookAssetUrl(path: string | null) {
  const env = getSupabaseEnv();
  if (!path || !env) return null;
  return `${env.url}/storage/v1/object/public/${BOOK_BUCKET}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

type BookRow = Omit<CatalogBook, "cover" | "sample"> & { cover_url: string | null; cover_path: string | null; sample_path: string | null };

export function toCatalogBook(row: BookRow): CatalogBook {
  const { cover_url, cover_path, sample_path, ...rest } = row;
  return { ...rest, cover: bookAssetUrl(cover_path) ?? cover_url, sample: bookAssetUrl(sample_path) };
}

export async function getPublishedBooks(): Promise<CatalogBook[]> {
  "use cache";
  cacheTag("books");
  cacheLife("minutes");
  const env = getSupabaseEnv();
  if (!env) return [];
  const supabase = createClient(env.url, env.key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase
    .from("books")
    .select("id, slug, title, subtitle, description, author, pages, price, original_price, stock, cover_url, cover_path, sample_path")
    .eq("is_published", true)
    .order("created_at", { ascending: true });
  if (error) console.error("[books]", error.message);
  return ((data ?? []) as BookRow[]).map(toCatalogBook);
}

export async function getPublishedBookBySlug(slug: string) {
  return (await getPublishedBooks()).find((b) => b.slug === slug) ?? null;
}
