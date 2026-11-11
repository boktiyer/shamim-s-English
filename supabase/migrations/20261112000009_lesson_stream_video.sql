-- =====================================================================
-- 9. Cloudflare Stream video for lessons
--
--  Stores the Cloudflare Stream video UID on a lesson. The UID alone can't
--  play anything: videos require signed URLs, and the app only signs a
--  playback token on the server after checking the student's enrollment.
--  Row access to lessons is already limited by the lessons RLS policy.
-- =====================================================================

alter table public.lessons
  add column stream_video_id text
  check (stream_video_id is null or stream_video_id ~ '^[a-f0-9]{32}$');

comment on column public.lessons.stream_video_id is
  'Cloudflare Stream video UID (32 hex chars). Played via server-signed tokens only.';
