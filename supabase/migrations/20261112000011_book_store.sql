-- =====================================================================
-- 11. Book store
--
--  * Books get an uploaded cover and a sample PDF, stored in the PUBLIC
--    "book-assets" bucket (anyone may read them; only admins upload).
--  * book_orders: a student orders a printed book for home delivery.
--      - Orders are created ONLY through place_book_order(), which takes the
--        price from the database, reserves stock and (for paid books)
--        creates the linked manual bKash/Nagad payment in one transaction.
--      - Free books are free for students with an active course enrollment.
--      - One open (pending) order per student per book.
--      - Cancelling an order puts its copies back in stock.
--  * Students can no longer insert book payments directly (only via the
--    function), so a book payment amount can't be tampered with.
-- =====================================================================

alter table public.books
  add column cover_path  text,
  add column sample_path text;

create type public.book_order_status as enum ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');

create table public.book_orders (
  id              uuid primary key default gen_random_uuid(),
  order_no        text not null unique
                  default ('BK-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  book_id         uuid references public.books (id) on delete set null,
  book_title      text not null,
  quantity        integer not null default 1 check (quantity between 1 and 10),
  unit_price      numeric(10, 2) not null check (unit_price >= 0),
  total           numeric(10, 2) not null,
  payment_id      uuid unique references public.payments (id) on delete set null,
  recipient_name  text not null check (char_length(btrim(recipient_name)) between 2 and 100),
  phone           text not null check (phone ~ '^01[3-9][0-9]{8}$'),
  address         text not null check (char_length(btrim(address)) between 10 and 500),
  note            text check (note is null or char_length(note) <= 500),
  status          public.book_order_status not null default 'pending',
  admin_note      text check (admin_note is null or char_length(admin_note) <= 500),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint book_orders_total_check check (total = unit_price * quantity)
);

create index book_orders_user_idx    on public.book_orders (user_id);
create index book_orders_book_idx    on public.book_orders (book_id);
create index book_orders_status_idx  on public.book_orders (status, created_at desc);
create unique index book_orders_one_open_per_book
  on public.book_orders (user_id, book_id) where status = 'pending';

alter table public.book_orders enable row level security;

create trigger book_orders_set_updated_at
  before update on public.book_orders
  for each row execute function public.set_updated_at();

-- Cancelling returns the copies to stock; a cancelled order stays cancelled.
create function public.book_orders_restock()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status = 'cancelled' and new.status <> 'cancelled' then
    raise exception 'A cancelled order cannot be reopened' using errcode = '23514';
  end if;
  if new.status = 'cancelled' and old.status <> 'cancelled' and new.book_id is not null then
    update public.books set stock = stock + new.quantity where id = new.book_id;
  end if;
  return new;
end;
$$;

create trigger book_orders_restock
  before update of status on public.book_orders
  for each row execute function public.book_orders_restock();

-- ---------------------------------------------------------------------
-- RLS: students read their own orders; admins manage all.
-- (No student insert policy: orders are created by place_book_order.)
-- ---------------------------------------------------------------------
create policy "Students view own book orders; admins view all"
  on public.book_orders for select
  to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

create policy "Admins update book orders"
  on public.book_orders for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins delete book orders"
  on public.book_orders for delete
  to authenticated
  using (public.is_admin());

-- ---------------------------------------------------------------------
-- Students may insert COURSE payments only; book payments come from
-- place_book_order(). (Same rule as migration 10 otherwise.)
-- ---------------------------------------------------------------------
drop policy "Users can submit own pending payments; admins insert any" on public.payments;

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
      and val_id is null
      and gateway_status is null
      and gateway_payload is null
      and course_id is not null
      and book_id is null
      and payments.amount = (
        select c.price from public.courses c
        where c.id = payments.course_id and c.status = 'published'
      )
      and (
        screenshot_path is null
        or (storage.foldername(screenshot_path))[1] = (select auth.uid())::text
      )
    )
  );

-- ---------------------------------------------------------------------
-- place_book_order: the only way a student creates an order.
-- Runs with owner rights so it can reserve stock, but checks everything
-- itself and always acts as auth.uid().
-- ---------------------------------------------------------------------
create function public.place_book_order(
  p_book_id         uuid,
  p_quantity        integer,
  p_recipient_name  text,
  p_phone           text,
  p_address         text,
  p_note            text default null,
  p_method          text default null,
  p_sender_number   text default null,
  p_transaction_id  text default null,
  p_screenshot_path text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid     uuid := auth.uid();
  v_book    record;
  v_total   numeric(10, 2);
  v_payment uuid;
  v_order   text;
begin
  if v_uid is null then
    raise exception 'Please log in first' using errcode = '42501';
  end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 10 then
    raise exception 'Quantity must be between 1 and 10' using errcode = '22023';
  end if;

  select id, title, price into v_book
  from public.books
  where id = p_book_id and is_published;
  if not found then
    raise exception 'This book is not available' using errcode = 'P0002';
  end if;

  -- Reserve stock atomically (never below zero).
  update public.books set stock = stock - p_quantity
  where id = v_book.id and stock >= p_quantity;
  if not found then
    raise exception 'Not enough copies in stock' using errcode = 'P0001', hint = 'out_of_stock';
  end if;

  v_total := v_book.price * p_quantity;

  if v_total = 0 then
    -- Free books are for enrolled students.
    if not exists (
      select 1 from public.enrollments e
      where e.user_id = v_uid and e.status = 'active'
        and (e.expires_at is null or e.expires_at > now())
    ) then
      raise exception 'Free books are for enrolled students' using errcode = 'P0001', hint = 'not_enrolled';
    end if;
  else
    if p_method is null or p_method not in ('bkash', 'nagad') then
      raise exception 'Choose a payment method' using errcode = '22023';
    end if;
    if p_transaction_id is null or p_transaction_id !~ '^[A-Z0-9]{8,20}$' then
      raise exception 'Invalid transaction ID' using errcode = '22023';
    end if;
    if p_sender_number is null or p_sender_number !~ '^(\+?88)?01[3-9][0-9]{8}$' then
      raise exception 'Invalid sender number' using errcode = '22023';
    end if;
    if p_screenshot_path is null or (storage.foldername(p_screenshot_path))[1] is distinct from v_uid::text then
      raise exception 'Upload a payment screenshot' using errcode = '22023';
    end if;

    insert into public.payments (user_id, book_id, amount, method, transaction_id, sender_number, screenshot_path)
    values (v_uid, v_book.id, v_total, p_method::public.payment_method, p_transaction_id, p_sender_number, p_screenshot_path)
    returning id into v_payment;
  end if;

  insert into public.book_orders
    (user_id, book_id, book_title, quantity, unit_price, total, payment_id, recipient_name, phone, address, note)
  values
    (v_uid, v_book.id, v_book.title, p_quantity, v_book.price, v_total, v_payment,
     btrim(p_recipient_name), p_phone, btrim(p_address), nullif(btrim(coalesce(p_note, '')), ''))
  returning order_no into v_order;

  return v_order;
end;
$$;

revoke execute on function public.place_book_order(uuid, integer, text, text, text, text, text, text, text, text) from public, anon;
grant execute on function public.place_book_order(uuid, integer, text, text, text, text, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------
-- Public bucket for book covers and sample PDFs (admins upload).
-- Files: covers/<book_id>/<file>, samples/<book_id>/<file>.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('book-assets', 'book-assets', true, 20971520,
        array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "Admins upload book assets"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'book-assets' and public.is_admin());

create policy "Admins list book assets"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'book-assets' and public.is_admin());

create policy "Admins update book assets"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'book-assets' and public.is_admin())
  with check (bucket_id = 'book-assets' and public.is_admin());

create policy "Admins delete book assets"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'book-assets' and public.is_admin());
