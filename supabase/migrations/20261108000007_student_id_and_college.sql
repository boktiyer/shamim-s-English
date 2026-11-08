-- =====================================================================
-- 7. Student ID + college name (authentication phase)
--
--  * Every new profile gets a unique, permanent Student ID such as
--    "SE2600001"  (SE = Shamim's English, 26 = sign-up year, then a
--    5-digit running number).
--  * The "institution" column is renamed to "college", and the sign-up
--    form's college name is saved into it.
-- =====================================================================

alter table public.profiles rename column institution to college;

create sequence public.student_id_seq;

-- Builds the next Student ID. SECURITY DEFINER so the signup trigger can
-- use the sequence; it is not callable from the app.
create or replace function public.generate_student_id()
returns text
language sql
volatile
security definer
set search_path = ''
as $$
  select 'SE'
    || to_char(now() at time zone 'Asia/Dhaka', 'YY')
    || lpad(nextval('public.student_id_seq')::text, 5, '0');
$$;

revoke execute on function public.generate_student_id() from public, anon, authenticated;

alter table public.profiles add column student_id text;

-- Give existing profiles (if any) an ID before making the column required.
update public.profiles
set student_id = public.generate_student_id()
where student_id is null;

alter table public.profiles
  alter column student_id set not null,
  alter column student_id set default public.generate_student_id(),
  add constraint profiles_student_id_key unique (student_id);

-- ---------------------------------------------------------------------
-- Sign-up trigger: now also saves the college name.
-- Values come from the sign-up form (user metadata). The role is never
-- taken from metadata; it always starts as 'student'.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, phone, college)
  values (
    new.id,
    new.email,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    left(new.raw_user_meta_data ->> 'phone', 20),
    left(new.raw_user_meta_data ->> 'college', 160)
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Protect fields students must not change: role, email and Student ID.
-- ---------------------------------------------------------------------
create or replace function public.protect_profile_fields()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Student IDs are permanent for everyone, including admins.
  if new.student_id is distinct from old.student_id then
    raise exception 'Student ID cannot be changed';
  end if;

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
