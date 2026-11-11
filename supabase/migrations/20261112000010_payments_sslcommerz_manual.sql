-- =====================================================================
-- 10. Payments for Bangladesh: SSLCommerz + manual bKash/Nagad
--
--  * New payment method 'sslcommerz' and gateway fields (val_id, status,
--    raw validation response) — written only by the server after it has
--    verified the payment with SSLCommerz.
--  * Manual payments carry a Transaction ID and a screenshot stored in a
--    private "payment-proofs" bucket (student's own folder).
--  * Duplicate protection:
--      - transaction IDs are stored normalized (trimmed, upper-case) and
--        are unique, so the same TrxID can never be used twice;
--      - SSLCommerz val_id is unique;
--      - a student can have only ONE open manual payment per course.
--  * Students can only submit a payment whose amount equals the course's
--    current published price.
-- =====================================================================

alter type public.payment_method add value if not exists 'sslcommerz';

alter table public.payments
  add column screenshot_path text,
  add column val_id text unique,
  add column gateway_status text,
  add column gateway_payload jsonb;

alter table public.payments
  add constraint payments_transaction_id_normalized
  check (transaction_id is null or transaction_id = upper(btrim(transaction_id)));

-- One open manual payment per student per course.
-- (Listed explicitly so this migration doesn't use the new enum value.)
create unique index payments_one_open_manual_per_course
  on public.payments (user_id, course_id)
  where status = 'pending' and method in ('bkash', 'nagad', 'rocket', 'card', 'bank', 'cash');

-- ---------------------------------------------------------------------
-- Stricter student insert rule
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
      and num_nonnulls(course_id, book_id) = 1
      -- amount must be exactly the published course price
      and (
        payments.course_id is null
        or payments.amount = (
          select c.price from public.courses c
          where c.id = payments.course_id and c.status = 'published'
        )
      )
      -- a screenshot must be in the student's own folder
      and (
        screenshot_path is null
        or (storage.foldername(screenshot_path))[1] = (select auth.uid())::text
      )
    )
  );

-- ---------------------------------------------------------------------
-- Private bucket for payment screenshots (images up to 5 MB)
-- Files are stored as <user_id>/<file>.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('payment-proofs', 'payment-proofs', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Students upload payment proofs to their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'payment-proofs'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Students read own payment proofs; admins read all"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'payment-proofs'
    and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin())
  );

create policy "Admins delete payment proofs"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'payment-proofs' and public.is_admin());
