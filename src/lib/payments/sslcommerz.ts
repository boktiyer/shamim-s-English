import "server-only";

/**
 * SSLCommerz (v4) helpers. SERVER ONLY — uses the store password.
 *
 *   SSLCOMMERZ_STORE_ID        sandbox or live store ID
 *   SSLCOMMERZ_STORE_PASSWORD  store password (API password)
 *   SSLCOMMERZ_SANDBOX         "true" (default) for sandbox, "false" for live
 */

function cfg() {
  const sandbox = (process.env.SSLCOMMERZ_SANDBOX ?? "true") !== "false";
  return {
    storeId: process.env.SSLCOMMERZ_STORE_ID ?? "",
    storePassword: process.env.SSLCOMMERZ_STORE_PASSWORD ?? "",
    base: sandbox ? "https://sandbox.sslcommerz.com" : "https://securepay.sslcommerz.com",
    sandbox,
  };
}

export function isSslcommerzConfigured() {
  const c = cfg();
  return Boolean(c.storeId && c.storePassword && process.env.SUPABASE_SECRET_KEY);
}

export function isSslcommerzSandbox() {
  return cfg().sandbox;
}

/** Our own unique transaction ID, e.g. "SE-LZ3K9-7F2A9C". Upper-case to match the DB rule. */
export function newTranId() {
  const rand = crypto.getRandomValues(new Uint8Array(4));
  return `SE-${Date.now().toString(36)}-${Buffer.from(rand).toString("hex")}`.toUpperCase();
}

export type InitParams = {
  tranId: string;
  amount: number;
  productName: string;
  customer: { name: string; email: string; phone: string };
  urls: { success: string; fail: string; cancel: string; ipn: string };
};

/** Creates a payment session. Returns the gateway page to send the student to. */
export async function initPayment(p: InitParams): Promise<{ url?: string; error?: string }> {
  const c = cfg();
  const body = new URLSearchParams({
    store_id: c.storeId,
    store_passwd: c.storePassword,
    total_amount: p.amount.toFixed(2),
    currency: "BDT",
    tran_id: p.tranId,
    success_url: p.urls.success,
    fail_url: p.urls.fail,
    cancel_url: p.urls.cancel,
    ipn_url: p.urls.ipn,
    cus_name: p.customer.name || "Student",
    cus_email: p.customer.email,
    cus_add1: "Bangladesh",
    cus_city: "Chattogram",
    cus_country: "Bangladesh",
    cus_phone: p.customer.phone || "01700000000",
    shipping_method: "NO",
    num_of_item: "1",
    product_name: p.productName.slice(0, 250),
    product_category: "Education",
    product_profile: "non-physical-goods",
  });

  try {
    const res = await fetch(`${c.base}/gwprocess/v4/api.php`, { method: "POST", body, cache: "no-store" });
    const data = (await res.json()) as { status?: string; GatewayPageURL?: string; failedreason?: string };
    if (data.status === "SUCCESS" && data.GatewayPageURL) return { url: data.GatewayPageURL };
    return { error: data.failedreason || "Payment gateway is unavailable." };
  } catch (error) {
    console.error("[sslcommerz] init:", error);
    return { error: "Could not reach the payment gateway." };
  }
}

export type Validation = {
  status?: string;
  tran_id?: string;
  val_id?: string;
  amount?: string;
  currency?: string;
  risk_level?: string;
  bank_tran_id?: string;
  card_type?: string;
  [key: string]: unknown;
};

/** Order Validation API: asks SSLCommerz directly whether val_id is a real, successful payment. */
export async function validateByValId(valId: string): Promise<Validation | null> {
  const c = cfg();
  const qs = new URLSearchParams({ val_id: valId, store_id: c.storeId, store_passwd: c.storePassword, format: "json" });
  try {
    const res = await fetch(`${c.base}/validator/api/validationserverAPI.php?${qs}`, { cache: "no-store" });
    return (await res.json()) as Validation;
  } catch (error) {
    console.error("[sslcommerz] validate:", error);
    return null;
  }
}

/** Transaction query by our tran_id (used for fail/cancel callbacks). */
export async function queryByTranId(tranId: string): Promise<Validation[] | null> {
  const c = cfg();
  const qs = new URLSearchParams({ tran_id: tranId, store_id: c.storeId, store_passwd: c.storePassword, format: "json" });
  try {
    const res = await fetch(`${c.base}/validator/api/merchantTransIDvalidationAPI.php?${qs}`, { cache: "no-store" });
    const data = (await res.json()) as { element?: Validation[] };
    return data.element ?? [];
  } catch (error) {
    console.error("[sslcommerz] query:", error);
    return null;
  }
}

/**
 * Pure check: does the gateway's answer prove THIS payment was paid in full?
 * Returns "ok", "review" (paid but flagged high-risk → needs admin approval) or a reason.
 */
export function checkValidation(
  v: Validation | null,
  expected: { tranId: string; amount: number }
): "ok" | "review" | "invalid" | "mismatch" {
  if (!v || (v.status !== "VALID" && v.status !== "VALIDATED")) return "invalid";
  if (v.tran_id !== expected.tranId) return "mismatch";
  if (v.currency !== "BDT") return "mismatch";
  if (Math.abs(Number(v.amount) - expected.amount) > 0.009) return "mismatch";
  if (String(v.risk_level) === "1") return "review";
  return "ok";
}
