"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/auth/dal";
import { safeNextPath } from "@/lib/auth/redirects";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  type FormState,
} from "@/lib/auth/validation";

/**
 * Server Actions for authentication. They run only on the server, so
 * passwords are sent straight to Supabase and never handled in the browser
 * beyond the form itself. Only the public (publishable) key is used.
 */

function pick(formData: FormData, keys: string[]) {
  return Object.fromEntries(keys.map((k) => [k, String(formData.get(k) ?? "")]));
}

function fieldErrors(error: z.ZodError) {
  return z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
}

/** Turns Supabase error codes into friendly messages. */
function friendlyAuthError(code: string | undefined, fallback: string) {
  switch (code) {
    case "invalid_credentials":
      return "Incorrect email or password.";
    case "weak_password":
      return "That password is too weak. Try a longer one with letters and numbers.";
    case "over_email_send_rate_limit":
    case "over_request_rate_limit":
      return "Too many attempts. Please wait a minute and try again.";
    case "same_password":
      return "Your new password must be different from the old one.";
    case "signup_disabled":
      return "Registration is currently closed.";
    default:
      return fallback;
  }
}

const NOT_CONFIGURED: FormState = {
  error: "Login isn't available yet: Supabase keys are missing in .env.local.",
};

const confirmUrl = (next: string) =>
  `${siteConfig.url}/auth/confirm?next=${encodeURIComponent(next)}`;

// ---------------------------------------------------------------------
// Register
// ---------------------------------------------------------------------
export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseEnv()) return NOT_CONFIGURED;
  const raw = pick(formData, ["fullName", "email", "phone", "college", "password", "confirmPassword"]);
  const values = { fullName: raw.fullName, email: raw.email, phone: raw.phone, college: raw.college };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const { fullName, email, phone, college, password } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: confirmUrl("/dashboard"),
      // Saved to the profile by the database trigger (never used for the role).
      data: { full_name: fullName, phone, college },
    },
  });

  if (error) {
    return { error: friendlyAuthError(error.code, "Could not create your account. Please try again."), values };
  }

  // Email confirmation turned off in Supabase -> already logged in.
  if (data.session) redirect("/dashboard");

  // Otherwise ask them to verify. (If the email was already registered,
  // Supabase deliberately gives the same response, so we don't reveal it.)
  redirect(`/verify-email?email=${encodeURIComponent(email)}`);
}

// ---------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------
export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseEnv()) return NOT_CONFIGURED;
  const raw = pick(formData, ["email", "password", "next"]);
  const values = { email: raw.email };

  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    if (error.code === "email_not_confirmed") {
      redirect(`/verify-email?email=${encodeURIComponent(parsed.data.email)}&reason=unverified`);
    }
    return { error: friendlyAuthError(error.code, "Could not log you in. Please try again."), values };
  }

  redirect(safeNextPath(raw.next));
}

// ---------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------
export async function logout() {
  if (!getSupabaseEnv()) redirect("/login");
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login?message=logged_out");
}

// ---------------------------------------------------------------------
// Resend verification email
// ---------------------------------------------------------------------
export async function resendVerification(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseEnv()) return NOT_CONFIGURED;
  const parsed = forgotPasswordSchema.safeParse(pick(formData, ["email"]));
  if (!parsed.success) return { error: "Enter a valid email address." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: confirmUrl("/dashboard") },
  });

  if (error && error.code?.startsWith("over_")) {
    return { error: friendlyAuthError(error.code, "") };
  }
  return { success: "If this account still needs verifying, a new email is on its way." };
}

// ---------------------------------------------------------------------
// Forgot password -> sends a reset link
// ---------------------------------------------------------------------
export async function forgotPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseEnv()) return NOT_CONFIGURED;
  const raw = pick(formData, ["email"]);
  const parsed = forgotPasswordSchema.safeParse(raw);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values: raw };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: confirmUrl("/reset-password"),
  });

  if (error && error.code?.startsWith("over_")) {
    return { error: friendlyAuthError(error.code, ""), values: raw };
  }
  // Same message whether or not the email exists (prevents account discovery).
  return {
    success: "If an account exists for that email, we've sent a password reset link. Check your inbox and spam folder.",
  };
}

// ---------------------------------------------------------------------
// Reset password (user arrives here logged in via the email link)
// ---------------------------------------------------------------------
export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!getSupabaseEnv()) return NOT_CONFIGURED;
  const user = await getCurrentUser();
  if (!user) return { error: "Your reset link has expired. Please request a new one." };

  const parsed = resetPasswordSchema.safeParse(pick(formData, ["password", "confirmPassword"]));
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return { error: friendlyAuthError(error.code, "Could not update your password. Please try again.") };
  }

  redirect("/dashboard?message=password_updated");
}
