import "server-only";
import { createClient } from "@/lib/supabase/server";

export const LESSON_FILES_BUCKET = "lesson-files";

/**
 * Short-lived download links for files in the private lesson-files bucket.
 * Created with the viewer's own session, so Storage RLS decides access:
 * paths the viewer may not read simply get no link.
 */
export async function signLessonFiles(paths: string[], expiresInSeconds = 60 * 60) {
  const unique = [...new Set(paths.filter(Boolean))];
  if (!unique.length) return new Map<string, string>();
  const supabase = await createClient();
  const { data, error } = await supabase.storage.from(LESSON_FILES_BUCKET).createSignedUrls(unique, expiresInSeconds);
  if (error) console.error("[storage] sign urls:", error.message);
  return new Map((data ?? []).filter((d) => d.signedUrl && d.path).map((d) => [d.path as string, d.signedUrl]));
}
