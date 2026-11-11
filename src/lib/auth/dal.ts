import "server-only";
import { cache } from "react";
import { connection } from "next/server";
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
  // Always run at request time (never during prerendering): the session
  // check reads cookies and Supabase compares token expiry with the clock.
  await connection();
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

/**
 * Use in admin pages: returns the admin's profile, sends logged-out users to
 * login and non-admins to their student dashboard. The role is read from the
 * database on the server, never from the browser.
 */
export async function requireAdmin(nextPath = "/admin"): Promise<StudentProfile> {
  await requireUser(nextPath);
  const profile = await getCurrentProfile();
  if (profile?.role !== "admin") redirect("/dashboard");
  return profile;
}

/** Use in admin server actions: the admin's profile, or null if not an admin. */
export async function getAdmin(): Promise<StudentProfile | null> {
  const profile = await getCurrentProfile();
  return profile?.role === "admin" ? profile : null;
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
