import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "./env";

/**
 * Privileged Supabase client (bypasses RLS). SERVER ONLY.
 *
 * Used ONLY by the SSLCommerz callbacks, which arrive from the payment
 * gateway without a logged-in user, to record a payment AFTER it has been
 * verified with SSLCommerz's validation API. Never import this from a
 * Client Component, and never give the key a NEXT_PUBLIC_ prefix.
 */
export function createAdminClient() {
  const env = getSupabaseEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!env || !secret) return null;
  return createClient(env.url, secret, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
