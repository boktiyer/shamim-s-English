-- =====================================================================
-- 1. Shared types and helper functions
-- =====================================================================

-- Who a user is on the platform
create type public.user_role as enum ('student', 'admin');

-- Which program a course belongs to
create type public.course_category as enum ('hsc_1st', 'hsc_2nd', 'admission');

-- Publishing state of a course
create type public.course_status as enum ('draft', 'published', 'archived');

-- Kind of content inside a lesson
create type public.lesson_type as enum ('video', 'pdf', 'text', 'quiz', 'live');

-- Enrollment lifecycle
create type public.enrollment_status as enum ('pending', 'active', 'expired', 'cancelled');

-- Payment lifecycle
create type public.payment_status as enum ('pending', 'completed', 'failed', 'refunded');

-- Supported payment methods in Bangladesh
create type public.payment_method as enum ('bkash', 'nagad', 'rocket', 'card', 'bank', 'cash');

-- Keeps every table's updated_at column current automatically.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
