"use client";

import { useActionState } from "react";
import { register } from "@/app/(auth)/actions";
import type { FormState } from "@/lib/auth/validation";
import { FormAlert, FormField, SubmitButton } from "./form-parts";

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(register, {});
  const e = state.fieldErrors;
  const v = state.values;

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <FormAlert type="error">{state.error}</FormAlert>}

      <FormField
        name="fullName"
        label="Full name"
        autoComplete="name"
        placeholder="e.g. Nusrat Jahan"
        required
        defaultValue={v?.fullName}
        errors={e?.fullName}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          defaultValue={v?.email}
          errors={e?.email}
        />
        <FormField
          name="phone"
          label="Phone number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          required
          defaultValue={v?.phone}
          errors={e?.phone}
        />
      </div>

      <FormField
        name="college"
        label="College name"
        autoComplete="organization"
        placeholder="e.g. Chittagong College"
        required
        defaultValue={v?.college}
        errors={e?.college}
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="At least 8 characters"
          hint="Use letters and at least one number."
          required
          errors={e?.password}
        />
        <FormField
          name="confirmPassword"
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          placeholder="Type it again"
          required
          errors={e?.confirmPassword}
        />
      </div>

      <SubmitButton pendingText="Creating your account…">Create account</SubmitButton>
    </form>
  );
}
