"use server";

import { redirect } from "next/navigation";
import { refresh, updateTag } from "next/cache";
import type { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getAdmin } from "@/lib/auth/dal";
import type { FormState } from "@/lib/auth/validation";
import { BOOK_BUCKET } from "@/lib/books";
import {
  VIDEO_UID,
  createDirectUpload,
  deleteVideo,
  isStreamApiConfigured,
  requireSignedUrls,
} from "@/lib/cloudflare/stream";

/**
 * Admin server actions. Every action:
 *  1. verifies on the server that the current user is an admin (getAdmin),
 *  2. validates the form input,
 *  3. writes with the admin's own session — RLS (is_admin()) is the final guard.
 */

const DENIED: FormState = { error: "You don't have permission to do this." };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CATEGORIES = ["hsc_1st", "hsc_2nd", "admission"];
const COURSE_STATUSES = ["draft", "published", "archived"];
const LESSON_TYPES = ["video", "pdf", "text", "quiz", "live"];
const ENROLLMENT_STATUSES = ["pending", "active", "expired", "cancelled"];

// ---------- small form helpers ----------
const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optStr = (fd: FormData, k: string) => str(fd, k) || null;
const bool = (fd: FormData, k: string) => fd.get(k) === "on";
function optNum(fd: FormData, k: string) {
  const v = str(fd, k);
  return v === "" ? null : Number(v);
}
const badNum = (n: number | null, min = 0) => n !== null && (!Number.isFinite(n) || n < min);

function slugify(text: string) {
  const slug = text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || `item-${Date.now().toString(36)}`;
}

function dbError(error: PostgrestError): FormState {
  console.error("[admin]", error.code, error.message);
  if (error.code === "23505") return { error: "That already exists (slug or transaction ID must be unique)." };
  if (error.code === "23514") return { error: "One of the values is not allowed (check prices and numbers)." };
  if (error.code === "42501") return DENIED;
  return { error: "Could not save. Please try again." };
}

function ok(message: string): FormState {
  refresh();
  return { success: message };
}

// =====================================================================
// Courses
// =====================================================================
function readCourse(fd: FormData) {
  const title = str(fd, "title");
  const price = optNum(fd, "price") ?? 0;
  const original_price = optNum(fd, "original_price");
  const duration_weeks = optNum(fd, "duration_weeks");
  const category = str(fd, "category");
  const status = str(fd, "status") || "draft";

  if (title.length < 3) return { error: "Enter a course title." } as const;
  if (!CATEGORIES.includes(category)) return { error: "Choose a category." } as const;
  if (!COURSE_STATUSES.includes(status)) return { error: "Choose a status." } as const;
  if (badNum(price) || badNum(original_price) || badNum(duration_weeks, 1)) return { error: "Check the price and duration numbers." } as const;
  if (original_price !== null && original_price < price) return { error: "Original price must be higher than the selling price." } as const;

  return {
    data: {
      title,
      slug: slugify(str(fd, "slug") || title),
      subtitle: optStr(fd, "subtitle"),
      description: optStr(fd, "description"),
      category,
      status,
      price,
      original_price,
      duration_weeks,
      thumbnail_url: optStr(fd, "thumbnail_url"),
      is_featured: bool(fd, "is_featured"),
    },
  } as const;
}

export async function createCourse(_p: FormState, fd: FormData): Promise<FormState> {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  const parsed = readCourse(fd);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .insert({
      ...parsed.data,
      created_by: admin.id,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    })
    .select("id")
    .single();
  if (error) return dbError(error);
  updateTag("courses");
  redirect(`/admin/courses/${data.id}`);
}

export async function updateCourse(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  const parsed = readCourse(fd);
  if (!UUID.test(id)) return { error: "Invalid course." };
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { data: current } = await supabase.from("courses").select("published_at").eq("id", id).single();
  const { error } = await supabase
    .from("courses")
    .update({
      ...parsed.data,
      published_at:
        parsed.data.status === "published" && !current?.published_at ? new Date().toISOString() : current?.published_at ?? null,
    })
    .eq("id", id);
  if (!error) updateTag("courses");
  return error ? dbError(error) : ok("Course saved.");
}

export async function deleteCourse(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  if (!UUID.test(id)) return { error: "Invalid course." };
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return dbError(error);
  updateTag("courses");
  redirect("/admin/courses");
}

// =====================================================================
// Subjects & chapters (same shape: parent id, title, position)
// =====================================================================
type OutlineTable = "subjects" | "chapters";
const PARENT: Record<OutlineTable, string> = { subjects: "course_id", chapters: "subject_id" };

async function createOutlineItem(table: OutlineTable, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const parentId = str(fd, PARENT[table]);
  const title = str(fd, "title");
  const position = optNum(fd, "position") ?? 0;
  if (!UUID.test(parentId)) return { error: "Invalid parent." };
  if (!title) return { error: "Enter a title." };
  if (badNum(position)) return { error: "Position must be a number." };

  const supabase = await createClient();
  const { error } = await supabase.from(table).insert({ [PARENT[table]]: parentId, title, position });
  return error ? dbError(error) : ok("Added.");
}

async function updateOutlineItem(table: OutlineTable, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  const title = str(fd, "title");
  const position = optNum(fd, "position") ?? 0;
  if (!UUID.test(id) || !title || badNum(position)) return { error: "Enter a title and a valid position." };

  const supabase = await createClient();
  const { error } = await supabase.from(table).update({ title, position }).eq("id", id);
  return error ? dbError(error) : ok("Saved.");
}

async function deleteOutlineItem(table: OutlineTable, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  if (!UUID.test(id)) return { error: "Invalid item." };
  const supabase = await createClient();
  const { error } = await supabase.from(table).delete().eq("id", id);
  return error ? dbError(error) : ok("Deleted.");
}

export const createSubject = async (_p: FormState, fd: FormData) => createOutlineItem("subjects", fd);
export const updateSubject = async (_p: FormState, fd: FormData) => updateOutlineItem("subjects", fd);
export const deleteSubject = async (_p: FormState, fd: FormData) => deleteOutlineItem("subjects", fd);
export const createChapter = async (_p: FormState, fd: FormData) => createOutlineItem("chapters", fd);
export const updateChapter = async (_p: FormState, fd: FormData) => updateOutlineItem("chapters", fd);
export const deleteChapter = async (_p: FormState, fd: FormData) => deleteOutlineItem("chapters", fd);

// =====================================================================
// Lessons
// =====================================================================
export async function createLesson(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const chapter_id = str(fd, "chapter_id");
  const title = str(fd, "title");
  const type = str(fd, "type") || "video";
  const position = optNum(fd, "position") ?? 0;
  if (!UUID.test(chapter_id)) return { error: "Invalid chapter." };
  if (!title) return { error: "Enter a lesson title." };
  if (!LESSON_TYPES.includes(type) || badNum(position)) return { error: "Check the lesson type and position." };

  const supabase = await createClient();
  // New lessons start as drafts so students never see an unfinished lesson.
  const { data, error } = await supabase
    .from("lessons")
    .insert({ chapter_id, title, type, position, is_published: false })
    .select("id")
    .single();
  if (error) return dbError(error);
  redirect(`/admin/lessons/${data.id}`);
}

export async function updateLesson(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  const title = str(fd, "title");
  const type = str(fd, "type");
  const position = optNum(fd, "position") ?? 0;
  const duration_minutes = optNum(fd, "duration_minutes");
  if (!UUID.test(id)) return { error: "Invalid lesson." };
  if (!title) return { error: "Enter a lesson title." };
  if (!LESSON_TYPES.includes(type)) return { error: "Choose a lesson type." };
  if (badNum(position) || badNum(duration_minutes)) return { error: "Position and duration must be numbers." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("lessons")
    .update({
      title,
      type,
      position,
      duration_minutes,
      description: optStr(fd, "description"),
      video_url: optStr(fd, "video_url"),
      content: optStr(fd, "content"),
      attachment_url: optStr(fd, "attachment_url"),
      is_free_preview: bool(fd, "is_free_preview"),
      is_published: bool(fd, "is_published"),
    })
    .eq("id", id);
  return error ? dbError(error) : ok("Lesson saved.");
}

// ---------- Lesson PDF (private "lesson-files" bucket) ----------
// The admin's browser uploads the file straight to Storage (Storage RLS
// only allows admins); these actions record or remove it on the lesson.
const LESSON_FILES = "lesson-files";

export async function saveLessonFile(lessonId: string, path: string): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  if (!UUID.test(lessonId) || !path.startsWith(`${lessonId}/`) || !path.toLowerCase().endsWith(".pdf")) {
    return { error: "Invalid file." };
  }
  const supabase = await createClient();
  const { data: lesson } = await supabase.from("lessons").select("attachment_path").eq("id", lessonId).single();
  const { error } = await supabase.from("lessons").update({ attachment_path: path }).eq("id", lessonId);
  if (error) return dbError(error);
  if (lesson?.attachment_path && lesson.attachment_path !== path) {
    await supabase.storage.from(LESSON_FILES).remove([lesson.attachment_path]);
  }
  return ok("PDF uploaded.");
}

// ---------- Lesson video (Cloudflare Stream) ----------
// The API token stays on the server. The browser only receives a one-time
// upload URL for a single video.

/** Step 1 of an upload: a one-time Cloudflare upload URL for this lesson. */
export async function createVideoUpload(lessonId: string): Promise<{ uploadURL?: string; uid?: string; error?: string }> {
  if (!(await getAdmin())) return DENIED;
  if (!UUID.test(lessonId)) return { error: "Invalid lesson." };
  if (!isStreamApiConfigured()) return { error: "Cloudflare Stream is not configured on the server." };
  try {
    const { uploadURL, uid } = await createDirectUpload(`lesson-${lessonId}`);
    return { uploadURL, uid };
  } catch (error) {
    console.error("[admin] direct upload:", error);
    return { error: "Could not start the upload. Check the Cloudflare settings." };
  }
}

async function linkVideo(lessonId: string, uid: string): Promise<FormState> {
  if (!UUID.test(lessonId)) return { error: "Invalid lesson." };
  if (!VIDEO_UID.test(uid)) return { error: "A Cloudflare video ID has 32 letters/numbers (a–f, 0–9)." };
  if (isStreamApiConfigured()) {
    try {
      await requireSignedUrls(uid); // also confirms the video exists in this account
    } catch (error) {
      console.error("[admin] require signed urls:", error);
      return { error: "That video was not found in your Cloudflare Stream account." };
    }
  }
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").update({ stream_video_id: uid }).eq("id", lessonId);
  return error ? dbError(error) : ok("Video linked to this lesson.");
}

/** Step 2 of an upload: link the uploaded video to the lesson. */
export async function attachStreamVideo(lessonId: string, uid: string): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  return linkVideo(lessonId, uid);
}

/** Link a video already uploaded in the Cloudflare dashboard (e.g. files over 200 MB). */
export async function attachVideoById(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  return linkVideo(str(fd, "id"), str(fd, "video_uid").toLowerCase());
}

export async function removeStreamVideo(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  if (!UUID.test(id)) return { error: "Invalid lesson." };
  const supabase = await createClient();
  const { data: lesson } = await supabase.from("lessons").select("stream_video_id").eq("id", id).single();
  const { error } = await supabase.from("lessons").update({ stream_video_id: null }).eq("id", id);
  if (error) return dbError(error);
  if (fd.get("delete_from_cloudflare") === "true" && lesson?.stream_video_id && isStreamApiConfigured()) {
    try {
      await deleteVideo(lesson.stream_video_id);
    } catch (e) {
      console.error("[admin] delete video:", e);
      return ok("Video unlinked, but it could not be deleted from Cloudflare.");
    }
  }
  return ok("Video removed from this lesson.");
}

export async function removeLessonFile(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  if (!UUID.test(id)) return { error: "Invalid lesson." };
  const supabase = await createClient();
  const { data: lesson } = await supabase.from("lessons").select("attachment_path").eq("id", id).single();
  if (lesson?.attachment_path) {
    const { error: storageError } = await supabase.storage.from(LESSON_FILES).remove([lesson.attachment_path]);
    if (storageError) console.error("[admin] remove file:", storageError.message);
  }
  const { error } = await supabase.from("lessons").update({ attachment_path: null }).eq("id", id);
  return error ? dbError(error) : ok("PDF removed.");
}

export async function deleteLesson(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  const courseId = str(fd, "course_id");
  if (!UUID.test(id)) return { error: "Invalid lesson." };
  const supabase = await createClient();
  const { error } = await supabase.from("lessons").delete().eq("id", id);
  if (error) return dbError(error);
  redirect(UUID.test(courseId) ? `/admin/courses/${courseId}` : "/admin/courses");
}

// =====================================================================
// Payments: approve / reject
// =====================================================================
export async function approvePayment(_p: FormState, fd: FormData): Promise<FormState> {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  const id = str(fd, "id");
  if (!UUID.test(id)) return { error: "Invalid payment." };

  const supabase = await createClient();
  const { data: payment, error: readError } = await supabase
    .from("payments")
    .select("id, user_id, course_id, book_id, status, method, gateway_status")
    .eq("id", id)
    .single();
  if (readError) return dbError(readError);
  if (payment.status !== "pending") return { error: "This payment was already processed." };
  // Online payments are confirmed by SSLCommerz itself; only high-risk ones need a person.
  if (payment.method === "sslcommerz" && payment.gateway_status !== "HIGH_RISK") {
    return { error: "This online payment was not completed on SSLCommerz, so it cannot be approved." };
  }

  const now = new Date().toISOString();
  const { error } = await supabase
    .from("payments")
    .update({ status: "completed", verified_by: admin.id, paid_at: now })
    .eq("id", id);
  if (error) return dbError(error);

  // Course payment -> give the student an active enrollment.
  if (payment.course_id) {
    const { error: enrollError } = await supabase
      .from("enrollments")
      .upsert(
        { user_id: payment.user_id, course_id: payment.course_id, payment_id: id, status: "active", enrolled_at: now },
        { onConflict: "user_id,course_id" }
      );
    if (enrollError) return dbError(enrollError);
  }
  // Book payment -> confirm the linked order.
  if (payment.book_id) {
    const { error: orderError } = await supabase.from("book_orders").update({ status: "confirmed" }).eq("payment_id", id).eq("status", "pending");
    if (orderError) return dbError(orderError);
    return ok("Payment approved. The book order is confirmed.");
  }
  return ok("Payment approved. The student now has access.");
}

export async function rejectPayment(_p: FormState, fd: FormData): Promise<FormState> {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  const id = str(fd, "id");
  if (!UUID.test(id)) return { error: "Invalid payment." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("payments")
    .update({ status: "failed", verified_by: admin.id })
    .eq("id", id)
    .eq("status", "pending");
  if (error) return dbError(error);
  await supabase.from("enrollments").update({ status: "cancelled" }).eq("payment_id", id).eq("status", "pending");
  // A rejected book payment cancels its order (the copies go back to stock).
  const { count } = await supabase
    .from("book_orders")
    .update({ status: "cancelled" }, { count: "exact" })
    .eq("payment_id", id)
    .eq("status", "pending");
  if (count) updateTag("books");
  return ok("Payment rejected.");
}

// =====================================================================
// Enrollments
// =====================================================================
export async function grantEnrollment(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const studentId = str(fd, "student_id").toUpperCase();
  const courseId = str(fd, "course_id");
  const expires = str(fd, "expires_at");
  if (!studentId) return { error: "Enter the Student ID (e.g. SE2600001)." };
  if (!UUID.test(courseId)) return { error: "Choose a course." };

  const supabase = await createClient();
  const { data: student } = await supabase.from("profiles").select("id").eq("student_id", studentId).maybeSingle();
  if (!student) return { error: `No student found with ID ${studentId}.` };

  const { error } = await supabase.from("enrollments").upsert(
    {
      user_id: student.id,
      course_id: courseId,
      status: "active",
      enrolled_at: new Date().toISOString(),
      expires_at: expires ? new Date(`${expires}T23:59:59+06:00`).toISOString() : null,
    },
    { onConflict: "user_id,course_id" }
  );
  return error ? dbError(error) : ok(`Access granted to ${studentId}.`);
}

export async function setEnrollmentStatus(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  const status = str(fd, "status");
  if (!UUID.test(id) || !ENROLLMENT_STATUSES.includes(status)) return { error: "Invalid request." };

  const supabase = await createClient();
  const update: { status: string; expires_at?: null } = { status };
  if (status === "active") update.expires_at = null; // re-activating gives open-ended access
  const { error } = await supabase.from("enrollments").update(update).eq("id", id);
  return error ? dbError(error) : ok("Enrollment updated.");
}

// =====================================================================
// Books
// =====================================================================
function readBook(fd: FormData) {
  const title = str(fd, "title");
  const price = optNum(fd, "price") ?? 0;
  const original_price = optNum(fd, "original_price");
  const pages = optNum(fd, "pages");
  const stock = optNum(fd, "stock") ?? 0;
  if (!title) return { error: "Enter a book title." } as const;
  if (badNum(price) || badNum(original_price) || badNum(pages, 1) || badNum(stock)) return { error: "Check the numbers." } as const;
  if (original_price !== null && original_price < price) return { error: "Original price must be higher than the price." } as const;
  return {
    data: {
      title,
      slug: slugify(str(fd, "slug") || title),
      subtitle: optStr(fd, "subtitle"),
      description: optStr(fd, "description"),
      author: str(fd, "author") || "Shamim Sir",
      cover_url: optStr(fd, "cover_url"),
      price,
      original_price,
      pages,
      stock,
      is_published: bool(fd, "is_published"),
    },
  } as const;
}

export async function createBook(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const parsed = readBook(fd);
  if ("error" in parsed) return { error: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase.from("books").insert(parsed.data);
  if (error) return dbError(error);
  updateTag("books");
  return ok("Book added.");
}

export async function updateBook(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  const parsed = readBook(fd);
  if (!UUID.test(id)) return { error: "Invalid book." };
  if ("error" in parsed) return { error: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase.from("books").update(parsed.data).eq("id", id);
  if (error) return dbError(error);
  updateTag("books");
  return ok("Book saved.");
}

export async function deleteBook(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  if (!UUID.test(id)) return { error: "Invalid book." };
  const supabase = await createClient();
  const { data: book } = await supabase.from("books").select("cover_path, sample_path").eq("id", id).single();
  const { error } = await supabase.from("books").delete().eq("id", id);
  if (error) return dbError(error);
  const files = [book?.cover_path, book?.sample_path].filter(Boolean) as string[];
  if (files.length) await supabase.storage.from(BOOK_BUCKET).remove(files);
  updateTag("books");
  return ok("Book deleted.");
}

// ---------- Book cover & sample PDF (public "book-assets" bucket) ----------
const BOOK_FILE_COLUMN = { cover: "cover_path", sample: "sample_path" } as const;
type BookFileKind = keyof typeof BOOK_FILE_COLUMN;

/** Records a file the admin's browser just uploaded; removes the old one. */
export async function saveBookFile(bookId: string, kind: BookFileKind, path: string): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const column = BOOK_FILE_COLUMN[kind];
  const folder = kind === "cover" ? "covers" : "samples";
  const validExt = kind === "cover" ? /\.(jpe?g|png|webp)$/i : /\.pdf$/i;
  if (!column || !UUID.test(bookId) || !path.startsWith(`${folder}/${bookId}/`) || !validExt.test(path)) {
    return { error: "Invalid file." };
  }
  const supabase = await createClient();
  const { data: book } = await supabase.from("books").select(column).eq("id", bookId).single();
  const old = (book as Record<string, string | null> | null)?.[column];
  const { error } = await supabase.from("books").update({ [column]: path }).eq("id", bookId);
  if (error) return dbError(error);
  if (old && old !== path) await supabase.storage.from(BOOK_BUCKET).remove([old]);
  updateTag("books");
  return ok(kind === "cover" ? "Cover uploaded." : "Sample PDF uploaded.");
}

export async function removeBookFile(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  const column = BOOK_FILE_COLUMN[str(fd, "kind") as BookFileKind];
  if (!UUID.test(id) || !column) return { error: "Invalid request." };
  const supabase = await createClient();
  const { data: book } = await supabase.from("books").select(column).eq("id", id).single();
  const old = (book as Record<string, string | null> | null)?.[column];
  const { error } = await supabase.from("books").update({ [column]: null }).eq("id", id);
  if (error) return dbError(error);
  if (old) await supabase.storage.from(BOOK_BUCKET).remove([old]);
  updateTag("books");
  return ok("File removed.");
}

// ---------- Book orders ----------
const ORDER_FLOW: Record<string, string[]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["shipped", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
};

/**
 * Moves an order along pending -> confirmed -> shipped -> delivered (or
 * cancelled). Confirming a paid order also marks its bKash/Nagad payment as
 * verified; cancelling rejects a still-pending payment. Cancelling returns
 * the copies to stock (database trigger).
 */
export async function setBookOrderStatus(_p: FormState, fd: FormData): Promise<FormState> {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  const id = str(fd, "id");
  const status = str(fd, "status");
  const adminNote = optStr(fd, "admin_note");
  if (!UUID.test(id)) return { error: "Invalid order." };
  if (adminNote && adminNote.length > 500) return { error: "Keep the note under 500 characters." };

  const supabase = await createClient();
  const { data: order, error: readError } = await supabase
    .from("book_orders")
    .select("id, status, payment:payments(id, status, method, gateway_status)")
    .eq("id", id)
    .single();
  if (readError) return dbError(readError);
  const payment = order.payment as unknown as { id: string; status: string } | null;

  if (status && status !== order.status) {
    if (!ORDER_FLOW[order.status]?.includes(status)) return { error: `A ${order.status} order cannot be marked ${status}.` };
    if (status === "confirmed" && payment && payment.status !== "pending" && payment.status !== "completed") {
      return { error: "This order's payment was rejected, so it cannot be confirmed." };
    }
    // Payment first, so a confirmed order always has a verified payment.
    if (payment?.status === "pending" && (status === "confirmed" || status === "cancelled")) {
      const update =
        status === "confirmed"
          ? { status: "completed", verified_by: admin.id, paid_at: new Date().toISOString() }
          : { status: "failed", verified_by: admin.id };
      const { error: payError } = await supabase.from("payments").update(update).eq("id", payment.id).eq("status", "pending");
      if (payError) return dbError(payError);
    }
  }

  const { error } = await supabase
    .from("book_orders")
    .update({ ...(status && status !== order.status ? { status } : {}), admin_note: adminNote })
    .eq("id", id);
  if (error) return dbError(error);
  if (status === "cancelled") updateTag("books");
  return ok("Order updated.");
}

// =====================================================================
// Notices
// =====================================================================
function readNotice(fd: FormData) {
  const title = str(fd, "title");
  const body = str(fd, "body");
  const course_id = optStr(fd, "course_id");
  if (!title || !body) return { error: "Enter a title and message." } as const;
  if (course_id && !UUID.test(course_id)) return { error: "Invalid course." } as const;
  return { data: { title, body, course_id, is_published: bool(fd, "is_published"), is_pinned: bool(fd, "is_pinned") } } as const;
}

export async function createNotice(_p: FormState, fd: FormData): Promise<FormState> {
  const admin = await getAdmin();
  if (!admin) return DENIED;
  const parsed = readNotice(fd);
  if ("error" in parsed) return { error: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase.from("notices").insert({ ...parsed.data, created_by: admin.id });
  return error ? dbError(error) : ok("Notice posted.");
}

export async function updateNotice(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  const parsed = readNotice(fd);
  if (!UUID.test(id)) return { error: "Invalid notice." };
  if ("error" in parsed) return { error: parsed.error };
  const supabase = await createClient();
  const { error } = await supabase.from("notices").update(parsed.data).eq("id", id);
  return error ? dbError(error) : ok("Notice saved.");
}

export async function deleteNotice(_p: FormState, fd: FormData): Promise<FormState> {
  if (!(await getAdmin())) return DENIED;
  const id = str(fd, "id");
  if (!UUID.test(id)) return { error: "Invalid notice." };
  const supabase = await createClient();
  const { error } = await supabase.from("notices").delete().eq("id", id);
  return error ? dbError(error) : ok("Notice deleted.");
}
