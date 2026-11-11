-- =====================================================================
-- Sample data for trying the student dashboard (safe to run once).
-- Run in the Supabase SQL Editor AFTER all migrations.
-- Creates 1 published course with lessons + notes, notices and a book.
-- =====================================================================

insert into public.courses (id, slug, title, subtitle, category, status, price, original_price, duration_weeks, is_featured, published_at)
values ('11111111-1111-4111-8111-111111111111', 'hsc-final-revision', 'HSC Final Revision Batch',
        'Complete English 1st & 2nd Paper revision', 'hsc_2nd', 'published', 2500, 4000, 20, true, now())
on conflict (id) do nothing;

insert into public.subjects (id, course_id, title, position) values
  ('22222222-2222-4222-8222-222222222221', '11111111-1111-4111-8111-111111111111', 'English 1st Paper', 1),
  ('22222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111', 'English 2nd Paper', 2)
on conflict (id) do nothing;

insert into public.chapters (id, subject_id, title, position) values
  ('33333333-3333-4333-8333-333333333331', '22222222-2222-4222-8222-222222222221', 'Unit 1: Reading Comprehension', 1),
  ('33333333-3333-4333-8333-333333333332', '22222222-2222-4222-8222-222222222222', 'Grammar: Tense & Voice', 1)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, title, type, video_url, content, attachment_url, duration_minutes, position, is_free_preview) values
  ('44444444-4444-4444-8444-444444444441', '33333333-3333-4333-8333-333333333331', 'Course introduction', 'video',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Welcome! How this course works and how to study each unit.', null, 8, 1, true),
  ('44444444-4444-4444-8444-444444444442', '33333333-3333-4333-8333-333333333331', 'Seen comprehension techniques', 'video',
   'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'Read the passage twice, underline key words, then answer.', 'https://example.com/notes/comprehension.pdf', 35, 2, false),
  ('44444444-4444-4444-8444-444444444443', '33333333-3333-4333-8333-333333333332', 'Tense: rules and shortcuts', 'pdf',
   null, 'All 12 tenses with structure and examples.', 'https://example.com/notes/tense-sheet.pdf', 20, 1, false)
on conflict (id) do nothing;

insert into public.notices (id, title, body, course_id, is_published, is_pinned) values
  ('55555555-5555-4555-8555-555555555551', 'Welcome to Shamim''s English',
   'Classes start this Saturday at 8:00 PM. Keep your notebook ready!', null, true, true),
  ('55555555-5555-4555-8555-555555555552', 'Model test on Friday',
   'Model Test 1 (English 1st Paper) will be held on Friday at 9:00 PM.', '11111111-1111-4111-8111-111111111111', true, false)
on conflict (id) do nothing;

insert into public.books (id, slug, title, subtitle, price, original_price, pages, stock, is_published)
values ('66666666-6666-4666-8666-666666666661', 'complete-english-grammar', 'Complete English Grammar',
        'For HSC & Admission', 450, 550, 420, 100, true)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------
-- To test as a student: sign up on the site, verify your email, then
-- replace the email below and run this block. It records a completed
-- bKash payment and an ACTIVE (approved) enrollment.
-- ---------------------------------------------------------------------
-- with student as (select id from public.profiles where email = 'student@example.com'),
-- pay as (
--   insert into public.payments (user_id, course_id, amount, method, status, transaction_id, paid_at)
--   select id, '11111111-1111-4111-8111-111111111111', 2500, 'bkash', 'completed', 'TRX' || floor(random() * 1e9)::text, now()
--   from student returning id, user_id
-- )
-- insert into public.enrollments (user_id, course_id, payment_id, status)
-- select user_id, '11111111-1111-4111-8111-111111111111', id, 'active' from pay;
