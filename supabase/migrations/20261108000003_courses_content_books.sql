-- =====================================================================
-- 3. Course content and books
--    Course -> Subjects -> Chapters -> Lessons
--    e.g. "HSC Final Revision" -> "English 1st Paper" -> "Unit 1" -> "Lesson 1"
-- =====================================================================

-- ---------- Courses ----------
create table public.courses (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null,
  subtitle        text,
  description     text,
  category        public.course_category not null,
  thumbnail_url   text,
  price           numeric(10, 2) not null default 0 check (price >= 0),
  original_price  numeric(10, 2) check (original_price is null or original_price >= price),
  duration_weeks  smallint check (duration_weeks > 0),
  status          public.course_status not null default 'draft',
  is_featured     boolean not null default false,
  created_by      uuid references public.profiles (id) on delete set null,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index courses_status_category_idx on public.courses (status, category);
create index courses_featured_idx on public.courses (is_featured) where is_featured;
create index courses_created_by_idx on public.courses (created_by);

alter table public.courses enable row level security;

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

-- ---------- Subjects ----------
create table public.subjects (
  id           uuid primary key default gen_random_uuid(),
  course_id    uuid not null references public.courses (id) on delete cascade,
  title        text not null,
  description  text,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index subjects_course_position_idx on public.subjects (course_id, position);

alter table public.subjects enable row level security;

create trigger subjects_set_updated_at
  before update on public.subjects
  for each row execute function public.set_updated_at();

-- ---------- Chapters ----------
create table public.chapters (
  id           uuid primary key default gen_random_uuid(),
  subject_id   uuid not null references public.subjects (id) on delete cascade,
  title        text not null,
  description  text,
  position     integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index chapters_subject_position_idx on public.chapters (subject_id, position);

alter table public.chapters enable row level security;

create trigger chapters_set_updated_at
  before update on public.chapters
  for each row execute function public.set_updated_at();

-- ---------- Lessons ----------
-- Contains the private material (video link, notes). Only enrolled students,
-- admins, or anyone for free-preview lessons can read a row. The public course
-- outline is available through get_course_curriculum() (see the RLS migration).
create table public.lessons (
  id                uuid primary key default gen_random_uuid(),
  chapter_id        uuid not null references public.chapters (id) on delete cascade,
  title             text not null,
  description       text,
  type              public.lesson_type not null default 'video',
  video_url         text,
  content           text,          -- rich text / markdown notes
  attachment_url    text,          -- PDF or worksheet
  duration_minutes  integer check (duration_minutes >= 0),
  position          integer not null default 0,
  is_free_preview   boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index lessons_chapter_position_idx on public.lessons (chapter_id, position);

alter table public.lessons enable row level security;

create trigger lessons_set_updated_at
  before update on public.lessons
  for each row execute function public.set_updated_at();

-- ---------- Books ----------
create table public.books (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title           text not null,
  subtitle        text,
  description     text,
  author          text not null default 'Shamim Sir',
  cover_url       text,
  pages           integer check (pages > 0),
  price           numeric(10, 2) not null check (price >= 0),
  original_price  numeric(10, 2) check (original_price is null or original_price >= price),
  stock           integer not null default 0 check (stock >= 0),
  is_published    boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index books_published_idx on public.books (is_published);

alter table public.books enable row level security;

create trigger books_set_updated_at
  before update on public.books
  for each row execute function public.set_updated_at();
