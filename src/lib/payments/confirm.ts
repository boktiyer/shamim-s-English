import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { checkValidation, queryByTranId, validateByValId, type Validation } from "./sslcommerz";

/**
 * Server-side confirmation of SSLCommerz payments. Runs with the admin
 * (secret-key) client because the gateway calls us without a user session.
 * NOTHING here trusts the data the gateway/browser posted: every decision is
 * based on SSLCommerz's own Validation API response.
 */

export type GatewayPayment = {
  id: string;
  user_id: string;
  course_id: string | null;
  amount: number;
  status: string;
  transaction_id: string;
};

export type Outcome = "success" | "review" | "failed" | "error";

export async function confirmPayment(db: SupabaseClient, payment: GatewayPayment, valId: string): Promise<Outcome> {
  if (payment.status === "completed") return "success"; // idempotent (success URL + IPN both arrive)
  if (payment.status !== "pending") return "failed";

  // No val_id posted (or a forged one)? Ask SSLCommerz by our own tran_id.
  let validation: Validation | null = valId ? await validateByValId(valId) : null;
  if (!validation || (validation.status !== "VALID" && validation.status !== "VALIDATED")) {
    const found = (await queryByTranId(payment.transaction_id))?.find((e) => e.status === "VALID" || e.status === "VALIDATED");
    validation = found?.val_id ? await validateByValId(found.val_id) : validation;
  }

  const result = checkValidation(validation, { tranId: payment.transaction_id, amount: Number(payment.amount) });
  const gatewayFields = {
    val_id: validation?.val_id ?? null,
    gateway_payload: validation ?? null,
  };

  if (result === "review") {
    // Paid, but SSLCommerz flagged it as high risk: keep pending for admin approval.
    await db.from("payments").update({ ...gatewayFields, gateway_status: "HIGH_RISK" }).eq("id", payment.id).eq("status", "pending");
    return "review";
  }

  if (result !== "ok") {
    if (result === "mismatch") console.error("[payments] validation mismatch for", payment.transaction_id);
    return "failed";
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await db
    .from("payments")
    .update({ ...gatewayFields, status: "completed", gateway_status: String(validation?.status), paid_at: now })
    .eq("id", payment.id)
    .eq("status", "pending")
    .select("id");
  if (error) {
    console.error("[payments] complete:", error.message);
    return "error";
  }
  if (!updated?.length) return "success"; // another callback completed it first

  if (payment.course_id) {
    const { error: enrollError } = await db
      .from("enrollments")
      .upsert(
        { user_id: payment.user_id, course_id: payment.course_id, payment_id: payment.id, status: "active", enrolled_at: now },
        { onConflict: "user_id,course_id" }
      );
    if (enrollError) {
      console.error("[payments] enroll:", enrollError.message);
      return "error";
    }
  }
  return "success";
}

/** Fail/cancel callback: mark failed only if SSLCommerz confirms it was NOT paid. */
export async function markFailedIfUnpaid(db: SupabaseClient, payment: GatewayPayment, reason: "FAILED" | "CANCELLED"): Promise<Outcome> {
  if (payment.status !== "pending") return payment.status === "completed" ? "success" : "failed";
  const elements = await queryByTranId(payment.transaction_id);
  const paid = elements?.find((e) => e.status === "VALID" || e.status === "VALIDATED");
  if (paid?.val_id) return confirmPayment(db, payment, paid.val_id);
  if (elements === null) return "error"; // couldn't reach SSLCommerz: leave it pending

  await db.from("payments").update({ status: "failed", gateway_status: reason }).eq("id", payment.id).eq("status", "pending");
  return "failed";
}
