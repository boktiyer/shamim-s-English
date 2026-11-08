-- =====================================================================
-- 4. Payments and course enrollments
-- =====================================================================

-- ---------- Payments ----------
-- A student submits a payment (e.g. bKash transaction ID) as 'pending';
-- an admin verifies it and marks it 'completed'.
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  course_id       uuid references public.courses (id) on delete set null,
  book_id         uuid references public.books (id) on delete set null,
  amount          numeric(10, 2) not null check (amount >= 0),
  currency        char(3) not null default 'BDT',
  method          public.payment_method not null,
  status          public.payment_status not null default 'pending',
  transaction_id  text unique,     -- provider transaction ID (bKash TrxID etc.)
  sender_number   text,            -- mobile wallet number used to pay
  notes           text,
  verified_by     uuid references public.profiles (id) on delete set null,
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.payments.course_id is 'Set for course purchases. A row is for a course or a book (set at creation).';

create index payments_user_idx on public.payments (user_id, created_at desc);
create index payments_course_idx on public.payments (course_id);
create index payments_book_idx on public.payments (book_id);
create index payments_status_idx on public.payments (status, created_at desc);
create index payments_verified_by_idx on public.payments (verified_by);

alter table public.payments enable row level security;

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- ---------- Enrollments ----------
create table public.enrollments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  course_id    uuid not null references public.courses (id) on delete cascade,
  payment_id   uuid references public.payments (id) on delete set null,
  status       public.enrollment_status not null default 'pending',
  enrolled_at  timestamptz not null default now(),
  expires_at   timestamptz,        -- null = lifetime access
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, course_id)      -- also serves as the index for user lookups
);

create index enrollments_course_idx on public.enrollments (course_id, status);
create index enrollments_payment_idx on public.enrollments (payment_id);

alter table public.enrollments enable row level security;

create trigger enrollments_set_updated_at
  before update on public.enrollments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- is_enrolled(course): true when the logged-in user has an active,
-- unexpired enrollment in the course.
-- ---------------------------------------------------------------------
create or replace function public.is_enrolled(p_course_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enrollments
    where user_id = (select auth.uid())
      and course_id = p_course_id
      and status = 'active'
      and (expires_at is null or expires_at > now())
  );
$$;
