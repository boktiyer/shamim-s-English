"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { siteConfig } from "@/config/site";
import { activeManualMethods } from "@/config/payments";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentProfile, getCurrentUser } from "@/lib/auth/dal";
import { hasAccess, type EnrollmentStatus } from "@/lib/dashboard/progress";
import { initPayment, isSslcommerzConfigured, newTranId } from "@/lib/payments/sslcommerz";
import type { FormState } from "@/lib/auth/validation";

const BD_PHONE = /^(?:\+?88)?01[3-9]\d{8}$/;
const TRX_ID = /^[A-Z0-9]{8,20}$/;

/** Loads the course fresh from the DB (never trusts the form for the price). */
async function loadCourse(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, slug, title, price")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data as { id: string; slug: string; title: string; price: number } | null;
}

async function alreadyEnrolled(userId: string, courseId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("enrollments")
    .select("status, expires_at")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();
  return data ? hasAccess(data as { status: EnrollmentStatus; expires_at: string | null }) : false;
}

// ---------------------------------------------------------------------
// Manual bKash / Nagad payment
// ---------------------------------------------------------------------
export async function submitManualPayment(_p: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in first." };

  const slug = String(fd.get("slug") ?? "");
  const method = String(fd.get("method") ?? "");
  const sender = String(fd.get("sender_number") ?? "").replace(/[\s-]/g, "");
  const trx = String(fd.get("transaction_id") ?? "").replace(/\s/g, "").toUpperCase();
  const screenshot = String(fd.get("screenshot_path") ?? "");
  const values = { method, sender_number: sender, transaction_id: trx };

  const fieldErrors: Record<string, string[]> = {};
  if (!activeManualMethods.some((m) => m.id === method)) fieldErrors.method = ["Choose a payment method."];
  if (!BD_PHONE.test(sender)) fieldErrors.sender_number = ["Enter the number you sent the money from (01XXXXXXXXX)."];
  if (!TRX_ID.test(trx)) fieldErrors.transaction_id = ["Enter the Transaction ID from your SMS (letters and numbers)."];
  if (!screenshot.startsWith(`${user.id}/`)) fieldErrors.screenshot = ["Upload a screenshot of the payment."];
  if (Object.keys(fieldErrors).length) return { fieldErrors, values };

  const course = await loadCourse(slug);
  if (!course) return { error: "This course is not open for enrollment.", values };
  if (await alreadyEnrolled(user.id, course.id)) return { error: "You are already enrolled in this course.", values };

  const supabase = await createClient();
  // The screenshot must really exist (Storage RLS: only the owner/admin can read it).
  const { error: fileError } = await supabase.storage.from("payment-proofs").createSignedUrl(screenshot, 60);
  if (fileError) return { fieldErrors: { screenshot: ["Screenshot upload not found. Please upload it again."] }, values };

  const { error } = await supabase.from("payments").insert({
    user_id: user.id,
    course_id: course.id,
    amount: course.price, // from the database, never from the form
    method,
    transaction_id: trx,
    sender_number: sender,
    screenshot_path: screenshot,
  });

  if (error) {
    if (error.code === "23505") {
      return error.message.includes("transaction_id")
        ? { fieldErrors: { transaction_id: ["This Transaction ID has already been submitted."] }, values }
        : { error: "You already have a payment for this course waiting for approval.", values };
    }
    if (error.code === "42501") return { error: "The course price has changed. Please refresh the page and try again.", values };
    console.error("[enroll] manual payment:", error.code, error.message);
    return { error: "Could not submit your payment. Please try again.", values };
  }

  refresh();
  return { success: "Payment submitted! We will verify it and unlock your course soon." };
}

// ---------------------------------------------------------------------
// Online payment via SSLCommerz
// ---------------------------------------------------------------------
export async function startOnlinePayment(_p: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user) return { error: "Please log in first." };
  if (!isSslcommerzConfigured()) return { error: "Online payment is not available right now. Please use bKash/Nagad." };

  const course = await loadCourse(String(fd.get("slug") ?? ""));
  if (!course) return { error: "This course is not open for enrollment." };
  if (await alreadyEnrolled(user.id, course.id)) return { error: "You are already enrolled in this course." };

  const profile = await getCurrentProfile();
  const tranId = newTranId();
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert({
    user_id: user.id,
    course_id: course.id,
    amount: course.price,
    method: "sslcommerz",
    transaction_id: tranId,
  });
  if (error) {
    console.error("[enroll] create online payment:", error.code, error.message);
    return { error: "Could not start the payment. Please refresh and try again." };
  }

  const base = `${siteConfig.url}/payments/sslcommerz`;
  const { url, error: initError } = await initPayment({
    tranId,
    amount: Number(course.price),
    productName: course.title,
    customer: { name: profile?.full_name ?? "", email: user.email ?? profile?.email ?? "", phone: profile?.phone ?? "" },
    urls: { success: `${base}/success`, fail: `${base}/fail`, cancel: `${base}/cancel`, ipn: `${base}/ipn` },
  });

  if (!url) {
    await createAdminClient()
      ?.from("payments")
      .update({ status: "failed", gateway_status: "INIT_FAILED" })
      .eq("transaction_id", tranId)
      .eq("status", "pending");
    return { error: initError ?? "Could not start the payment." };
  }
  redirect(url);
}
