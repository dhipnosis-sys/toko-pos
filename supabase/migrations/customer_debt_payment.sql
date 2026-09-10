-- -----------------------------------------------------------------------------
-- Migrasi live: Pembayaran Piutang Pelanggan + pengenal unik nomor telepon.
-- Jalankan di Supabase SQL Editor.
-- Langkah 0 (jika ada nomor telepon duplikat, jalankan dulu):
--   update public.customers
--   set phone = phone || ' (2)'
--   where id in (
--     select id from (
--       select id, phone,
--         row_number() over (partition by phone order by id) as rn
--       from public.customers where phone is not null
--     ) t where t.rn > 1
--   );
-- -----------------------------------------------------------------------------

-- 1. Perluas tipe pembayaran agar mendukung piutang pelanggan
alter table public.payments
  drop constraint if exists payments_payable_type_check,
  add constraint payments_payable_type_check
    check (payable_type in ('sale','supplier','customer'));

-- 2. Pengenal unik pelanggan via nomor telepon (nama boleh sama antar orang)
create unique index if not exists customers_phone_unique_idx
  on public.customers (phone)
  where phone is not null;

-- 3. Fungsi pencatatan pembayaran piutang pelanggan
create or replace function public.record_customer_payment(
  p_customer_id bigint,
  p_amount bigint,
  p_method text,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() not in ('owner','cashier') then
    raise exception 'Unauthorized';
  end if;
  if p_amount < 1 then raise exception 'Jumlah tidak valid'; end if;
  if p_method not in ('cash','transfer','qris','ewallet','credit','debit') then raise exception 'Metode tidak valid'; end if;

  update public.customers
  set total_paid = total_paid + p_amount,
      total_debt = greatest(0, total_debt - p_amount)
  where id = p_customer_id;
  if not found then raise exception 'Pelanggan tidak ditemukan'; end if;

  insert into public.payments (payable_type, payable_id, amount, payment_method, notes)
  values ('customer', p_customer_id, p_amount, p_method, coalesce(p_notes, 'Pembayaran piutang'));

  return jsonb_build_object('success', true);
end;
$$;