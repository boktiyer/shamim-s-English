-- =====================================================================
-- 2. Student profiles
--    One row per user, linked 1:1 to Supabase Auth (auth.users).
-- =====================================================================

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text not null default '',
  phone        text,
  avatar_url   text,
  institution  text,                -- school / college name
  hsc_batch    smallint check (hsc_batch between 2000 and 2100),
  role         public.user_role not null default 'student',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table public.profiles is 'Public profile for each authenticated user (students and admins).';

create index profiles_role_idx on public.profiles (role) where role = 'admin';

alter table public.profiles enable row level security;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- is_admin(): true when the logged-in user has the admin role.
-- SECURITY DEFINER so it can read profiles without recursive RLS checks.
-- ---------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- Create a profile automatically whenever someone signs up.
-- The role is ALWAYS 'student' here; sign-up data can never make an admin.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.raw_user_meta_data ->> 'phone'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.email in sync when a user changes their login email.
create or replace function public.handle_user_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ---------------------------------------------------------------------
-- Students may edit their own profile, but never their role or email.
-- (Direct SQL / service-role calls, where auth.uid() is null, are allowed
--  so you can promote the first admin from the Supabase dashboard.)
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_admin() then
    if new.role is distinct from old.role then
      raise exception 'Only admins can change user roles';
    end if;
    if new.email is distinct from old.email then
      raise exception 'Email is managed by authentication and cannot be edited here';
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_fields
  before update on public.profiles
  for each row execute function public.protect_profile_fields();
