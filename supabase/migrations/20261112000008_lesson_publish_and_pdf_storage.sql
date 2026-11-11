-- =====================================================================
-- 8. Lesson publishing + private PDF storage
--
--  * lessons.is_published: draft lessons are hidden from students
--    (existing lessons stay published).
--  * lessons.attachment_path: a PDF uploaded to the private
--    "lesson-files" Storage bucket (in addition to attachment_url,
--    which remains for external links such as Google Drive).
--  * Storage rules: only admins upload/replace/delete; a student can
--    download a lesson's PDF only if they can read that lesson
--    (active enrollment, or a published free-preview lesson).
-- =====================================================================

alter table public.lessons
  add column is_published boolean not null default true,
  add column attachment_path text;

comment on column public.lessons.attachment_path is
  'Path inside the private lesson-files bucket: <lesson_id>/<file>.pdf';

-- ---------------------------------------------------------------------
-- Lessons: students only see published lessons.
-- ---------------------------------------------------------------------
drop policy "Enrolled students and free previews can view lessons" on public.lessons;

create policy "Enrolled students and free previews can view published lessons"
  on public.lessons for select
  to anon, authenticated
  using (
    public.is_admin()
    or (
      lessons.is_published
      and exists (
        select 1
        from public.chapters ch
        join public.subjects s on s.id = ch.subject_id
        join public.courses c on c.id = s.course_id
        where ch.id = lessons.chapter_id
          and c.status = 'published'
          and (lessons.is_free_preview or public.is_enrolled(c.id))
      )
    )
  );

-- Public outline: hide draft lessons from everyone except admins.
create or replace function public.get_course_curriculum(p_course_id uuid)
returns table (
  subject_id        uuid,
  subject_title     text,
  subject_position  integer,
  chapter_id        uuid,
  chapter_title     text,
  chapter_position  integer,
  lesson_id         uuid,
  lesson_title      text,
  lesson_type       public.lesson_type,
  duration_minutes  integer,
  lesson_position   integer,
  is_free_preview   boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    s.id, s.title, s.position,
    ch.id, ch.title, ch.position,
    l.id, l.title, l.type, l.duration_minutes, l.position, l.is_free_preview
  from public.courses c
  join public.subjects s on s.course_id = c.id
  left join public.chapters ch on ch.subject_id = s.id
  left join public.lessons l on l.chapter_id = ch.id and (l.is_published or public.is_admin())
  where c.id = p_course_id
    and (c.status = 'published' or public.is_admin())
  order by s.position, ch.position, l.position;
$$;

-- ---------------------------------------------------------------------
-- Private bucket for lesson PDFs (max 20 MB, PDF only)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lesson-files', 'lesson-files', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

create policy "Admins can upload lesson files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'lesson-files' and public.is_admin());

create policy "Admins can update lesson files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'lesson-files' and public.is_admin())
  with check (bucket_id = 'lesson-files' and public.is_admin());

create policy "Admins can delete lesson files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'lesson-files' and public.is_admin());

-- Files are stored as <lesson_id>/<name>.pdf. Reading the lesson row goes
-- through the lessons RLS policy above, so access matches lesson access.
create policy "Students can read files of lessons they can access"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'lesson-files'
    and (
      public.is_admin()
      or exists (
        select 1 from public.lessons l
        where l.id::text = (storage.foldername(objects.name))[1]
      )
    )
  );
