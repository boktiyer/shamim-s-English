"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveBookFile } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const KINDS = {
  cover: { folder: "covers", types: ["image/jpeg", "image/png", "image/webp"], maxMb: 5, label: "cover image", hint: "JPG, PNG or WebP, up to 5 MB. Tall (3:4) images look best." },
  sample: { folder: "samples", types: ["application/pdf"], maxMb: 20, label: "sample PDF", hint: "PDF up to 20 MB. Anyone can read the sample, so upload only a few pages." },
} as const;

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

/**
 * Uploads a book cover or sample PDF from the admin's browser to the public
 * "book-assets" bucket (Storage RLS: admins only), then records it on the book.
 */
export function BookFileUploader({ bookId, kind, hasFile }: { bookId: string; kind: keyof typeof KINDS; hasFile: boolean }) {
  const cfg = KINDS[kind];
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function upload(file: File) {
    setMessage(null);
    if (!(cfg.types as readonly string[]).includes(file.type)) return setMessage({ type: "error", text: `Please choose a ${cfg.label}.` });
    if (file.size > cfg.maxMb * 1024 * 1024) return setMessage({ type: "error", text: `The file must be smaller than ${cfg.maxMb} MB.` });

    setBusy(true);
    const path = `${cfg.folder}/${bookId}/${Date.now()}.${EXT[file.type]}`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("book-assets").upload(path, file, { contentType: file.type, cacheControl: "31536000" });

    if (error) {
      setMessage({ type: "error", text: `Upload failed: ${error.message}` });
    } else {
      const result = await saveBookFile(bookId, kind, path);
      if (result.error) {
        await supabase.storage.from("book-assets").remove([path]);
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: result.success ?? "Uploaded." });
        router.refresh();
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept={cfg.types.join(",")} className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <Button type="button" variant="outline" size="lg" disabled={busy} onClick={() => input.current?.click()} className="h-10 px-4">
        {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <Upload data-icon="inline-start" aria-hidden />}
        {busy ? "Uploading…" : `${hasFile ? "Replace" : "Upload"} ${cfg.label}`}
      </Button>
      <p className="text-xs text-muted-foreground">{cfg.hint}</p>
      {message && <p className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-success"}>{message.text}</p>}
    </div>
  );
}
