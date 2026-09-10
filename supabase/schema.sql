-- =============================================================================
-- TOKO POS — Supabase (PostgreSQL) schema
-- Rewrite spec from the Laravel 11 codebase. All money columns are BIGINT
-- (integer rupiah) to avoid float issues, matching the original app.
-- Run this entire file in the Supabase SQL Editor.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Extensions
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Helper: current user's role (security definer so RLS can read profiles)
-- -----------------------------------------------------------------------------
create or replace function public.current_user_role()
returns text
language plpgsql stable security definer set search_path = public
as $$
begin
  return coalesce(
    (select role from public.profiles where id = auth.uid()),
    'cashier'
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Helper: count products whose stock is at/below min_stock (dashboard badge)
-- -----------------------------------------------------------------------------
create or replace function public.count_low_stock()
returns bigint
language plpgsql stable security definer set search_path = public
as $$
begin
  return (
    select count(*)
    from public.products
    where is_active = true
      and stock <= min_stock
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Helper: generic updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles — mirror of app users (links Supabase auth.users)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'cashier' check (role in ('owner', 'cashier', 'warehouse')),
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- First registered user becomes owner; everyone else is cashier (bootstrap).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  v_role text;
begin
  select case
    when exists (select 1 from public.profiles where role = 'owner') then 'cashier'
    else 'owner'
  end into v_role;

  insert into public.profiles (id, name, email, role, is_active)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    new.email,
    v_role,
    true
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
create table public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  description text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- suppliers
-- -----------------------------------------------------------------------------
create table public.suppliers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text,
  email text,
  address text,
  city text,
  tax_id text,
  opening_balance bigint not null default 0,
  total_purchases bigint not null default 0,
  total_paid bigint not null default 0,
  total_debt bigint not null default 0,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger suppliers_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- customers
-- -----------------------------------------------------------------------------
create table public.customers (
  id bigint generated always as identity primary key,
  name text not null,
  phone text,
  email text,
  address text,
  city text,
  debt_limit bigint not null default 0,
  total_purchases bigint not null default 0,
  total_paid bigint not null default 0,
  total_debt bigint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger customers_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- products
-- -----------------------------------------------------------------------------
create table public.products (
  id bigint generated always as identity primary key,
  category_id bigint references public.categories (id) on delete set null,
  supplier_id bigint references public.suppliers (id) on delete set null,
  name text not null,
  slug text not null unique,
  sku text not null unique,
  barcode text,
  description text,
  cost_price bigint not null default 0,
  retail_price bigint not null default 0,
  wholesale_price bigint not null default 0,
  reseller_price bigint not null default 0,
  stock bigint not null default 0,
  min_stock bigint not null default 0,
  unit text not null default 'pcs' check (unit in ('pcs', 'pack', 'box')),
  notes text,
  image text,
  is_active boolean not null default true,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_supplier_idx on public.products (supplier_id);
create index products_active_idx on public.products (is_active) where deleted_at is null;

create trigger products_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- sales
-- -----------------------------------------------------------------------------
create table public.sales (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete restrict,
  customer_id bigint references public.customers (id) on delete set null,
  invoice_number text not null unique,
  subtotal bigint not null default 0,
  discount bigint not null default 0,
  tax bigint not null default 0,
  grand_total bigint not null default 0,
  paid_amount bigint not null default 0,
  change_amount bigint not null default 0,
  payment_method text not null check (payment_method in ('cash','transfer','qris','ewallet','credit','debit','receivable')),
  status text not null default 'completed' check (status in ('completed','pending','cancelled')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sales_user_idx on public.sales (user_id);
create index sales_customer_idx on public.sales (customer_id);
create index sales_created_idx on public.sales (created_at desc);

create trigger sales_updated_at
  before update on public.sales
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- sale_items
-- -----------------------------------------------------------------------------
create table public.sale_items (
  id bigint generated always as identity primary key,
  sale_id bigint not null references public.sales (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete restrict,
  quantity bigint not null default 0,
  unit_price bigint not null default 0,
  cost_price bigint not null default 0,
  subtotal bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sale_items_sale_idx on public.sale_items (sale_id);
create index sale_items_product_idx on public.sale_items (product_id);

create trigger sale_items_updated_at
  before update on public.sale_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- purchases
-- -----------------------------------------------------------------------------
create table public.purchases (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete restrict,
  supplier_id bigint references public.suppliers (id) on delete set null,
  invoice_number text not null unique,
  subtotal bigint not null default 0,
  grand_total bigint not null default 0,
  status text not null default 'completed' check (status in ('completed','pending')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchases_user_idx on public.purchases (user_id);
create index purchases_supplier_idx on public.purchases (supplier_id);

create trigger purchases_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- purchase_items
-- -----------------------------------------------------------------------------
create table public.purchase_items (
  id bigint generated always as identity primary key,
  purchase_id bigint not null references public.purchases (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete restrict,
  quantity bigint not null default 0,
  cost_price bigint not null default 0,
  subtotal bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index purchase_items_purchase_idx on public.purchase_items (purchase_id);
create index purchase_items_product_idx on public.purchase_items (product_id);

create trigger purchase_items_updated_at
  before update on public.purchase_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- payments (polymorphic: payable_type in ('sale','supplier'))
-- -----------------------------------------------------------------------------
create table public.payments (
  id bigint generated always as identity primary key,
  payable_type text not null check (payable_type in ('sale','supplier')),
  payable_id bigint not null,
  amount bigint not null default 0,
  payment_method text not null check (payment_method in ('cash','transfer','qris','ewallet','credit','debit','receivable')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index payments_payable_idx on public.payments (payable_type, payable_id);

create trigger payments_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- settings — flat key/value store
-- -----------------------------------------------------------------------------
create table public.settings (
  id bigint generated always as identity primary key,
  key text not null unique,
  value text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger settings_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- bill_of_materials
-- -----------------------------------------------------------------------------
create table public.bill_of_materials (
  id bigint generated always as identity primary key,
  product_id bigint references public.products (id) on delete set null,
  finished_good_type text not null default 'product' check (finished_good_type in ('product','manual')),
  finished_good_name text,
  finished_good_unit text,
  name text not null,
  quantity numeric(15,2) not null default 1,
  unit text,
  labor_cost bigint not null default 0,
  overhead_cost bigint not null default 0,
  profit_type text not null default 'percentage' check (profit_type in ('percentage','amount')),
  profit_value bigint not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bom_product_idx on public.bill_of_materials (product_id);

create trigger bom_updated_at
  before update on public.bill_of_materials
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- bill_of_material_items
-- -----------------------------------------------------------------------------
create table public.bill_of_material_items (
  id bigint generated always as identity primary key,
  bill_of_material_id bigint not null references public.bill_of_materials (id) on delete cascade,
  item_type text not null default 'product' check (item_type in ('product','manual')),
  product_id bigint references public.products (id) on delete set null,
  item_name text,
  item_unit text,
  quantity numeric(15,2) not null default 1,
  unit_cost bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bom_items_bom_idx on public.bill_of_material_items (bill_of_material_id);

create trigger bom_items_updated_at
  before update on public.bill_of_material_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- production_orders
-- -----------------------------------------------------------------------------
create table public.production_orders (
  id bigint generated always as identity primary key,
  order_number text not null unique,
  product_id bigint references public.products (id) on delete set null,
  finished_good_type text not null default 'product' check (finished_good_type in ('product','manual')),
  finished_good_name text,
  bill_of_material_id bigint references public.bill_of_materials (id) on delete set null,
  quantity bigint not null default 0,
  status text not null default 'planned' check (status in ('planned','completed','cancelled')),
  total_raw_material_cost bigint not null default 0,
  total_labor_cost bigint not null default 0,
  total_overhead_cost bigint not null default 0,
  total_cost bigint not null default 0,
  cost_per_unit bigint not null default 0,
  apply_cost_price boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  notes text,
  user_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index production_orders_user_idx on public.production_orders (user_id);

create trigger production_orders_updated_at
  before update on public.production_orders
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- production_order_items
-- -----------------------------------------------------------------------------
create table public.production_order_items (
  id bigint generated always as identity primary key,
  production_order_id bigint not null references public.production_orders (id) on delete cascade,
  item_type text not null default 'product' check (item_type in ('product','manual')),
  product_id bigint references public.products (id) on delete set null,
  item_name text,
  quantity_planned numeric(15,2) not null default 0,
  quantity_used numeric(15,2) not null default 0,
  unit_cost bigint not null default 0,
  subtotal bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index prod_items_order_idx on public.production_order_items (production_order_id);

create trigger prod_items_updated_at
  before update on public.production_order_items
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Views used by reports/dashboard
-- -----------------------------------------------------------------------------
create or replace view public.v_sale_items as
select
  s.id                as sale_id,
  s.invoice_number,
  s.payment_method,
  s.status            as sale_status,
  s.created_at        as sale_date,
  s.user_id,
  s.customer_id,
  si.product_id,
  si.quantity,
  si.unit_price,
  si.cost_price,
  si.subtotal
from public.sales s
join public.sale_items si on si.sale_id = s.id;

-- -----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------------------------------------------
alter table public.profiles            enable row level security;
alter table public.categories          enable row level security;
alter table public.suppliers           enable row level security;
alter table public.customers           enable row level security;
alter table public.products            enable row level security;
alter table public.sales               enable row level security;
alter table public.sale_items          enable row level security;
alter table public.purchases           enable row level security;
alter table public.purchase_items      enable row level security;
alter table public.payments            enable row level security;
alter table public.settings            enable row level security;
alter table public.bill_of_materials   enable row level security;
alter table public.bill_of_material_items enable row level security;
alter table public.production_orders   enable row level security;
alter table public.production_order_items enable row level security;

-- profiles ---------------------------------------------------------------
drop policy if exists "profiles_select_auth" on public.profiles;
create policy "profiles_select_auth" on public.profiles
  for select to authenticated using (true);

-- Users can update their own basic info; owners can update any profile role/status
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid() or public.current_user_role() = 'owner')
  with check (id = auth.uid() or public.current_user_role() = 'owner');

-- categories -------------------------------------------------------------
drop policy if exists "categories_select_auth" on public.categories;
create policy "categories_select_auth" on public.categories
  for select to authenticated using (true);

drop policy if exists "categories_write" on public.categories;
create policy "categories_write" on public.categories
  for all to authenticated
  using (public.current_user_role() in ('owner','warehouse'))
  with check (public.current_user_role() in ('owner','warehouse'));

-- suppliers --------------------------------------------------------------
drop policy if exists "suppliers_select_auth" on public.suppliers;
create policy "suppliers_select_auth" on public.suppliers
  for select to authenticated using (true);

drop policy if exists "suppliers_write" on public.suppliers;
create policy "suppliers_write" on public.suppliers
  for all to authenticated
  using (public.current_user_role() in ('owner','warehouse'))
  with check (public.current_user_role() in ('owner','warehouse'));

-- customers --------------------------------------------------------------
drop policy if exists "customers_select_auth" on public.customers;
create policy "customers_select_auth" on public.customers
  for select to authenticated using (true);

-- Owner + cashier manage customers (matches original permission matrix)
drop policy if exists "customers_write" on public.customers;
create policy "customers_write" on public.customers
  for all to authenticated
  using (public.current_user_role() in ('owner','cashier'))
  with check (public.current_user_role() in ('owner','cashier'));

-- products ---------------------------------------------------------------
drop policy if exists "products_select_auth" on public.products;
create policy "products_select_auth" on public.products
  for select to authenticated using (true);

-- Warehouse + owner manage products; cashier needs UPDATE for POS stock decrement
drop policy if exists "products_insert" on public.products;
create policy "products_insert" on public.products
  for insert to authenticated
  with check (public.current_user_role() in ('owner','warehouse'));

drop policy if exists "products_update" on public.products;
create policy "products_update" on public.products
  for update to authenticated
  using (true)
  with check (true);

drop policy if exists "products_delete" on public.products;
create policy "products_delete" on public.products
  for delete to authenticated
  using (public.current_user_role() in ('owner','warehouse'));

-- sales ------------------------------------------------------------------
drop policy if exists "sales_select_auth" on public.sales;
create policy "sales_select_auth" on public.sales
  for select to authenticated using (true);

drop policy if exists "sales_insert" on public.sales;
create policy "sales_insert" on public.sales
  for insert to authenticated
  with check (public.current_user_role() in ('owner','cashier'));

drop policy if exists "sales_update" on public.sales;
create policy "sales_update" on public.sales
  for update to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

drop policy if exists "sales_delete" on public.sales;
create policy "sales_delete" on public.sales
  for delete to authenticated
  using (public.current_user_role() = 'owner');

-- sale_items -------------------------------------------------------------
drop policy if exists "sale_items_select_auth" on public.sale_items;
create policy "sale_items_select_auth" on public.sale_items
  for select to authenticated using (true);

drop policy if exists "sale_items_insert" on public.sale_items;
create policy "sale_items_insert" on public.sale_items
  for insert to authenticated
  with check (public.current_user_role() in ('owner','cashier'));

drop policy if exists "sale_items_delete" on public.sale_items;
create policy "sale_items_delete" on public.sale_items
  for delete to authenticated
  using (public.current_user_role() = 'owner');

-- purchases --------------------------------------------------------------
drop policy if exists "purchases_select_auth" on public.purchases;
create policy "purchases_select_auth" on public.purchases
  for select to authenticated using (true);

drop policy if exists "purchases_write" on public.purchases;
create policy "purchases_write" on public.purchases
  for all to authenticated
  using (public.current_user_role() in ('owner','warehouse'))
  with check (public.current_user_role() in ('owner','warehouse'));

-- purchase_items ---------------------------------------------------------
drop policy if exists "purchase_items_select_auth" on public.purchase_items;
create policy "purchase_items_select_auth" on public.purchase_items
  for select to authenticated using (true);

drop policy if exists "purchase_items_write" on public.purchase_items;
create policy "purchase_items_write" on public.purchase_items
  for all to authenticated
  using (public.current_user_role() in ('owner','warehouse'))
  with check (public.current_user_role() in ('owner','warehouse'));

-- payments ---------------------------------------------------------------
drop policy if exists "payments_select_auth" on public.payments;
create policy "payments_select_auth" on public.payments
  for select to authenticated using (true);

-- cashier can record sale payments; warehouse/owner record supplier payments
drop policy if exists "payments_insert" on public.payments;
create policy "payments_insert" on public.payments
  for insert to authenticated
  with check (public.current_user_role() in ('owner','cashier','warehouse'));

-- settings ---------------------------------------------------------------
drop policy if exists "settings_select_auth" on public.settings;
create policy "settings_select_auth" on public.settings
  for select to authenticated using (true);

drop policy if exists "settings_write" on public.settings;
create policy "settings_write" on public.settings
  for all to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

-- bill_of_materials ------------------------------------------------------
drop policy if exists "bom_select_auth" on public.bill_of_materials;
create policy "bom_select_auth" on public.bill_of_materials
  for select to authenticated using (true);

drop policy if exists "bom_write" on public.bill_of_materials;
create policy "bom_write" on public.bill_of_materials
  for all to authenticated
  using (public.current_user_role() in ('owner','warehouse'))
  with check (public.current_user_role() in ('owner','warehouse'));

-- bill_of_material_items -------------------------------------------------
drop policy if exists "bom_items_select_auth" on public.bill_of_material_items;
create policy "bom_items_select_auth" on public.bill_of_material_items
  for select to authenticated using (true);

drop policy if exists "bom_items_write" on public.bill_of_material_items;
create policy "bom_items_write" on public.bill_of_material_items
  for all to authenticated
  using (public.current_user_role() in ('owner','warehouse'))
  with check (public.current_user_role() in ('owner','warehouse'));

-- production_orders ------------------------------------------------------
drop policy if exists "production_select_auth" on public.production_orders;
create policy "production_select_auth" on public.production_orders
  for select to authenticated using (true);

drop policy if exists "production_write" on public.production_orders;
create policy "production_write" on public.production_orders
  for all to authenticated
  using (public.current_user_role() in ('owner','warehouse'))
  with check (public.current_user_role() in ('owner','warehouse'));

-- production_order_items -------------------------------------------------
drop policy if exists "prod_items_select_auth" on public.production_order_items;
create policy "prod_items_select_auth" on public.production_order_items
  for select to authenticated using (true);

drop policy if exists "prod_items_write" on public.production_order_items;
create policy "prod_items_write" on public.production_order_items
  for all to authenticated
  using (public.current_user_role() in ('owner','warehouse'))
  with check (public.current_user_role() in ('owner','warehouse'));

-- =============================================================================
-- RPC FUNCTIONS — atomic multi-table operations (called via supabase.rpc)
-- Each runs as one transaction; any exception rolls everything back.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- process_checkout — create sale + sale_items + payment + stock decrement
-- -----------------------------------------------------------------------------
create or replace function public.process_checkout(
  p_user_id uuid,
  p_items jsonb,
  p_payment_method text,
  p_paid_amount bigint default 0,
  p_discount bigint default 0,
  p_customer_id bigint default null,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_item jsonb;
  v_product_id bigint;
  v_qty bigint;
  v_price bigint;
  v_cost bigint;
  v_stock bigint;
  v_subtotal bigint := 0;
  v_grand bigint;
  v_change bigint;
  v_invoice text;
  v_sale_id bigint;
  i int;
begin
  if public.current_user_role() not in ('owner','cashier') then
    raise exception 'Unauthorized';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Keranjang kosong';
  end if;
  if p_discount is null or p_discount < 0 then p_discount := 0; end if;
  if p_paid_amount is null or p_paid_amount < 0 then p_paid_amount := 0; end if;

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

  if p_discount > v_subtotal then p_discount := v_subtotal; end if;
  v_grand := v_subtotal - p_discount;
  v_change := greatest(0, p_paid_amount - v_grand);

  for i in 1..10 loop
    v_invoice := 'INV-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,6));
    begin
      insert into public.sales (user_id, customer_id, invoice_number, subtotal, discount, tax, grand_total, paid_amount, change_amount, payment_method, status, notes)
      values (p_user_id, p_customer_id, v_invoice, v_subtotal, p_discount, 0, v_grand, p_paid_amount, v_change, p_payment_method, 'completed', p_notes)
      returning id into v_sale_id;
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;
  if v_sale_id is null then raise exception 'Gagal membuat nomor invoice'; end if;

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
    'subtotal', v_subtotal,
    'discount', p_discount,
    'grand_total', v_grand,
    'paid_amount', p_paid_amount,
    'change_amount', v_change
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- process_purchase — create purchase + items + stock increment + supplier debt
-- -----------------------------------------------------------------------------
create or replace function public.process_purchase(
  p_user_id uuid,
  p_items jsonb,
  p_supplier_id bigint default null,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_item jsonb;
  v_product_id bigint;
  v_qty bigint;
  v_price bigint;
  v_subtotal bigint := 0;
  v_invoice text;
  v_purchase_id bigint;
  i int;
begin
  if public.current_user_role() not in ('owner','warehouse') then
    raise exception 'Unauthorized';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Item pembelian kosong';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::bigint;
    v_qty := (v_item->>'quantity')::bigint;
    v_price := coalesce((v_item->>'cost_price')::bigint, 0);
    if v_qty < 1 or v_price < 0 then raise exception 'Data item tidak valid'; end if;
    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  for i in 1..10 loop
    v_invoice := 'PO-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,6));
    begin
      insert into public.purchases (user_id, supplier_id, invoice_number, subtotal, grand_total, status, notes)
      values (p_user_id, p_supplier_id, v_invoice, v_subtotal, v_subtotal, 'completed', p_notes)
      returning id into v_purchase_id;
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;
  if v_purchase_id is null then raise exception 'Gagal membuat nomor invoice'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_product_id := (v_item->>'product_id')::bigint;
    v_qty := (v_item->>'quantity')::bigint;
    v_price := coalesce((v_item->>'cost_price')::bigint, 0);
    insert into public.purchase_items (purchase_id, product_id, quantity, cost_price, subtotal)
    values (v_purchase_id, v_product_id, v_qty, v_price, v_price * v_qty);
    update public.products set stock = stock + v_qty where id = v_product_id;
  end loop;

  if p_supplier_id is not null then
    update public.suppliers
    set total_purchases = total_purchases + v_subtotal,
        total_debt = total_debt + v_subtotal
    where id = p_supplier_id;
  end if;

  return jsonb_build_object(
    'success', true,
    'purchase_id', v_purchase_id,
    'invoice_number', v_invoice,
    'subtotal', v_subtotal,
    'grand_total', v_subtotal
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- record_supplier_payment — record payment toward supplier debt
-- -----------------------------------------------------------------------------
create or replace function public.record_supplier_payment(
  p_supplier_id bigint,
  p_amount bigint,
  p_method text,
  p_notes text default null
) returns jsonb
language plpgsql security definer set search_path = public
as $$
begin
  if public.current_user_role() not in ('owner','warehouse') then
    raise exception 'Unauthorized';
  end if;
  if p_amount < 1 then raise exception 'Jumlah tidak valid'; end if;
  if p_method not in ('cash','transfer','qris','ewallet') then raise exception 'Metode tidak valid'; end if;

  update public.suppliers
  set total_paid = total_paid + p_amount,
      total_debt = greatest(0, total_debt - p_amount)
  where id = p_supplier_id;
  if not found then raise exception 'Supplier tidak ditemukan'; end if;

  insert into public.payments (payable_type, payable_id, amount, payment_method, notes)
  values ('supplier', p_supplier_id, p_amount, p_method, coalesce(p_notes, 'Pembayaran supplier'));

  return jsonb_build_object('success', true);
end;
$$;

-- -----------------------------------------------------------------------------
-- process_production — consume raw materials, produce finished good
-- (auto-creates product when finished_good_type = 'manual')
-- -----------------------------------------------------------------------------
create or replace function public.process_production(p_order_id bigint)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.production_orders%rowtype;
  v_item public.production_order_items%rowtype;
  v_stock bigint;
  v_raw bigint := 0;
  v_total bigint;
  v_cost_per_unit bigint;
  v_user_id uuid;
  v_profit_type text;
  v_profit_value bigint;
  v_profit_amount bigint := 0;
  v_suggested bigint;
  v_suggested_per_unit bigint;
  v_name text;
  v_sku text;
  v_slug text;
  v_new_product_id bigint;
  v_unit text;
  i int;
begin
  if public.current_user_role() not in ('owner','warehouse') then
    raise exception 'Unauthorized';
  end if;

  select * into v_order from public.production_orders where id = p_order_id;
  if not found then raise exception 'Order produksi tidak ditemukan'; end if;
  if v_order.status <> 'planned' then raise exception 'Hanya order berstatus planned yang bisa diproses'; end if;

  -- consume raw materials
  for v_item in select * from public.production_order_items where production_order_id = p_order_id order by id loop
    if v_item.product_id is not null then
      select stock into v_stock from public.products where id = v_item.product_id;
      if v_stock < v_item.quantity_planned then
        raise exception 'Stok % tidak mencukupi. Tersedia: %, dibutuhkan: %',
          coalesce((select name from public.products where id = v_item.product_id), 'bahan'),
          v_stock, v_item.quantity_planned;
      end if;
      update public.products set stock = stock - v_item.quantity_planned where id = v_item.product_id;
    end if;
    update public.production_order_items
    set quantity_used = quantity_planned,
        subtotal = round(quantity_planned * unit_cost)
    where id = v_item.id;
  end loop;

  select coalesce(sum(subtotal),0) into v_raw
  from public.production_order_items where production_order_id = p_order_id;

  v_total := v_raw + v_order.total_labor_cost + v_order.total_overhead_cost;
  v_cost_per_unit := round(v_total / v_order.quantity);

  update public.production_orders
  set status = 'completed',
      started_at = now(),
      completed_at = now(),
      total_raw_material_cost = v_raw,
      total_cost = v_total,
      cost_per_unit = v_cost_per_unit
  where id = p_order_id;

  if v_order.product_id is not null then
    update public.products set stock = stock + v_order.quantity where id = v_order.product_id;
    return jsonb_build_object('success', true, 'product_id', v_order.product_id, 'created', false);
  end if;

  -- manual finished good → auto-create product
  select profit_type, profit_value
    into v_profit_type, v_profit_value
  from public.bill_of_materials where id = v_order.bill_of_material_id;
  v_profit_amount := case when v_profit_type = 'percentage'
    then round(v_total * coalesce(v_profit_value,0) / 100)
    else coalesce(v_profit_value,0)
  end;
  v_suggested := v_total + v_profit_amount;
  v_suggested_per_unit := round(v_suggested / v_order.quantity);
  v_name := coalesce(nullif(v_order.finished_good_name,''), 'Produksi #' || v_order.order_number);

  select coalesce(nullif(finished_good_unit,''), 'pcs') into v_unit
  from public.bill_of_materials where id = v_order.bill_of_material_id;
  if v_unit not in ('pcs','pack','box') then v_unit := 'pcs'; end if;

  for i in 1..10 loop
    v_sku := 'PRD-' || to_char(now(),'YYYYMMDD') || '-' || upper(substr(md5(random()::text || clock_timestamp()::text),1,5));
    begin
      v_slug := btrim(regexp_replace(lower(v_name), '[^a-z0-9]+', '-', 'g'), '-') || '-' || substr(replace(gen_random_uuid()::text,'-',''),1,6);
      insert into public.products (category_id, name, slug, sku, cost_price, retail_price, wholesale_price, reseller_price, stock, min_stock, unit, is_active)
      values (null, v_name, v_slug, v_sku, v_cost_per_unit, v_suggested_per_unit, 0, 0, v_order.quantity, 0, v_unit, true)
      returning id into v_new_product_id;
      exit;
    exception when unique_violation then
      null;
    end;
  end loop;

  update public.production_orders set product_id = v_new_product_id where id = p_order_id;

  return jsonb_build_object('success', true, 'product_id', v_new_product_id, 'created', true,
    'name', v_name, 'cost_per_unit', v_cost_per_unit, 'suggested_price_per_unit', v_suggested_per_unit);
end;
$$;

-- -----------------------------------------------------------------------------
-- cancel_production
-- -----------------------------------------------------------------------------
create or replace function public.cancel_production(p_order_id bigint)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.production_orders%rowtype;
begin
  if public.current_user_role() not in ('owner','warehouse') then
    raise exception 'Unauthorized';
  end if;
  select * into v_order from public.production_orders where id = p_order_id;
  if not found then raise exception 'Order produksi tidak ditemukan'; end if;
  if v_order.status <> 'planned' then raise exception 'Hanya order planned yang bisa dibatalkan'; end if;
  update public.production_orders set status = 'cancelled' where id = p_order_id;
  return jsonb_build_object('success', true);
end;
$$;

-- -----------------------------------------------------------------------------
-- apply_production_cost — push cost_per_unit back onto the finished product
-- -----------------------------------------------------------------------------
create or replace function public.apply_production_cost(p_order_id bigint)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_order public.production_orders%rowtype;
begin
  if public.current_user_role() not in ('owner','warehouse') then
    raise exception 'Unauthorized';
  end if;
  select * into v_order from public.production_orders where id = p_order_id;
  if not found then raise exception 'Order produksi tidak ditemukan'; end if;
  if v_order.status <> 'completed' then raise exception 'Hanya order selesai'; end if;
  if v_order.product_id is null then raise exception 'Tidak ada produk terkait'; end if;
  update public.products set cost_price = v_order.cost_per_unit where id = v_order.product_id;
  update public.production_orders set apply_cost_price = true where id = p_order_id;
  return jsonb_build_object('success', true);
end;
$$;

-- -----------------------------------------------------------------------------
-- Default settings seed
-- -----------------------------------------------------------------------------
insert into public.settings (key, value) values
  ('store_name', 'Warung Nuhahade'),
  ('store_address', ''),
  ('store_phone', ''),
  ('store_email', ''),
  ('tax_rate', '0'),
  ('currency', 'IDR'),
  ('receipt_footer', 'Terima Kasih - Belanja Lagi Ya!')
on conflict (key) do nothing;