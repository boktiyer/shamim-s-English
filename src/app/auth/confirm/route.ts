import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { safeNextPath } from "@/lib/auth/redirects";

/**
 * Landing URL for links in Supabase emails (verify email, reset password).
 *
 * Supports both link styles:
 *  - ?token_hash=...&type=...  (recommended email templates; works on any device)
 *  - ?code=...                 (Supabase default templates; same browser only)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  let ok = false;

  if (getSupabaseEnv()) {
    try {
      const supabase = await createClient();
      if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
        ok = !error;
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        ok = !error;
      }
    } catch (error) {
      console.error("Email link verification failed:", error);
    }
  }

  const destination = ok
    ? next
    : `/login?error=${type === "recovery" || next === "/reset-password" ? "reset_link_invalid" : "link_invalid"}`;

  return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
}
