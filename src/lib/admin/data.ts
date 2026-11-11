import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Admin read queries. They run with the admin's own session; RLS
 * (is_admin()) is what lets these return every row. Pages must call
 * requireAdmin() before using them.
 */

/** Pending payments an admin should look at: all manual ones + high-risk online ones. */
const ONLINE_NEEDS_REVIEW = "method.neq.sslcommerz,gateway_status.eq.HIGH_RISK";

const STUDENT = "student:profiles!%s_user_id_fkey(id, full_name, student_id, phone, email)";
const student = (table: string) => STUDENT.replace("%s", table);

function check<T>(where: string, res: { data: T | null; error: { message: string } | null }): T | [] {
  if (res.error) console.error(`[admin] ${where}:`, res.error.message);
  return res.data ?? ([] as unknown as T);
}

export async function getStats() {
  const supabase = await createClient();
  const count = (table: string, filter?: (q: any) => any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) q = filter(q);
    return q.then((r: { count: number | null }) => r.count ?? 0);
  };

  const [students, activeEnrollments, pendingPayments, pendingEnrollments, courses, publishedCourses, revenueRows] =
    await Promise.all([
      count("profiles", (q) => q.eq("role", "student")),
      count("enrollments", (q) => q.eq("status", "active")),
      count("payments", (q) => q.eq("status", "pending").or(ONLINE_NEEDS_REVIEW)),
      count("enrollments", (q) => q.eq("status", "pending")),
      count("courses"),
      count("courses", (q) => q.eq("status", "published")),
      supabase.from("payments").select("amount").eq("status", "completed"),
    ]);

  const revenue = (revenueRows.data ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  return { students, activeEnrollments, pendingPayments, pendingEnrollments, courses, publishedCourses, revenue };
}

export type AdminPayment = {
  id: string;
  amount: number;
  method: string;
  status: string;
  transaction_id: string | null;
  sender_number: string | null;
  screenshot_path: string | null;
  gateway_status: string | null;
  created_at: string;
  course: { title: string } | null;
  book: { title: string } | null;
  student: { id: string; full_name: string; student_id: string; phone: string | null } | null;
};

export async function getPayments(status?: string, limit = 100) {
  const supabase = await createClient();
  let q = supabase
    .from("payments")
    .select(`id, amount, method, status, transaction_id, sender_number, screenshot_path, gateway_status, created_at, course:courses(title), book:books(title), ${student("payments")}`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (status) q = q.eq("status", status);
  // Unfinished online attempts are not "waiting for approval" (only high-risk ones are).
  if (status === "pending") q = q.or(ONLINE_NEEDS_REVIEW);
  return check("payments", await q) as unknown as AdminPayment[];
}

export type AdminEnrollment = {
  id: string;
  status: string;
  enrolled_at: string;
  expires_at: string | null;
  course: { id: string; title: string } | null;
  student: { id: string; full_name: string; student_id: string; phone: string | null } | null;
};

export async function getEnrollments(status?: string) {
  const supabase = await createClient();
  let q = supabase
    .from("enrollments")
    .select(`id, status, enrolled_at, expires_at, course:courses(id, title), ${student("enrollments")}`)
    .order("enrolled_at", { ascending: false })
    .limit(200);
  if (status) q = q.eq("status", status);
  return check("enrollments", await q) as unknown as AdminEnrollment[];
}

export type AdminStudent = {
  id: string;
  student_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  college: string | null;
  role: string;
  created_at: string;
};

export async function getStudents(search?: string) {
  const supabase = await createClient();
  let q = supabase
    .from("profiles")
    .select("id, student_id, full_name, email, phone, college, role, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  // Strip characters that have meaning in PostgREST filter syntax.
  const term = search?.replace(/[,()*%\\]/g, " ").trim();
  if (term) {
    q = q.or(`full_name.ilike.%${term}%,email.ilike.%${term}%,student_id.ilike.%${term}%,phone.ilike.%${term}%,college.ilike.%${term}%`);
  }
  const students = check("students", await q) as unknown as AdminStudent[];

  const { data: enrollments } = await supabase.from("enrollments").select("user_id").eq("status", "active");
  const active = new Map<string, number>();
  for (const e of enrollments ?? []) active.set(e.user_id, (active.get(e.user_id) ?? 0) + 1);
  return students.map((s) => ({ ...s, activeCourses: active.get(s.id) ?? 0 }));
}

export type AdminCourse = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  category: string;
  status: string;
  price: number;
  original_price: number | null;
  duration_weeks: number | null;
  thumbnail_url: string | null;
  is_featured: boolean;
};

export async function getCourses() {
  const supabase = await createClient();
  const res = await supabase
    .from("courses")
    .select("id, slug, title, subtitle, description, category, status, price, original_price, duration_weeks, thumbnail_url, is_featured")
    .order("created_at", { ascending: false });
  return check("courses", res) as unknown as AdminCourse[];
}

export type CourseTree = AdminCourse & {
  subjects: {
    id: string;
    title: string;
    position: number;
    chapters: {
      id: string;
      title: string;
      position: number;
      lessons: { id: string; title: string; type: string; position: number; is_free_preview: boolean; is_published: boolean; video_url: string | null; attachment_url: string | null; attachment_path: string | null; stream_video_id: string | null }[];
    }[];
  }[];
};

/** A course with its full subject -> chapter -> lesson outline, sorted. */
export async function getCourseTree(id: string): Promise<CourseTree | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, slug, title, subtitle, description, category, status, price, original_price, duration_weeks, thumbnail_url, is_featured, subjects(id, title, position, chapters(id, title, position, lessons(id, title, type, position, is_free_preview, is_published, video_url, attachment_url, attachment_path, stream_video_id)))"
    )
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[admin] course tree:", error.message);
  if (!data) return null;

  const tree = data as unknown as CourseTree;
  const byPos = <T extends { position: number; title: string }>(a: T, b: T) => a.position - b.position || a.title.localeCompare(b.title);
  tree.subjects.sort(byPos);
  for (const s of tree.subjects) {
    s.chapters.sort(byPos);
    for (const c of s.chapters) c.lessons.sort(byPos);
  }
  return tree;
}

export type AdminLesson = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  video_url: string | null;
  content: string | null;
  attachment_url: string | null;
  duration_minutes: number | null;
  position: number;
  is_free_preview: boolean;
  is_published: boolean;
  attachment_path: string | null;
  stream_video_id: string | null;
  chapter: { title: string; subject: { title: string; course: { id: string; title: string } } };
};

export async function getLesson(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lessons")
    .select("id, title, description, type, video_url, content, attachment_url, attachment_path, stream_video_id, duration_minutes, position, is_free_preview, is_published, chapter:chapters(title, subject:subjects(title, course:courses(id, title)))")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[admin] lesson:", error.message);
  return data as unknown as AdminLesson | null;
}

export type AdminBook = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  author: string;
  cover_url: string | null;
  pages: number | null;
  price: number;
  original_price: number | null;
  stock: number;
  is_published: boolean;
};

export async function getBooks() {
  const supabase = await createClient();
  const res = await supabase
    .from("books")
    .select("id, slug, title, subtitle, description, author, cover_url, pages, price, original_price, stock, is_published")
    .order("created_at", { ascending: false });
  return check("books", res) as unknown as AdminBook[];
}

export type AdminNotice = {
  id: string;
  title: string;
  body: string;
  is_published: boolean;
  is_pinned: boolean;
  published_at: string;
  course_id: string | null;
  course: { title: string } | null;
};

export async function getNotices() {
  const supabase = await createClient();
  const res = await supabase
    .from("notices")
    .select("id, title, body, is_published, is_pinned, published_at, course_id, course:courses(title)")
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false });
  return check("notices", res) as unknown as AdminNotice[];
}
