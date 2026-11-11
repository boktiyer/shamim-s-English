import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { signLessonFiles } from "@/lib/storage";
import { signedPlayerUrl } from "@/lib/cloudflare/stream";
import { getCurrentUser } from "@/lib/auth/dal";
import {
  computeProgress,
  displayStatus,
  hasAccess,
  type CourseProgress,
  type EnrollmentStatus,
  type OutlineLesson,
} from "./progress";

/**
 * Dashboard data, read with the student's own session.
 * Row Level Security limits every query to the student's own rows,
 * and full lessons only come back for courses with an active enrollment.
 */

export type CourseSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  category: "hsc_1st" | "hsc_2nd" | "admission";
  thumbnail_url: string | null;
};

export type Enrollment = {
  id: string;
  status: EnrollmentStatus;
  enrolled_at: string;
  expires_at: string | null;
  course: CourseSummary | null;
};

export type Payment = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: "pending" | "completed" | "failed" | "refunded";
  transaction_id: string | null;
  gateway_status: string | null;
  created_at: string;
  paid_at: string | null;
  course: { id: string; title: string } | null;
  book: { title: string } | null;
};

export type Notice = {
  id: string;
  title: string;
  body: string;
  is_pinned: boolean;
  published_at: string;
  course: { title: string } | null;
};

export type NoteFile = {
  id: string;
  title: string;
  /** Download link: a short-lived signed URL for uploaded PDFs, or the external link */
  attachment_url: string;
  courseId: string;
  courseTitle: string;
  chapterTitle: string;
};

export type ActiveCourse = {
  courseId: string;
  course: CourseSummary;
  progress: CourseProgress;
};

const COURSE_FIELDS = "id, slug, title, subtitle, category, thumbnail_url";

function logError(where: string, error: { message: string } | null) {
  if (error) console.error(`[dashboard] ${where}:`, error.message);
}

export const getEnrollments = cache(async (): Promise<Enrollment[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select(`id, status, enrolled_at, expires_at, course:courses(${COURSE_FIELDS})`)
    .eq("user_id", user.id)
    .order("enrolled_at", { ascending: false });
  logError("enrollments", error);
  return ((data ?? []) as unknown as Enrollment[]).map((e) => ({ ...e, status: displayStatus(e) }));
});

/** Lesson progress rows: completed lesson IDs and last activity per lesson. */
const getProgressRows = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_progress")
    .select("lesson_id, is_completed, updated_at")
    .eq("user_id", user.id);
  logError("lesson_progress", error);
  return (data ?? []) as { lesson_id: string; is_completed: boolean; updated_at: string }[];
});

export const getCourseOutline = cache(async (courseId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_course_curriculum", { p_course_id: courseId });
  logError("get_course_curriculum", error);
  return (data ?? []) as (OutlineLesson & {
    subject_id: string;
    subject_title: string;
    chapter_id: string | null;
    chapter_title: string | null;
    lesson_type: string | null;
    duration_minutes: number | null;
    is_free_preview: boolean | null;
  })[];
});

/** Courses the student can learn from right now, with progress. */
export const getActiveCourses = cache(async () => {
  const [enrollments, progressRows] = await Promise.all([getEnrollments(), getProgressRows()]);
  const completedIds = new Set(progressRows.filter((p) => p.is_completed).map((p) => p.lesson_id));

  const active = enrollments.filter((e) => e.course && hasAccess(e));
  const courses: ActiveCourse[] = await Promise.all(
    active.map(async (e) => ({
      courseId: e.course!.id,
      course: e.course!,
      progress: computeProgress(await getCourseOutline(e.course!.id), completedIds),
    }))
  );

  // Latest activity per course, for "Continue Learning"
  const lessonCourse = new Map<string, string>();
  await Promise.all(
    courses.map(async (c) =>
      (await getCourseOutline(c.courseId)).forEach((l) => l.lesson_id && lessonCourse.set(l.lesson_id, c.courseId))
    )
  );
  const lastActivity = new Map<string, string>();
  for (const p of progressRows) {
    const courseId = lessonCourse.get(p.lesson_id);
    if (courseId && (lastActivity.get(courseId) ?? "") < p.updated_at) lastActivity.set(courseId, p.updated_at);
  }

  return { courses, completedIds, lastActivity };
});

export const getPayments = cache(async (): Promise<Payment[]> => {
  const user = await getCurrentUser();
  if (!user) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select("id, amount, currency, method, status, transaction_id, gateway_status, created_at, paid_at, course:courses(id, title), book:books(title)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });
  logError("payments", error);
  return (data ?? []) as unknown as Payment[];
});

export const getNotices = cache(async (limit = 50): Promise<Notice[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notices")
    .select("id, title, body, is_pinned, published_at, course:courses(title)")
    .eq("is_published", true)
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit);
  logError("notices", error);
  return (data ?? []) as unknown as Notice[];
});

/** Downloadable files (lesson attachments) from the student's active courses. */
export const getNotes = cache(async (): Promise<NoteFile[]> => {
  const { courses } = await getActiveCourses();
  if (!courses.length) return [];
  const titles = new Map(courses.map((c) => [c.courseId, c.course.title]));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, attachment_url, attachment_path, position, chapter:chapters!inner(title, position, subject:subjects!inner(course_id, position))")
    .or("attachment_url.not.is.null,attachment_path.not.is.null")
    .in("chapter.subject.course_id", [...titles.keys()]);
  logError("notes", error);

  type Row = {
    id: string;
    title: string;
    attachment_url: string | null;
    attachment_path: string | null;
    position: number;
    chapter: { title: string; position: number; subject: { course_id: string; position: number } };
  };
  const rows = ((data ?? []) as unknown as Row[]).filter((r) => titles.has(r.chapter.subject.course_id)); // only active courses
  const signed = await signLessonFiles(rows.map((r) => r.attachment_path ?? ""));

  return rows
    .flatMap((r) => {
      const links = [r.attachment_path && signed.get(r.attachment_path), r.attachment_url].filter(Boolean) as string[];
      return links.map((link, i) => ({ ...r, id: i ? `${r.id}-link` : r.id, attachment_url: link }));
    })
    .sort(
      (a, b) =>
        a.chapter.subject.position - b.chapter.subject.position ||
        a.chapter.position - b.chapter.position ||
        a.position - b.position
    )
    .map((r) => ({
      id: r.id,
      title: r.title,
      attachment_url: r.attachment_url,
      courseId: r.chapter.subject.course_id,
      courseTitle: titles.get(r.chapter.subject.course_id)!,
      chapterTitle: r.chapter.title,
    }));
});

export type LessonDetail = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  video_url: string | null;
  content: string | null;
  attachment_url: string | null;
  attachment_path: string | null;
  stream_video_id: string | null;
  duration_minutes: number | null;
  chapter: { title: string; subject: { title: string; course_id: string } };
};

/** A single lesson. RLS returns null unless the student may access it. */
export const getLesson = cache(async (lessonId: string): Promise<LessonDetail | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, description, type, video_url, content, attachment_url, attachment_path, stream_video_id, duration_minutes, chapter:chapters(title, subject:subjects(title, course_id))")
    .eq("id", lessonId)
    .maybeSingle();
  logError("lesson", error);
  return data as unknown as LessonDetail | null;
});

/**
 * Secure Cloudflare Stream playback for a lesson. Signs a short-lived token
 * ONLY after verifying, on the server, that the student can read the lesson
 * (RLS) and has an approved, active, unexpired enrollment in its course.
 */
export async function getLessonPlayerUrl(lessonId: string): Promise<string | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const [lesson, { courses }] = await Promise.all([getLesson(lessonId), getActiveCourses()]);
  if (!lesson?.stream_video_id) return null;
  const enrolled = courses.some((c) => c.courseId === lesson.chapter.subject.course_id);
  if (!enrolled) return null;
  return signedPlayerUrl(lesson.stream_video_id);
}