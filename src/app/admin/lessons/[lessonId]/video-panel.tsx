import { getVideo, isStreamApiConfigured, isStreamPlaybackConfigured, signedPlayerUrl } from "@/lib/cloudflare/stream";
import { ActionButton, AdminForm } from "@/components/admin/forms";
import { TextInput } from "@/components/admin/fields";
import { VideoUploader } from "@/components/admin/video-uploader";
import { Panel, StatusBadge } from "@/components/dashboard/ui";
import { StreamPlayer } from "@/components/shared/stream-player";
import { attachVideoById, removeStreamVideo } from "../../actions";

/** Admin: Cloudflare Stream video for one lesson (server component). */
export async function VideoPanel({ lessonId, title, videoUid }: { lessonId: string; title: string; videoUid: string | null }) {
  const apiReady = isStreamApiConfigured();
  const playbackReady = isStreamPlaybackConfigured();

  let status: { ready: boolean; label: string; duration?: number } | null = null;
  if (videoUid && apiReady) {
    try {
      const v = await getVideo(videoUid);
      status = {
        ready: v.readyToStream,
        label: v.readyToStream ? "Ready" : v.status?.state === "error" ? `Error: ${v.status.errorReasonText ?? "processing failed"}` : `Processing ${v.status?.pctComplete ?? ""}%`,
        duration: v.duration,
      };
    } catch {
      status = { ready: false, label: "Not found in Cloudflare" };
    }
  }
  const preview = videoUid && status?.ready !== false ? signedPlayerUrl(videoUid) : null;

  return (
    <Panel title="Lesson video (Cloudflare Stream)">
      {!apiReady && (
        <p className="mb-4 rounded-lg bg-highlight/15 p-3 text-sm">
          Cloudflare Stream is not set up on the server yet. Add the CLOUDFLARE_* settings to the environment (see README).
        </p>
      )}

      {videoUid ? (
        <div className="mb-5 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="font-medium">Video ID:</span>
            <span className="font-mono text-xs">{videoUid}</span>
            {status && <StatusBadge status={status.ready ? "active" : "pending"} label={status.label} />}
            {status?.duration ? <span className="text-muted-foreground">{Math.round(status.duration / 60)} min</span> : null}
          </div>
          {preview ? (
            <div className="max-w-xl">
              <StreamPlayer src={preview} title={title} />
            </div>
          ) : (
            !playbackReady && <p className="text-xs text-muted-foreground">Preview needs the signing key settings.</p>
          )}
          <div className="flex flex-wrap gap-2">
            <ActionButton action={removeStreamVideo} fields={{ id: lessonId }} label="Unlink video" variant="ghost" confirmText="Remove this video from the lesson? (It stays in Cloudflare.)" />
            <ActionButton
              action={removeStreamVideo}
              fields={{ id: lessonId, delete_from_cloudflare: "true" }}
              label="Delete video permanently"
              variant="destructive"
              confirmText="Permanently delete this video from Cloudflare Stream?"
            />
          </div>
        </div>
      ) : (
        <p className="mb-4 text-sm text-muted-foreground">No Cloudflare video yet.</p>
      )}

      {apiReady && (
        <div className="space-y-5">
          <VideoUploader lessonId={lessonId} hasVideo={Boolean(videoUid)} />
          <AdminForm action={attachVideoById} submitLabel="Link video" compact>
            <input type="hidden" name="id" value={lessonId} />
            <TextInput name="video_uid" placeholder="Or paste a Cloudflare video ID (32 characters)" aria-label="Cloudflare video ID" className="h-9 min-w-64 flex-1 font-mono" />
          </AdminForm>
        </div>
      )}
    </Panel>
  );
}
