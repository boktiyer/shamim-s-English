"use client";

import { useActionState, useState } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { FormState } from "@/lib/auth/validation";
import { FormAlert, FormField, SubmitButton } from "@/components/auth/form-parts";
import { Label } from "@/components/ui/label";
import { submitManualPayment } from "./actions";

type Method = { id: string; name: string; number: string; accountType: string; instruction: string };

/** bKash/Nagad: student sends money, then submits TrxID + screenshot. */
export function ManualPaymentForm({ slug, userId, methods }: { slug: string; userId: string; methods: Method[] }) {
  const [state, action] = useActionState<FormState, FormData>(submitManualPayment, {});
  const [proof, setProof] = useState<{ path: string; preview: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadProof(file: File) {
    setUploadError(null);
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return setUploadError("Use a JPG, PNG or WebP image.");
    if (file.size > 5 * 1024 * 1024) return setUploadError("The image must be smaller than 5 MB.");
    setUploading(true);
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
    const { error } = await createClient().storage.from("payment-proofs").upload(path, file, { contentType: file.type });
    setUploading(false);
    if (error) return setUploadError(`Upload failed: ${error.message}`);
    setProof({ path, preview: URL.createObjectURL(file) });
  }

  if (state.success) return <FormAlert type="success">{state.success}</FormAlert>;

  const e = state.fieldErrors;
  return (
    <form action={action} className="space-y-5" noValidate>
      {state.error && <FormAlert type="error">{state.error}</FormAlert>}
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="screenshot_path" value={proof?.path ?? ""} />

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

      <div className="space-y-2">
        <Label htmlFor="proof">Payment screenshot</Label>
        <label
          htmlFor="proof"
          className="flex cursor-pointer items-center gap-4 rounded-lg border border-dashed p-4 hover:border-primary/50 hover:bg-accent"
        >
          {proof ? (
            // eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file
            <img src={proof.preview} alt="Payment screenshot preview" className="size-16 rounded-md object-cover" />
          ) : (
            <span className="flex size-16 items-center justify-center rounded-md bg-secondary text-primary">
              {uploading ? <LoaderCircle className="size-6 animate-spin" /> : <ImageUp className="size-6" />}
            </span>
          )}
          <span className="text-sm">
            <span className="font-medium">{proof ? "Screenshot uploaded. Tap to change." : uploading ? "Uploading…" : "Tap to upload the screenshot"}</span>
            <span className="block text-xs text-muted-foreground">JPG, PNG or WebP, up to 5 MB. Only you and the admin can see it.</span>
          </span>
        </label>
        <input id="proof" type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(ev) => ev.target.files?.[0] && uploadProof(ev.target.files[0])} />
        {(uploadError || e?.screenshot) && <p className="text-sm text-destructive">{uploadError ?? e?.screenshot?.[0]}</p>}
      </div>

      <SubmitButton pendingText="Submitting…">Submit payment for approval</SubmitButton>
    </form>
  );
}
