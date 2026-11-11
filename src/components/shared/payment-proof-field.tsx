"use client";

import { useState } from "react";
import { ImageUp, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Label } from "@/components/ui/label";

/**
 * Payment screenshot upload. The image goes straight from the browser to the
 * private "payment-proofs" bucket (student's own folder, enforced by Storage
 * RLS) and its path is sent with the form as `screenshot_path`.
 */
export function PaymentProofField({ userId, error }: { userId: string; error?: string }) {
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

  return (
    <div className="space-y-2">
      <input type="hidden" name="screenshot_path" value={proof?.path ?? ""} />
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
      {(uploadError || error) && <p className="text-sm text-destructive">{uploadError ?? error}</p>}
    </div>
  );
}
