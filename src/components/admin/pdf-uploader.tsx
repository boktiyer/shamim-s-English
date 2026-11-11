"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { saveLessonFile } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

const MAX_MB = 20;

/**
 * Uploads a PDF straight from the admin's browser to the private
 * "lesson-files" bucket (Storage RLS allows admins only), then records it
 * on the lesson with a server action.
 */
export function PdfUploader({ lessonId, hasFile }: { lessonId: string; hasFile: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function upload(file: File) {
    setMessage(null);
    if (file.type !== "application/pdf") return setMessage({ type: "error", text: "Please choose a PDF file." });
    if (file.size > MAX_MB * 1024 * 1024) return setMessage({ type: "error", text: `The PDF must be smaller than ${MAX_MB} MB.` });

    setBusy(true);
    const safeName = file.name.toLowerCase().replace(/\.pdf$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "notes";
    const path = `${lessonId}/${Date.now()}-${safeName}.pdf`;
    const supabase = createClient();
    const { error } = await supabase.storage.from("lesson-files").upload(path, file, { contentType: "application/pdf" });

    if (error) {
      setMessage({ type: "error", text: `Upload failed: ${error.message}` });
    } else {
      const result = await saveLessonFile(lessonId, path);
      if (result.error) {
        await supabase.storage.from("lesson-files").remove([path]);
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "PDF uploaded." });
        router.refresh();
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
  }

  return (
    <div className="space-y-2">
      <input
        ref={input}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
      />
      <Button type="button" variant="outline" size="lg" disabled={busy} onClick={() => input.current?.click()} className="h-10 px-4">
        {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <Upload data-icon="inline-start" aria-hidden />}
        {busy ? "Uploading…" : hasFile ? "Replace PDF" : "Upload PDF"}
      </Button>
      <p className="text-xs text-muted-foreground">PDF only, up to {MAX_MB} MB. Only students who can open this lesson can download it.</p>
      {message && (
        <p className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-success"}>{message.text}</p>
      )}
    </div>
  );
}
