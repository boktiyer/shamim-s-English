"use client";

import { useActionState } from "react";
import type { FormState } from "@/lib/auth/validation";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/form-parts";
import { PaymentProofField } from "@/components/shared/payment-proof-field";
import { submitManualPayment } from "./actions";

type Method = { id: string; name: string; number: string; accountType: string; instruction: string };

/** bKash/Nagad: student sends money, then submits TrxID + screenshot. */
export function ManualPaymentForm({ slug, userId, methods }: { slug: string; userId: string; methods: Method[] }) {
  const [state, action] = useActionState<FormState, FormData>(submitManualPayment, {});

  if (state.success) return <FormAlert type="success">{state.success}</FormAlert>;

  const e = state.fieldErrors;
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <FormAlert type="error">{state.error}</FormAlert>}
      <input type="hidden" name="slug" value={slug} />
      <PaymentMethodFields methods={methods} state={state} />
      <PaymentProofField userId={userId} error={e?.screenshot?.[0]} />
      <SubmitButton pendingText="Submitting…">Submit payment for approval</SubmitButton>
    </form>
  );
}

/** "Paid with" choice + sender number + Transaction ID (shared with the book order form). */
export function PaymentMethodFields({ methods, state }: { methods: Method[]; state: FormState }) {
  const e = state.fieldErrors;
  return (
    <>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Paid with</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {methods.map((m) => (
            <label key={m.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 has-checked:border-primary has-checked:bg-secondary/50">
              <input type="radio" name="method" value={m.id} defaultChecked={(state.values?.method ?? methods[0]?.id) === m.id} className="accent-primary" />
              <span className="text-sm">
                <span className="font-semibold">{m.name}</span> · {m.number}
              </span>
            </label>
          ))}
        </div>
        {e?.method && <p className="text-sm text-destructive">{e.method[0]}</p>}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField name="sender_number" label="Your number (sent from)" type="tel" inputMode="tel" placeholder="01XXXXXXXXX" defaultValue={state.values?.sender_number} errors={e?.sender_number} />
        <FormField name="transaction_id" label="Transaction ID (TrxID)" placeholder="e.g. 9BG7XK2LMP" autoCapitalize="characters" defaultValue={state.values?.transaction_id} errors={e?.transaction_id} />
      </div>
    </>
  );
}
