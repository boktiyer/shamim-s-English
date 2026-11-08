import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

/**
 * Data Access Layer for authentication.
 * Every server-side "who is logged in?" check goes through here.
 *
 * getClaims() verifies the session token's signature, so (unlike
 * getSession()) it can't be fooled by a tampered cookie.
 */

export type SessionUser = {
  id: string;
  email: string | null;
};

/** The logged-in user, or null. Cached for the duration of one request. */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  // Read cookies first so pages using this are always rendered per request
  // (never baked into static HTML), even before Supabase is configured.
  await cookies();
  if (!getSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
});

/** Use in protected pages: returns the user or redirects to the login page. */
export async function requireUser(nextPath = "/dashboard"): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export type StudentProfile = {
  id: string;
  student_id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  college: string | null;
  role: "student" | "admin";
  created_at: string;
};

/** The logged-in user's own profile (RLS guarantees it can only be their own). */
export const getCurrentProfile = cache(async (): Promise<StudentProfile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, student_id, full_name, email, phone, college, role, created_at")
    .eq("id", user.id)
    .single();

  if (error) {
    console.error("Failed to load profile:", error.message);
    return null;
  }
  return data as StudentProfile;
});
