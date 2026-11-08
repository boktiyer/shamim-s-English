-- =====================================================================
-- 6. Row Level Security policies
--
--  Rules in plain words:
--   * Visitors (anon) can see published courses, books, the course
--     outline, free-preview lessons and general notices.
--   * Students can read and edit ONLY their own profile, payments,
--     enrollments and progress. Full lessons need an active enrollment.
--   * Admins (profiles.role = 'admin') can manage everything.
--
--  RLS is already enabled on every table in the earlier migrations;
--  with RLS on, anything not allowed below is denied.
--  auth.uid() is wrapped in (select ...) so Postgres evaluates it once
--  per query instead of once per row.
-- =====================================================================

-- ---------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------
create policy "Users can view own profile; admins view all"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or public.is_admin());

create policy "Users can update own profile; admins update all"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or public.is_admin())
  with check (id = (select auth.uid()) or public.is_admin());

create policy "Admins can delete profiles"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());
-- Inserts happen only through the on_auth_user_created trigger.

-- ---------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------
create policy "Anyone can view published courses; admins view all"
  on public.courses for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

create policy "Admins can insert courses"
  on public.courses for insert
  to authenticated
  with check (public.is_admin());

create policy "Admins can update courses"
  on public.courses for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete courses"
  on public.courses for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- subjects (outline structure — visible when the course is published)
-- ---------------------------------------------------------------------
create policy "Anyone can view subjects of published courses"
  on public.subjects for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.courses c
      where c.id = subjects.course_id and c.status = 'published'
    )
  );

create policy "Admins can insert subjects"
  on public.subjects for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update subjects"
  on public.subjects for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete subjects"
  on public.subjects for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- chapters
-- ---------------------------------------------------------------------
create policy "Anyone can view chapters of published courses"
  on public.chapters for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.subjects s
      join public.courses c on c.id = s.course_id
      where s.id = chapters.subject_id and c.status = 'published'
    )
  );

create policy "Admins can insert chapters"
  on public.chapters for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update chapters"
  on public.chapters for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete chapters"
  on public.chapters for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- lessons (private material)
--   Readable by: admins, enrolled students, or anyone if free preview.
-- ---------------------------------------------------------------------
create policy "Enrolled students and free previews can view lessons"
  on public.lessons for select
  to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1
      from public.chapters ch
      join public.subjects s on s.id = ch.subject_id
      join public.courses c on c.id = s.course_id
      where ch.id = lessons.chapter_id
        and c.status = 'published'
        and (lessons.is_free_preview or public.is_enrolled(c.id))
    )
  );

create policy "Admins can insert lessons"
  on public.lessons for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update lessons"
  on public.lessons for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete lessons"
  on public.lessons for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- books
-- ---------------------------------------------------------------------
create policy "Anyone can view published books; admins view all"
  on public.books for select
  to anon, authenticated
  using (is_published or public.is_admin());

create policy "Admins can insert books"
  on public.books for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update books"
  on public.books for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete books"
  on public.books for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- payments
--   Students: see their own, and submit new ones as 'pending' only.
--   Admins: verify / update / delete.
-- ---------------------------------------------------------------------
create policy "Users can view own payments; admins view all"
  on public.payments for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "Users can submit own pending payments; admins insert any"
  on public.payments for insert
  to authenticated
  with check (
    public.is_admin()
    or (
      user_id = (select auth.uid())
      and status = 'pending'
      and verified_by is null
      and paid_at is null
      and num_nonnulls(course_id, book_id) = 1
    )
  );

create policy "Admins can update payments"
  on public.payments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete payments"
  on public.payments for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- enrollments
--   Students can only read their own. Enrollments are created by admins
--   (or by trusted server code using the service role after payment).
-- ---------------------------------------------------------------------
create policy "Users can view own enrollments; admins view all"
  on public.enrollments for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "Admins can insert enrollments"
  on public.enrollments for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update enrollments"
  on public.enrollments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete enrollments"
  on public.enrollments for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- notices
-- ---------------------------------------------------------------------
create policy "View published general notices or notices of enrolled courses"
  on public.notices for select
  to anon, authenticated
  using (
    public.is_admin()
    or (
      is_published
      and published_at <= now()
      and (course_id is null or public.is_enrolled(course_id))
    )
  );

create policy "Admins can insert notices"
  on public.notices for insert to authenticated
  with check (public.is_admin());

create policy "Admins can update notices"
  on public.notices for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins can delete notices"
  on public.notices for delete to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- lesson_progress
--   Students manage only their own rows, and only for lessons they can
--   actually access (the lessons policy above is applied in the check).
-- ---------------------------------------------------------------------
create policy "Users can view own progress; admins view all"
  on public.lesson_progress for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "Users can record progress on accessible lessons"
  on public.lesson_progress for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.lessons l where l.id = lesson_progress.lesson_id)
  );

create policy "Users can update own progress"
  on public.lesson_progress for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.lessons l where l.id = lesson_progress.lesson_id)
  );

create policy "Users can delete own progress; admins delete any"
  on public.lesson_progress for delete
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- =====================================================================
-- Public course outline
--   Returns the subject / chapter / lesson titles of a published course
--   WITHOUT private material (no video links, notes or attachments),
--   so course pages can show the full syllabus to visitors.
-- =====================================================================
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
  left join public.lessons l on l.chapter_id = ch.id
  where c.id = p_course_id
    and (c.status = 'published' or public.is_admin())
  order by s.position, ch.position, l.position;
$$;

-- Helper functions callable from the app; trigger functions are not.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.handle_user_email_change() from public, anon, authenticated;
grant execute on function public.get_course_curriculum(uuid) to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_enrolled(uuid) to anon, authenticated;
