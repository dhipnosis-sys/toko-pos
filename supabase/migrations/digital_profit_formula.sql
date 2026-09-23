-- =============================================================================
-- TOKO POS — Perbaikan rumus profit transaksi digital
--   Sebelum: profit = admin_fee - cost        (selalu negatif utk pulsa, karena
--            modal ≈ nominal jauh lebih besar dari admin)
--   Sesudah: profit = (amount + admin_fee) - cost   (cash yang diterima dikurangi
--            biaya modal). Contoh pulsa 15.000 + admin 2.000, modal 15.725
--            -> profit = 17.000 - 15.725 = Rp1.275.
--   Konvensi: utk jenis Cashout (amount dibayarkan ke pembeli), isi "biaya
--   modal" = amount, sehingga profit = admin.
--
-- Cara menjalankan: jalankan file ini SEKALI di Supabase SQL Editor.
-- Idempotent: aman dijalankan ulang.
-- =============================================================================

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
      v_profit := v_charged - v_cost_dig;
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
      v_profit := v_charged - v_cost_dig;
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
-- Backfill: perbaiki profit transaksi digital lama yang masih pakai rumus lama.
-- -----------------------------------------------------------------------------
update public.digital_sales
set profit = (amount + admin_fee) - cost
where status = 'completed';

-- -----------------------------------------------------------------------------
-- (Opsional) Sinkronisasi laporan: angka keuntungan admin diambil dari kolom
-- profit ini, tidak ada kolom lain yang perlu diubah.
-- -----------------------------------------------------------------------------