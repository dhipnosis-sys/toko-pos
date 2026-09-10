-- =============================================================================
-- Penjualan Digital v2: SATU saldo modal gabung + transaksi gabung ke invoice POS
-- File ini self-healing: aman dijalankan walau migrasi digital_sales.sql
-- (v1) belum pernah dijalankan di project ini.
--
-- Cara pakai:
-- 1. Buka https://supabase.com/dashboard/project/mptpwvvtdxolufwnwzmp/sql
-- 2. Tempel seluruh isi file ini -> Run
-- =============================================================================
begin;

-- -----------------------------------------------------------------------------
-- 1. Tabel (create if not exists, dengan skema FINAL)
-- -----------------------------------------------------------------------------
create table if not exists public.digital_types (
  id bigint generated always as identity primary key,
  name text not null unique,
  reduces_balance boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.digital_sales (
  id bigint generated always as identity primary key,
  sale_id bigint references public.sales (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete restrict,
  transaction_type_id bigint not null references public.digital_types (id) on delete restrict,
  invoice_number text,
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

create table if not exists public.digital_balance_movements (
  id bigint generated always as identity primary key,
  digital_type_id bigint references public.digital_types (id) on delete set null,
  user_id uuid not null references public.profiles (id) on delete restrict,
  amount bigint not null default 0,
  balance_after bigint not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table public.digital_modal (
  id int primary key default 1 check (id = 1),
  balance bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 2. Self-healing untuk tabel lama (kalau v1 sudah pernah dijalankan)
-- -----------------------------------------------------------------------------
alter table public.digital_types drop column if exists balance;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'digital_sales' and column_name = 'sale_id'
  ) then
    execute 'alter table public.digital_sales add column sale_id bigint references public.sales (id) on delete cascade';
  end if;
end $$;

do $$
declare cn text;
begin
  select conname into cn
  from pg_constraint
  where conrelid = 'public.digital_sales'::regclass and contype = 'u'
  limit 1;
  if cn is not null then
    execute format('alter table public.digital_sales drop constraint %I', cn);
  end if;
end $$;

alter table public.digital_sales alter column invoice_number drop not null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'digital_balance_movements'
      and column_name = 'digital_type_id' and is_nullable = 'NO'
  ) then
    execute 'alter table public.digital_balance_movements alter column digital_type_id drop not null';
  end if;
end $$;

create index if not exists digital_sales_user_idx on public.digital_sales (user_id);
create index if not exists digital_sales_type_idx on public.digital_sales (transaction_type_id);
create index if not exists digital_sales_sale_idx on public.digital_sales (sale_id);
create index if not exists digital_sales_created_idx on public.digital_sales (created_at desc);
create index if not exists digital_balance_movements_type_idx on public.digital_balance_movements (digital_type_id);

insert into public.digital_modal (id, balance) values (1, 0)
on conflict (id) do nothing;

-- -----------------------------------------------------------------------------
-- 3. RLS
-- -----------------------------------------------------------------------------
alter table public.digital_types enable row level security;
alter table public.digital_sales enable row level security;
alter table public.digital_balance_movements enable row level security;
alter table public.digital_modal enable row level security;

drop policy if exists "digital_types_select_auth" on public.digital_types;
create policy "digital_types_select_auth" on public.digital_types
  for select to authenticated using (true);

drop policy if exists "digital_sales_select_auth" on public.digital_sales;
create policy "digital_sales_select_auth" on public.digital_sales
  for select to authenticated using (true);

drop policy if exists "digital_balance_movements_select_auth" on public.digital_balance_movements;
create policy "digital_balance_movements_select_auth" on public.digital_balance_movements
  for select to authenticated using (true);

drop policy if exists "digital_modal_select_auth" on public.digital_modal;
create policy "digital_modal_select_auth" on public.digital_modal
  for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- 4. Fungsi
-- -----------------------------------------------------------------------------
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

drop function if exists public.top_up_digital_balance;
create or replace function public.top_up_digital_modal(
  p_amount bigint,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_old bigint;
  v_new bigint;
begin
  if public.current_user_role() <> 'owner' then raise exception 'Unauthorized'; end if;
  if p_amount < 1 then raise exception 'Jumlah tidak valid'; end if;

  select balance into v_old from public.digital_modal where id = 1;
  if not found then
    insert into public.digital_modal (id, balance) values (1, 0);
    v_old := 0;
  end if;

  update public.digital_modal
  set balance = balance + p_amount, updated_at = now()
  where id = 1
  returning balance into v_new;

  insert into public.digital_balance_movements (digital_type_id, user_id, amount, balance_after, notes)
  values (null, auth.uid(), p_amount, v_new, coalesce(p_notes, 'Tambah modal'));

  return jsonb_build_object('success', true, 'balance', v_new,
    'previous_balance', v_old, 'added', p_amount);
end;
$$;

drop function if exists public.process_digital_sale;

-- -----------------------------------------------------------------------------
-- 5. process_checkout v2 — satu invoice untuk barang + digital
-- -----------------------------------------------------------------------------
create or replace function public.process_checkout(
  p_user_id uuid,
  p_items jsonb,
  p_payment_method text,
  p_paid_amount bigint default 0,
  p_discount bigint default 0,
  p_customer_id bigint default null,
  p_notes text default null,
  p_digital jsonb default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_item jsonb;
  v_dig jsonb;
  v_product_id bigint;
  v_qty bigint;
  v_price bigint;
  v_cost bigint;
  v_stock bigint;
  v_subtotal bigint := 0;
  v_digital_total bigint := 0;
  v_total_all bigint;
  v_grand bigint;
  v_change bigint;
  v_invoice text;
  v_sale_id bigint;
  v_type_id bigint;
  v_identifier text;
  v_amount bigint;
  v_admin_fee bigint;
  v_cost_dig bigint;
  v_profit bigint;
  v_charged bigint;
  v_modal bigint;
  v_reduces boolean;
  i int;
begin
  if public.current_user_role() not in ('owner','cashier') then
    raise exception 'Unauthorized';
  end if;
  if (p_items is null or jsonb_array_length(p_items) = 0)
     and (p_digital is null or jsonb_array_length(p_digital) = 0) then
    raise exception 'Keranjang kosong';
  end if;
  if p_discount is null or p_discount < 0 then p_discount := 0; end if;
  if p_paid_amount is null or p_paid_amount < 0 then p_paid_amount := 0; end if;

  -- validate product stock
  if p_items is not null then
    for v_item in select * from jsonb_array_elements(p_items) loop
      v_product_id := (v_item->>'product_id')::bigint;
      v_qty := (v_item->>'quantity')::bigint;
      if v_qty < 1 then raise exception 'Jumlah tidak valid'; end if;
      select stock into v_stock from public.products where id = v_product_id;
      if not found then raise exception 'Produk tidak ditemukan: %', v_product_id; end if;
      if v_stock < v_qty then
        raise exception 'Stok produk tidak cukup. Tersedia: %', v_stock;
      end if;
    end loop;

    for v_item in select * from jsonb_array_elements(p_items) loop
      v_product_id := (v_item->>'product_id')::bigint;
      v_qty := (v_item->>'quantity')::bigint;
      v_price := coalesce((v_item->>'price')::bigint, 0);
      if v_qty < 0 or v_price < 0 then raise exception 'Data item tidak valid'; end if;
      v_subtotal := v_subtotal + v_price * v_qty;
    end loop;
  end if;

  -- validate digital lines & check shared modal
  if p_digital is not null then
    select balance into v_modal from public.digital_modal where id = 1;
    if not found then v_modal := 0; end if;

    for v_dig in select * from jsonb_array_elements(p_digital) loop
      v_type_id := (v_dig->>'type_id')::bigint;
      v_identifier := coalesce((v_dig->>'identifier')::text, '');
      v_amount := coalesce((v_dig->>'amount')::bigint, 0);
      v_admin_fee := coalesce((v_dig->>'admin_fee')::bigint, 0);
      v_cost_dig := coalesce((v_dig->>'cost')::bigint, 0);
      if trim(v_identifier) = '' then raise exception 'Nomor / ID pelanggan wajib diisi'; end if;
      if v_amount < 0 or v_admin_fee < 0 or v_cost_dig < 0 then raise exception 'Data digital tidak valid'; end if;

      select reduces_balance into v_reduces
      from public.digital_types where id = v_type_id;
      if not found then raise exception 'Jenis digital tidak ditemukan: %', v_type_id; end if;

      v_charged := v_amount + v_admin_fee;
      v_profit := v_admin_fee - v_cost_dig;
      v_digital_total := v_digital_total + v_charged;

      if v_reduces then
        if v_modal < v_cost_dig then
          raise exception 'Saldo modal tidak cukup. Saldo: %, dibutuhkan: %', v_modal, v_cost_dig;
        end if;
        v_modal := v_modal - v_cost_dig;
        insert into public.digital_balance_movements (digital_type_id, user_id, amount, balance_after, notes)
        values (v_type_id, p_user_id, -v_cost_dig, v_modal, 'Transaksi: ' || v_identifier);
      end if;
    end loop;

    update public.digital_modal set balance = v_modal, updated_at = now() where id = 1;
  end if;

  v_total_all := v_subtotal + v_digital_total;
  if p_discount > v_total_all then p_discount := v_total_all; end if;
  v_grand := v_total_all - p_discount;
  v_change := greatest(0, p_paid_amount - v_grand);

  for i in 1..10 loop
    v_invoice := 'INV-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,6));
    begin
      insert into public.sales (user_id, customer_id, invoice_number, subtotal, discount, tax, grand_total, paid_amount, change_amount, payment_method, status, notes)
      values (p_user_id, p_customer_id, v_invoice, v_total_all, p_discount, 0, v_grand, p_paid_amount, v_change, p_payment_method, 'completed', p_notes)
      returning id into v_sale_id;
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;
  if v_sale_id is null then raise exception 'Gagal membuat nomor invoice'; end if;

  if p_items is not null then
    for v_item in select * from jsonb_array_elements(p_items) loop
      v_product_id := (v_item->>'product_id')::bigint;
      v_qty := (v_item->>'quantity')::bigint;
      v_price := coalesce((v_item->>'price')::bigint, 0);
      select cost_price into v_cost from public.products where id = v_product_id;
      insert into public.sale_items (sale_id, product_id, quantity, unit_price, cost_price, subtotal)
      values (v_sale_id, v_product_id, v_qty, v_price, coalesce(v_cost,0), v_price * v_qty);
      update public.products set stock = stock - v_qty where id = v_product_id and stock >= v_qty;
      if not found then raise exception 'Stok berubah saat transaksi'; end if;
    end loop;
  end if;

  if p_digital is not null then
    for v_dig in select * from jsonb_array_elements(p_digital) loop
      v_type_id := (v_dig->>'type_id')::bigint;
      v_identifier := coalesce((v_dig->>'identifier')::text, '');
      v_amount := coalesce((v_dig->>'amount')::bigint, 0);
      v_admin_fee := coalesce((v_dig->>'admin_fee')::bigint, 0);
      v_cost_dig := coalesce((v_dig->>'cost')::bigint, 0);
      v_charged := v_amount + v_admin_fee;
      v_profit := v_admin_fee - v_cost_dig;
      insert into public.digital_sales
        (sale_id, user_id, transaction_type_id, invoice_number, customer_identifier,
         amount, admin_fee, cost, profit, total_charged, payment_method, status, notes)
      values
        (v_sale_id, p_user_id, v_type_id, v_invoice, v_identifier,
         v_amount, v_admin_fee, v_cost_dig, v_profit, v_charged,
         p_payment_method, 'completed', coalesce(p_notes, 'Transaksi digital'));
    end loop;
  end if;

  if p_customer_id is not null then
    update public.customers
    set total_purchases = total_purchases + v_grand,
        total_paid = total_paid + p_paid_amount,
        total_debt = total_debt + greatest(0, v_grand - p_paid_amount)
    where id = p_customer_id;
  end if;

  if p_paid_amount > 0 then
    insert into public.payments (payable_type, payable_id, amount, payment_method, notes)
    values ('sale', v_sale_id, p_paid_amount, p_payment_method, 'Pembayaran untuk ' || v_invoice);
  end if;

  return jsonb_build_object(
    'success', true,
    'sale_id', v_sale_id,
    'invoice_number', v_invoice,
    'subtotal', v_total_all,
    'digital_total', v_digital_total,
    'discount', p_discount,
    'grand_total', v_grand,
    'paid_amount', p_paid_amount,
    'change_amount', v_change
  );
end;
$$;

commit;