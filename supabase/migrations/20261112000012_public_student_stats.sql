-- =====================================================================
-- 12. Public student counts for the homepage
--
--  * public_student_stats(): number of students with an active
--    enrollment, in total and per published course (by slug).
--  * Returns counts only, never names or IDs, so visitors may call it.
--  * Uses enrollments_course_idx (course_id, status).
-- =====================================================================

create or replace function public.public_student_stats()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'total',
    (select count(distinct e.user_id)
       from public.enrollments e
      where e.status = 'active'),
    'by_slug',
    coalesce(
      (select jsonb_object_agg(c.slug, x.students)
         from (select e.course_id, count(*) as students
                 from public.enrollments e
                where e.status = 'active'
                group by e.course_id) x
         join public.courses c on c.id = x.course_id
        where c.status = 'published'),
      '{}'::jsonb)
  );
$$;

revoke all on function public.public_student_stats() from public;
grant execute on function public.public_student_stats() to anon, authenticated;
