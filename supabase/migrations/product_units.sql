-- =============================================================================
-- TOKO POS — Multi-satuan produk (satuan dasar + konversi per produk)
--   Beras: beli 1 karung (25 kg), jual per kg & per liter (faktor per produk).
--   Semua perhitungan stok dikonversi ke satuan utama produk (contoh: kg).
--
-- Cara menjalankan: jalankan SELURUH file ini SEKALI di Supabase SQL Editor.
-- Idempotent: aman dijalankan ulang.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. products — stok jadi desimal (kg), daftar satuan diperluas
-- -----------------------------------------------------------------------------
alter table public.products alter column stock type numeric(12,3);
alter table public.products alter column min_stock type numeric(12,3);

alter table public.products drop constraint if exists products_unit_check;
alter table public.products
  add constraint products_unit_check
  check (unit in ('pcs', 'pack', 'box', 'karung', 'kg', 'ltr'));

-- -----------------------------------------------------------------------------
-- 2. sale_items / purchase_items — simpan satuan yang dipakai + qty desimal
--    (drop view v_sale_items dulu: view bergantung pada kolom quantity)
-- -----------------------------------------------------------------------------
drop view if exists public.v_sale_items;

alter table public.sale_items alter column quantity type numeric(12,3);
alter table public.sale_items add column if not exists unit text not null default 'pcs';

alter table public.purchase_items alter column quantity type numeric(12,3);
alter table public.purchase_items add column if not exists unit text not null default 'pcs';

create or replace view public.v_sale_items as
select
  s.id              as sale_id,
  s.invoice_number,
  s.payment_method,
  s.status          as sale_status,
  s.created_at      as sale_date,
  s.user_id,
  s.customer_id,
  si.product_id,
  si.quantity,
  si.unit,
  si.unit_price,
  si.cost_price,
  si.subtotal
from public.sales s
join public.sale_items si on si.sale_id = s.id;

-- -----------------------------------------------------------------------------
-- 3. product_units — satuan jual/beli per produk + faktor konversi ke satuan utama
--    faktor = berapa satuan utama dalam 1 satuan tsb (kg:1, karung:25, liter:0,8)
-- -----------------------------------------------------------------------------
create table if not exists public.product_units (
  id bigint generated always as identity primary key,
  product_id bigint not null references public.products (id) on delete cascade,
  unit text not null check (unit in ('pcs', 'pack', 'box', 'karung', 'kg', 'ltr')),
  factor numeric(12,3) not null default 1,
  retail_price bigint not null default 0,
  wholesale_price bigint not null default 0,
  reseller_price bigint not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, unit)
);

create index if not exists product_units_product_idx on public.product_units (product_id);

create trigger product_units_updated_at
  before update on public.product_units
  for each row execute function public.set_updated_at();

alter table public.product_units enable row level security;

drop policy if exists "product_units_select_auth" on public.product_units;
create policy "product_units_select_auth" on public.product_units
  for select to authenticated using (true);

-- Backfill: setiap produk yang sudah ada dapat satu baris satuan default
-- (unit = satuan produk, faktor 1, harga disalin dari kolom harga produk).
insert into public.product_units (product_id, unit, factor, retail_price, wholesale_price, reseller_price, is_default)
select id, unit, 1, retail_price, wholesale_price, reseller_price, true
from public.products
on conflict (product_id, unit) do nothing;

-- -----------------------------------------------------------------------------
-- 4. process_checkout v4 — satu invoice barang + digital, sadar satuan
--    Item payload sekarang: { product_id, quantity (dalam satuan pilihan),
--    unit, price (per satuan pilihan) }. Bila `unit` tidak dikirim, dianggap
--    satuan utama produk (faktor 1). Stok dikurangi dalam satuan utama.
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
  v_qty numeric;
  v_unit text;
  v_factor numeric;
  v_qty_stock numeric;
  v_price bigint;
  v_cost bigint;
  v_stock numeric;
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

  -- validate product stock (in base unit)
  if p_items is not null then
    for v_item in select * from jsonb_array_elements(p_items) loop
      v_product_id := (v_item->>'product_id')::bigint;
      v_qty := (v_item->>'quantity')::numeric;
      v_unit := coalesce(nullif(v_item->>'unit',''), (select unit from public.products where id = v_product_id));
      if v_qty <= 0 then raise exception 'Jumlah tidak valid'; end if;
      select factor into v_factor from public.product_units
        where product_id = v_product_id and unit = v_unit;
      if not found or v_factor is null or v_factor <= 0 then v_factor := 1; end if;
      v_qty_stock := round(v_qty * v_factor, 3);
      select stock into v_stock from public.products where id = v_product_id;
      if not found then raise exception 'Produk tidak ditemukan: %', v_product_id; end if;
      if v_stock < v_qty_stock then
        raise exception 'Stok produk tidak cukup. Tersedia: %', v_stock;
      end if;
    end loop;

    for v_item in select * from jsonb_array_elements(p_items) loop
      v_product_id := (v_item->>'product_id')::bigint;
      v_qty := (v_item->>'quantity')::numeric;
      v_price := coalesce((v_item->>'price')::bigint, 0);
      if v_qty < 0 or v_price < 0 then raise exception 'Data item tidak valid'; end if;
      v_subtotal := v_subtotal + round(v_price * v_qty)::bigint;
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
      v_qty := (v_item->>'quantity')::numeric;
      v_unit := coalesce(nullif(v_item->>'unit',''), (select unit from public.products where id = v_product_id));
      v_price := coalesce((v_item->>'price')::bigint, 0);
      select factor into v_factor from public.product_units
        where product_id = v_product_id and unit = v_unit;
      if not found or v_factor is null or v_factor <= 0 then v_factor := 1; end if;
      v_qty_stock := round(v_qty * v_factor, 3);
      select cost_price into v_cost from public.products where id = v_product_id;
      insert into public.sale_items (sale_id, product_id, quantity, unit, unit_price, cost_price, subtotal)
      values (v_sale_id, v_product_id, v_qty, v_unit, v_price, round(coalesce(v_cost,0) * v_factor)::bigint, round(v_price * v_qty)::bigint);
      update public.products set stock = stock - v_qty_stock where id = v_product_id and stock >= v_qty_stock;
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

-- -----------------------------------------------------------------------------
-- 5. process_purchase v2 — beli dalam satuan apa pun (karung/kg/liter),
--    stok bertambah dalam satuan utama. Harga beli per satuan dikonversi ke
--    harga per satuan utama untuk WAC.
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
  v_qty numeric;
  v_unit text;
  v_factor numeric;
  v_qty_stock numeric;
  v_price bigint;
  v_cost_base bigint;
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
    v_qty := (v_item->>'quantity')::numeric;
    v_price := coalesce((v_item->>'cost_price')::bigint, 0);
    if v_qty <= 0 or v_price < 0 then raise exception 'Data item tidak valid'; end if;
    v_subtotal := v_subtotal + round(v_price * v_qty)::bigint;
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
    v_qty := (v_item->>'quantity')::numeric;
    v_unit := coalesce(nullif(v_item->>'unit',''), (select unit from public.products where id = v_product_id));
    v_price := coalesce((v_item->>'cost_price')::bigint, 0);
    select factor into v_factor from public.product_units
      where product_id = v_product_id and unit = v_unit;
    if not found or v_factor is null or v_factor <= 0 then v_factor := 1; end if;
    v_qty_stock := round(v_qty * v_factor, 3);
    v_cost_base := round((v_price::numeric / v_factor))::bigint;

    insert into public.purchase_items (purchase_id, product_id, quantity, unit, cost_price, subtotal)
    values (v_purchase_id, v_product_id, v_qty, v_unit, v_price, round(v_price * v_qty)::bigint);

    update public.products
    set stock = stock + v_qty_stock,
        cost_price = case
          when stock = 0 or cost_price = 0 then v_cost_base
          else round((cost_price * stock + v_cost_base * v_qty_stock)::numeric / (stock + v_qty_stock))::bigint
        end
    where id = v_product_id;
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
-- 6. save_product_units — simpan daftar satuan + konversi + harga per satuan
--    (security definer: Owner/Warehouse). Baris satuan utama (default) wajib
--    faktor = 1, dan harga default disinkronkan ke kolom harga produk.
--    p_units: [ {unit, factor, retail_price, wholesale_price, reseller_price} ]
-- -----------------------------------------------------------------------------
create or replace function public.save_product_units(
  p_product_id bigint,
  p_display_unit text,
  p_units jsonb
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_row jsonb;
  v_unit text;
  v_factor numeric;
  v_retail bigint;
  v_wholesale bigint;
  v_reseller bigint;
  v_valid_units text[] := array['pcs','pack','box','karung','kg','ltr'];
  v_has_default boolean := false;
begin
  if public.current_user_role() not in ('owner','warehouse') then
    raise exception 'Unauthorized';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Produk tidak ditemukan';
  end if;
  if p_units is null or jsonb_array_length(p_units) = 0 then
    raise exception 'Satuan minimal satu';
  end if;

  for v_row in select * from jsonb_array_elements(p_units) loop
    v_unit := coalesce(v_row->>'unit', '');
    v_factor := coalesce((v_row->>'factor')::numeric, 0);
    v_retail := coalesce((v_row->>'retail_price')::bigint, 0);
    v_wholesale := coalesce((v_row->>'wholesale_price')::bigint, 0);
    v_reseller := coalesce((v_row->>'reseller_price')::bigint, 0);

    if not (v_unit = any (v_valid_units)) then raise exception 'Satuan tidak valid: %', v_unit; end if;
    if v_retail < 0 or v_wholesale < 0 or v_reseller < 0 then raise exception 'Harga tidak valid'; end if;
    if v_factor is null or v_factor <= 0 then raise exception 'Faktor konversi harus lebih dari 0'; end if;
    if v_unit = p_display_unit then
      if v_factor <> 1 then raise exception 'Satuan utama wajib faktor konversi 1'; end if;
      v_has_default := true;
    end if;
  end loop;
  if not v_has_default then raise exception 'Satuan utama harus ada dalam daftar'; end if;

  delete from public.product_units where product_id = p_product_id;

  for v_row in select * from jsonb_array_elements(p_units) loop
    v_unit := coalesce(v_row->>'unit', '');
    v_factor := coalesce((v_row->>'factor')::numeric, 0);
    v_retail := coalesce((v_row->>'retail_price')::bigint, 0);
    v_wholesale := coalesce((v_row->>'wholesale_price')::bigint, 0);
    v_reseller := coalesce((v_row->>'reseller_price')::bigint, 0);
    insert into public.product_units
      (product_id, unit, factor, retail_price, wholesale_price, reseller_price, is_default)
    values
      (p_product_id, v_unit, v_factor, v_retail, v_wholesale, v_reseller, v_unit = p_display_unit);
  end loop;

  select retail_price, wholesale_price, reseller_price into v_retail, v_wholesale, v_reseller
  from public.product_units
  where product_id = p_product_id and unit = p_display_unit;

  update public.products
  set unit = p_display_unit,
      retail_price = v_retail,
      wholesale_price = v_wholesale,
      reseller_price = v_reseller,
      updated_at = now()
  where id = p_product_id;

  return jsonb_build_object('success', true, 'product_id', p_product_id);
end;
$$;