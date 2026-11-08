"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/(auth)/actions";
import type { FormState } from "@/lib/auth/validation";
import { FormAlert, FormField, SubmitButton } from "./form-parts";

export function LoginForm({ next, notice }: { next?: string; notice?: { type: "error" | "success" | "info"; text: string } }) {
  const [state, action] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error ? (
        <FormAlert type="error">{state.error}</FormAlert>
      ) : (
        notice && <FormAlert type={notice.type}>{notice.text}</FormAlert>
      )}

      <input type="hidden" name="next" value={next ?? ""} />

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
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        required
        errors={state.fieldErrors?.password}
        labelAction={
          <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            Forgot password?
          </Link>
        }
      />

      <SubmitButton pendingText="Logging in…">Log in</SubmitButton>
    </form>
  );
}
