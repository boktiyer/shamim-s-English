"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/dal";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Marks a lesson complete (or not). The RLS policy on lesson_progress only
 * allows this for the student's own row and for lessons they can access.
 */
export async function setLessonComplete(formData: FormData) {
  const user = await getCurrentUser();
  const lessonId = String(formData.get("lessonId") ?? "");
  const completed = formData.get("completed") === "true";
  if (!user || !UUID.test(lessonId)) return;

  const supabase = await createClient();
  const { error } = await supabase.from("lesson_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      is_completed: completed,
      progress_percent: completed ? 100 : 0,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,lesson_id" }
  );
  if (error) console.error("[dashboard] mark complete:", error.message);
  refresh();
}
