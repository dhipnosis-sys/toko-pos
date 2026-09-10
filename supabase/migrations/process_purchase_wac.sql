-- -----------------------------------------------------------------------------
-- Migrasi live: Harga modal otomatis rata-rata tertimbang saat pembelian.
-- Jalankan di Supabase SQL Editor (sudah termasuk dalam schema.sql untuk instalasi baru).
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
    update public.products
    set stock = stock + v_qty,
        cost_price = case
          when stock = 0 or cost_price = 0 then v_price
          else round((cost_price * stock + v_price * v_qty)::numeric / (stock + v_qty))::bigint
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