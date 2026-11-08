-- =====================================================================
-- 5. Notices and lesson progress
-- =====================================================================

-- ---------- Notices ----------
-- course_id = null  -> general notice, visible to everyone
-- course_id = <id>  -> visible only to students enrolled in that course
create table public.notices (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text not null,
  course_id     uuid references public.courses (id) on delete cascade,
  is_published  boolean not null default false,
  is_pinned     boolean not null default false,
  published_at  timestamptz not null default now(),
  created_by    uuid references public.profiles (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index notices_feed_idx on public.notices (is_published, is_pinned desc, published_at desc);
create index notices_course_idx on public.notices (course_id);
create index notices_created_by_idx on public.notices (created_by);

alter table public.notices enable row level security;

create trigger notices_set_updated_at
  before update on public.notices
  for each row execute function public.set_updated_at();

-- ---------- Lesson progress ----------
create table public.lesson_progress (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid not null references public.profiles (id) on delete cascade,
  lesson_id              uuid not null references public.lessons (id) on delete cascade,
  is_completed           boolean not null default false,
  progress_percent       smallint not null default 0 check (progress_percent between 0 and 100),
  last_position_seconds  integer not null default 0 check (last_position_seconds >= 0),
  completed_at           timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  unique (user_id, lesson_id)      -- one progress row per student per lesson
);

create index lesson_progress_lesson_idx on public.lesson_progress (lesson_id);

alter table public.lesson_progress enable row level security;

create trigger lesson_progress_set_updated_at
  before update on public.lesson_progress
  for each row execute function public.set_updated_at();
