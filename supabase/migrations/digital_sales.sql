-- =============================================================================
-- Penjualan Digital (Token PLN, PLN Pascabayar, Penarikan Dana, dst.)
-- Eksekusi di Supabase SQL Editor:
-- 1. Buka https://supabase.com/dashboard/project/mptpwvvtdxolufwnwzmp/sql
-- 2. Tempel seluruh isi file ini -> Run
-- =============================================================================
begin;

create table public.digital_types (
  id bigint generated always as identity primary key,
  name text not null unique,
  reduces_balance boolean not null default true,
  balance bigint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.digital_sales (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete restrict,
  transaction_type_id bigint not null references public.digital_types (id) on delete restrict,
  invoice_number text not null unique,
  customer_identifier text not null,
  amount bigint not null default 0,
  admin_fee bigint not null default 0,
  cost bigint not null default 0,
  profit bigint not null default 0,
  total_charged bigint not null default 0,
  payment_method text not null check (payment_method in ('cash','transfer','qris','ewallet','credit','debit')),
  status text not null default 'completed' check (status in ('completed','failed')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.digital_balance_movements (
  id bigint generated always as identity primary key,
  digital_type_id bigint not null references public.digital_types (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  amount bigint not null default 0,
  balance_after bigint not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create index digital_sales_user_idx on public.digital_sales (user_id);
create index digital_sales_type_idx on public.digital_sales (transaction_type_id);
create index digital_sales_created_idx on public.digital_sales (created_at desc);
create index digital_balance_movements_type_idx on public.digital_balance_movements (digital_type_id);

alter table public.digital_types enable row level security;
alter table public.digital_sales enable row level security;
alter table public.digital_balance_movements enable row level security;

drop policy if exists "digital_types_select_auth" on public.digital_types;
create policy "digital_types_select_auth" on public.digital_types
  for select to authenticated using (true);

drop policy if exists "digital_sales_select_auth" on public.digital_sales;
create policy "digital_sales_select_auth" on public.digital_sales
  for select to authenticated using (true);

drop policy if exists "digital_balance_movements_select_auth" on public.digital_balance_movements;
create policy "digital_balance_movements_select_auth" on public.digital_balance_movements
  for select to authenticated using (true);

insert into public.digital_types (name, reduces_balance, is_active) values
  ('Token Listrik PLN', true, true),
  ('PLN Pascabayar', true, true),
  ('Penarikan Dana (Cashout)', false, true)
on conflict (name) do nothing;

create or replace function public.save_digital_type(
  p_name text,
  p_reduces_balance boolean default true,
  p_is_active boolean default true,
  p_type_id bigint default null
) returns bigint
language plpgsql security definer set search_path = public
as $$
declare
  v_id bigint;
begin
  if public.current_user_role() <> 'owner' then raise exception 'Unauthorized'; end if;
  if trim(coalesce(p_name,'')) = '' then raise exception 'Nama jenis wajib diisi'; end if;
  if p_type_id is null then
    insert into public.digital_types (name, reduces_balance, is_active)
    values (p_name, p_reduces_balance, p_is_active) returning id into v_id;
  else
    update public.digital_types
    set name = p_name, reduces_balance = p_reduces_balance, is_active = p_is_active
    where id = p_type_id returning id into v_id;
    if v_id is null then raise exception 'Jenis tidak ditemukan'; end if;
  end if;
  return v_id;
end;
$$;

create or replace function public.toggle_digital_type(p_type_id bigint, p_is_active boolean)
returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() <> 'owner' then raise exception 'Unauthorized'; end if;
  update public.digital_types set is_active = p_is_active where id = p_type_id;
  if not found then raise exception 'Jenis tidak ditemukan'; end if;
  return jsonb_build_object('success', true);
end;
$$;

create or replace function public.top_up_digital_balance(
  p_type_id bigint,
  p_amount bigint,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_balance bigint;
  v_new bigint;
begin
  if public.current_user_role() <> 'owner' then raise exception 'Unauthorized'; end if;
  if p_amount < 1 then raise exception 'Jumlah tidak valid'; end if;

  update public.digital_types
  set balance = balance + p_amount
  where id = p_type_id
  returning balance into v_new;
  if v_new is null then raise exception 'Jenis tidak ditemukan'; end if;

  insert into public.digital_balance_movements (digital_type_id, user_id, amount, balance_after, notes)
  values (p_type_id, auth.uid(), abs(p_amount), v_new, coalesce(p_notes, 'Tambah modal'));

  return jsonb_build_object('success', true, 'balance', v_new);
end;
$$;

create or replace function public.process_digital_sale(
  p_type_id bigint,
  p_identifier text,
  p_amount bigint,
  p_admin_fee bigint,
  p_cost bigint,
  p_payment_method text,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_type public.digital_types%rowtype;
  v_profit bigint;
  v_total bigint;
  v_invoice text;
  v_new_balance bigint;
begin
  if public.current_user_role() not in ('owner','cashier') then
    raise exception 'Unauthorized';
  end if;
  if trim(coalesce(p_identifier,'')) = '' then raise exception 'Nomor / ID pelanggan wajib diisi'; end if;
  if p_amount < 0 then raise exception 'Nominal tidak valid'; end if;
  if p_admin_fee < 0 then raise exception 'Biaya admin tidak valid'; end if;
  if p_cost < 0 then raise exception 'Biaya modal tidak valid'; end if;
  if p_payment_method not in ('cash','transfer','qris','ewallet','credit','debit') then
    raise exception 'Metode pembayaran tidak valid';
  end if;

  select * into v_type from public.digital_types where id = p_type_id;
  if not found then raise exception 'Jenis digital tidak ditemukan'; end if;
  if not v_type.is_active then raise exception 'Jenis digital tidak aktif'; end if;

  v_profit := p_admin_fee - p_cost;
  v_total := p_amount + p_admin_fee;

  if v_type.reduces_balance then
    update public.digital_types
    set balance = balance - p_cost
    where id = p_type_id
    returning balance into v_new_balance;
    if v_new_balance is null then raise exception 'Jenis digital tidak ditemukan'; end if;
    if v_new_balance < 0 then
      raise exception 'Saldo modal tidak cukup. Saldo: %, dibutuhkan: %', (v_new_balance + p_cost), p_cost;
    end if;
    insert into public.digital_balance_movements (digital_type_id, user_id, amount, balance_after, notes)
    values (p_type_id, auth.uid(), -p_cost, v_new_balance, 'Transaksi: ' || p_identifier);
  end if;

  v_invoice := 'DIG-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,6));

  insert into public.digital_sales
    (user_id, transaction_type_id, invoice_number, customer_identifier, amount,
     admin_fee, cost, profit, total_charged, payment_method, status, notes)
  values
    (auth.uid(), p_type_id, v_invoice, p_identifier, p_amount,
     p_admin_fee, p_cost, v_profit, v_total, p_payment_method, 'completed', p_notes);

  return jsonb_build_object('success', true, 'invoice', v_invoice,
    'profit', v_profit, 'total_charged', v_total);
end;
$$;

commit;