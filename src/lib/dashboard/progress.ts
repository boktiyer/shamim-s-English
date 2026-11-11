/**
 * Pure helpers for enrollment access and course progress.
 * No database calls here, so they're easy to test.
 */

export type EnrollmentStatus = "pending" | "active" | "expired" | "cancelled";

/** Only an active, unexpired enrollment unlocks a course. */
export function hasAccess(e: { status: EnrollmentStatus; expires_at: string | null }, now = new Date()) {
  return e.status === "active" && (!e.expires_at || new Date(e.expires_at) > now);
}

/** Status to display: an active enrollment past its end date counts as expired. */
export function displayStatus(e: { status: EnrollmentStatus; expires_at: string | null }, now = new Date()): EnrollmentStatus {
  return e.status === "active" && !hasAccess(e, now) ? "expired" : e.status;
}

export type OutlineLesson = { lesson_id: string | null; lesson_title: string | null };

export type CourseProgress = {
  total: number;
  completed: number;
  percent: number;
  /** First lesson (in course order) not yet completed; null when finished or empty */
  nextLessonId: string | null;
  nextLessonTitle: string | null;
};

export function computeProgress(outline: OutlineLesson[], completedIds: Set<string>): CourseProgress {
  const lessons = outline.filter((l): l is { lesson_id: string; lesson_title: string } => Boolean(l.lesson_id));
  const completed = lessons.filter((l) => completedIds.has(l.lesson_id)).length;
  const next = lessons.find((l) => !completedIds.has(l.lesson_id)) ?? null;
  return {
    total: lessons.length,
    completed,
    percent: lessons.length ? Math.round((completed / lessons.length) * 100) : 0,
    nextLessonId: next?.lesson_id ?? null,
    nextLessonTitle: next?.lesson_title ?? null,
  };
}

/**
 * Picks the course to "Continue Learning": the unfinished course the student
 * touched most recently, otherwise the first unfinished course.
 */
export function pickContinue<T extends { courseId: string; progress: CourseProgress }>(
  courses: T[],
  lastActivity: Map<string, string>
): T | null {
  const unfinished = courses.filter((c) => c.progress.nextLessonId);
  if (!unfinished.length) return null;
  return [...unfinished].sort(
    (a, b) => (lastActivity.get(b.courseId) ?? "").localeCompare(lastActivity.get(a.courseId) ?? "")
  )[0];
}

/** Returns a YouTube video ID from common URL formats, or null. */
export function youtubeId(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m?.[1] ?? null;
}
