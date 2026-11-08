import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/dal";
import { buttonClass } from "@/lib/button-class";
import { AuthCard } from "@/components/auth/auth-card";
import { FormAlert } from "@/components/auth/form-parts";
import { ResetPasswordForm } from "@/components/auth/password-forms";

export const metadata: Metadata = { title: "Set a new password" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Set a new password" description="Choose a strong password you haven't used before.">
      <Suspense fallback={<p className="text-sm text-muted-foreground">Checking your reset link…</p>}>
        <ResetPasswordGate />
      </Suspense>
    </AuthCard>
  );
}

/** The email link logs the user in; without that session the link is invalid. */
async function ResetPasswordGate() {
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="space-y-5">
        <FormAlert type="error">
          This reset link is invalid or has expired. Please request a new one.
        </FormAlert>
        <Link href="/forgot-password" className={buttonClass({ size: "lg", className: "h-11 w-full" })}>
          Request a new link
        </Link>
      </div>
    );
  }
  return <ResetPasswordForm />;
}
