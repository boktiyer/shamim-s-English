"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/lib/auth/validation";
import { formatTaka } from "@/lib/format";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/form-parts";
import { TextArea } from "@/components/admin/fields";
import { Label } from "@/components/ui/label";
import { PaymentProofField } from "@/components/shared/payment-proof-field";
import { PaymentMethodFields } from "@/app/enroll/[slug]/manual-payment-form";
import { placeBookOrder } from "./actions";

type Method = { id: string; name: string; number: string; accountType: string; instruction: string };

/** Delivery details, and for paid books the bKash/Nagad TrxID + screenshot. */
export function BookOrderForm({
  slug,
  userId,
  price,
  maxQuantity,
  methods,
  defaults,
}: {
  slug: string;
  userId: string;
  price: number;
  maxQuantity: number;
  methods: Method[];
  defaults: { name: string; phone: string };
}) {
  const [state, action] = useActionState<FormState, FormData>(placeBookOrder, {});
  const [quantity, setQuantity] = useState(Number(state.values?.quantity ?? 1));

  if (state.success) return <FormAlert type="success">{state.success}</FormAlert>;

  const e = state.fieldErrors;
  const v = state.values;
  const paid = price > 0;
  const total = price * quantity;

  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <FormAlert type="error">{state.error}</FormAlert>}
      <input type="hidden" name="slug" value={slug} />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField name="recipient_name" label="Receiver's name" autoComplete="name" defaultValue={v?.recipient_name ?? defaults.name} errors={e?.recipient_name} />
        <FormField name="phone" label="Phone number" type="tel" inputMode="tel" autoComplete="tel" placeholder="01XXXXXXXXX" defaultValue={v?.phone ?? defaults.phone} errors={e?.phone} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="field-address">Delivery address</Label>
        <TextArea id="field-address" name="address" autoComplete="street-address" placeholder="House, road, area, thana, district" defaultValue={v?.address} aria-invalid={Boolean(e?.address)} />
        {e?.address && <p className="text-sm text-destructive">{e.address[0]}</p>}
      </div>

      <div className="grid gap-5 sm:grid-cols-[8rem_1fr]">
        <div className="space-y-2">
          <Label htmlFor="field-quantity">Copies</Label>
          <select
            id="field-quantity"
            name="quantity"
            value={quantity}
            onChange={(ev) => setQuantity(Number(ev.target.value))}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
          >
            {Array.from({ length: Math.min(10, maxQuantity) }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {e?.quantity && <p className="text-sm text-destructive">{e.quantity[0]}</p>}
        </div>
        <FormField name="note" label="Note (optional)" placeholder="e.g. call after 5pm" defaultValue={v?.note} errors={e?.note} />
      </div>

      {paid && (
        <>
          <div className="rounded-lg bg-muted/50 p-4 text-sm">
            <p className="font-medium">
              Total to pay: <span className="font-heading text-lg font-bold text-primary">{formatTaka(total)}</span>
            </p>
            {methods.map((m) => (
              <p key={m.id} className="mt-1 text-muted-foreground">
                <strong className="text-foreground">{m.name}</strong> ({m.accountType}): {m.instruction} {formatTaka(total)} to{" "}
                <span className="font-mono font-bold text-foreground">{m.number}</span>
              </p>
            ))}
          </div>
          <PaymentMethodFields methods={methods} state={state} />
          <PaymentProofField userId={userId} error={e?.screenshot?.[0]} />
        </>
      )}

      <SubmitButton pendingText="Placing order…">{paid ? "Place order" : "Order my free copy"}</SubmitButton>
    </form>
  );
}
