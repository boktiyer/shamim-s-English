"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Upload } from "lucide-react";
import { attachStreamVideo, createVideoUpload } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/dashboard/ui";

const MAX_MB = 200; // Cloudflare basic direct upload limit

/**
 * Uploads a video straight from the admin's browser to Cloudflare Stream
 * using a one-time upload URL made by the server (no secrets in the browser).
 */
export function VideoUploader({ lessonId, hasVideo }: { lessonId: string; hasVideo: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function upload(file: File) {
    setMessage(null);
    if (!file.type.startsWith("video/")) return setMessage({ type: "error", text: "Please choose a video file." });
    if (file.size > MAX_MB * 1024 * 1024) {
      return setMessage({
        type: "error",
        text: `Videos over ${MAX_MB} MB: upload them in the Cloudflare Stream dashboard, then paste the video ID below.`,
      });
    }

    setProgress(0);
    const start = await createVideoUpload(lessonId);
    if (start.error || !start.uploadURL || !start.uid) {
      setProgress(null);
      return setMessage({ type: "error", text: start.error ?? "Could not start the upload." });
    }

    const ok = await new Promise<boolean>((resolve) => {
      const xhr = new XMLHttpRequest();
      const form = new FormData();
      form.append("file", file);
      xhr.upload.onprogress = (e) => e.lengthComputable && setProgress(Math.round((e.loaded / e.total) * 100));
      xhr.onload = () => resolve(xhr.status >= 200 && xhr.status < 300);
      xhr.onerror = () => resolve(false);
      xhr.open("POST", start.uploadURL!);
      xhr.send(form);
    });

    if (!ok) {
      setProgress(null);
      return setMessage({ type: "error", text: "Upload failed. Please check your connection and try again." });
    }

    const result = await attachStreamVideo(lessonId, start.uid);
    setProgress(null);
    if (result.error) return setMessage({ type: "error", text: result.error });
    setMessage({ type: "success", text: "Uploaded! Cloudflare is processing the video; it will be ready in a few minutes." });
    if (input.current) input.current.value = "";
    router.refresh();
  }

  const busy = progress !== null;
  return (
    <div className="space-y-2">
      <input ref={input} type="file" accept="video/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      <Button type="button" variant="outline" size="lg" disabled={busy} onClick={() => input.current?.click()} className="h-10 px-4">
        {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <Upload data-icon="inline-start" aria-hidden />}
        {busy ? `Uploading… ${progress}%` : hasVideo ? "Replace video" : "Upload video"}
      </Button>
      {busy && <ProgressBar percent={progress ?? 0} className="max-w-sm" />}
      <p className="text-xs text-muted-foreground">Up to {MAX_MB} MB here. Students can only watch through secure, expiring links.</p>
      {message && <p className={message.type === "error" ? "text-sm text-destructive" : "text-sm text-success"}>{message.text}</p>}
    </div>
  );
}
