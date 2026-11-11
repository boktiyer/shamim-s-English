import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { confirmPayment, markFailedIfUnpaid, type GatewayPayment, type Outcome } from "@/lib/payments/confirm";

/**
 * SSLCommerz callbacks:
 *   POST /payments/sslcommerz/success | fail | cancel   (student's browser, redirected by the gateway)
 *   POST /payments/sslcommerz/ipn                       (server-to-server notification)
 *
 * The posted fields are only used to FIND the payment. Whether it is paid is
 * decided by SSLCommerz's Validation API on the server (see lib/payments/confirm.ts).
 */
const RESULTS = ["success", "fail", "cancel", "ipn"] as const;

export async function POST(request: NextRequest, { params }: { params: Promise<{ result: string }> }) {
  const { result } = await params;
  if (!RESULTS.includes(result as (typeof RESULTS)[number])) return new NextResponse("Not found", { status: 404 });

  const form = await request.formData().catch(() => null);
  const tranId = String(form?.get("tran_id") ?? "").trim().toUpperCase();
  const valId = String(form?.get("val_id") ?? "").trim();

  const back = (path: string) => NextResponse.redirect(new URL(path, request.nextUrl.origin), 303);
  const db = createAdminClient();
  if (!db || !/^SE-[A-Z0-9-]{6,40}$/.test(tranId)) {
    return result === "ipn" ? new NextResponse("Ignored", { status: 400 }) : back("/dashboard/payments");
  }

  const { data } = await db
    .from("payments")
    .select("id, user_id, course_id, amount, status, transaction_id, course:courses(slug)")
    .eq("transaction_id", tranId)
    .eq("method", "sslcommerz")
    .maybeSingle();
  const payment = data as (GatewayPayment & { course: { slug: string } | null }) | null;
  if (!payment) return result === "ipn" ? new NextResponse("Unknown transaction", { status: 404 }) : back("/dashboard/payments");

  let outcome: Outcome;
  try {
    outcome =
      result === "success" || result === "ipn"
        ? await confirmPayment(db, payment, valId)
        : await markFailedIfUnpaid(db, payment, result === "cancel" ? "CANCELLED" : "FAILED");
  } catch (error) {
    console.error("[sslcommerz] callback:", error);
    outcome = "error";
  }

  if (result === "ipn") return new NextResponse(outcome === "error" ? "Retry" : "OK", { status: outcome === "error" ? 500 : 200 });
  const status = result === "cancel" && outcome === "failed" ? "cancelled" : outcome;
  return back(payment.course ? `/enroll/${payment.course.slug}?payment=${status}` : `/dashboard/payments`);
}

/** If someone opens a callback URL directly, just send them to their payments. */
export function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/dashboard/payments", request.nextUrl.origin), 303);
}
