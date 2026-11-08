"use client";

import { useActionState } from "react";
import { forgotPassword, resendVerification, resetPassword } from "@/app/(auth)/actions";
import type { FormState } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { FormAlert, FormField, SubmitButton } from "./form-parts";

/** Asks for an email and sends a reset link. */
export function ForgotPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(forgotPassword, {});

  if (state.success) return <FormAlert type="success">{state.success}</FormAlert>;

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <FormAlert type="error">{state.error}</FormAlert>}
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        required
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
      />
      <SubmitButton pendingText="Sending link…">Send reset link</SubmitButton>
    </form>
  );
}

/** Sets a new password (user is logged in through the email link). */
export function ResetPasswordForm() {
  const [state, action] = useActionState<FormState, FormData>(resetPassword, {});

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <FormAlert type="error">{state.error}</FormAlert>}
      <FormField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        placeholder="At least 8 characters"
        hint="Use letters and at least one number."
        required
        errors={state.fieldErrors?.password}
      />
      <FormField
        name="confirmPassword"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        placeholder="Type it again"
        required
        errors={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton pendingText="Saving…">Update password</SubmitButton>
    </form>
  );
}

/** "Didn't get the email?" button on the verify-email page. */
export function ResendVerificationForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(resendVerification, {});

  return (
    <form action={action} className="space-y-4">
      {state.error && <FormAlert type="error">{state.error}</FormAlert>}
      {state.success && <FormAlert type="success">{state.success}</FormAlert>}
      <input type="hidden" name="email" value={email} />
      <Button type="submit" variant="outline" size="lg" disabled={pending} className="h-11 w-full">
        {pending ? "Sending…" : "Resend verification email"}
      </Button>
    </form>
  );
}
