"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";
import { invoiceNumber } from "@/lib/utils";

async function processOrderNumber(supabase: Awaited<ReturnType<typeof createClient>>) {
  for (let i = 0; i < 10; i++) {
    const num = invoiceNumber("PO");
    const { data: existing } = await supabase
      .from("production_orders")
      .select("id")
      .eq("order_number", num)
      .maybeSingle();
    if (!existing) return num;
  }
  throw new Error("Gagal membuat nomor order");
}

export async function createProduction(formData: FormData) {
  const profile = await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const bomId = Number(formData.get("bill_of_material_id") || 0);
  const quantity = Math.max(1, Number(formData.get("quantity") || 1) || 1);
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!bomId) redirect("/production/create?err=bom");
  if (Number.isNaN(quantity) || quantity < 1) redirect("/production/create?err=qty");

  const { data: bom, error: bomError } = await supabase
    .from("bill_of_materials")
    .select("*, items:bill_of_material_items(*)")
    .eq("id", bomId)
    .single();
  if (bomError || !bom) redirect("/production/create?err=" + encodeURIComponent(bomError?.message || "bom"));

  const orderNumber = await processOrderNumber(supabase);

  let raw = 0;
  const items = (bom.items || []).map((it: any) => {
    const qtyPlanned = Math.round(((it.quantity / bom.quantity) * quantity + Number.EPSILON) * 100) / 100;
    const unitCost = it.unit_cost;
    const subtotal = Math.round(qtyPlanned * unitCost);
    raw += subtotal;
    return {
      item_type: it.item_type,
      product_id: it.product_id,
      item_name: it.item_name,
      quantity_planned: qtyPlanned,
      quantity_used: 0,
      unit_cost: unitCost,
      subtotal,
    };
  });

  const totalCost = raw + (bom.labor_cost || 0) + (bom.overhead_cost || 0);
  const costPerUnit = Math.round(totalCost / quantity);

  const { data: order, error: orderError } = await supabase
    .from("production_orders")
    .insert({
      order_number: orderNumber,
      product_id: bom.product_id,
      finished_good_type: bom.finished_good_type,
      finished_good_name: bom.finished_good_name,
      bill_of_material_id: bom.id,
      quantity,
      status: "planned",
      total_raw_material_cost: raw,
      total_labor_cost: bom.labor_cost || 0,
      total_overhead_cost: bom.overhead_cost || 0,
      total_cost: totalCost,
      cost_per_unit: costPerUnit,
      notes,
      user_id: profile.id,
    })
    .select("id")
    .single();

  if (orderError || !order) redirect("/production/create?err=" + encodeURIComponent(orderError?.message || "gagal"));

  const { error: itemsError } = await supabase.from("production_order_items").insert(
    items.map((it: any) => ({ production_order_id: order.id, ...it }))
  );
  if (itemsError) redirect("/production/create?err=" + encodeURIComponent(itemsError.message));

  revalidatePath("/production");
  redirect("/production?ok=saved");
}

export async function processProduction(id: number) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const { error } = await supabase.rpc("process_production", { p_order_id: id });
  if (error) redirect("/production/" + id + "?err=" + encodeURIComponent(error.message));
  revalidatePath("/production");
  revalidatePath("/production/" + id);
  revalidatePath("/pos");
  revalidatePath("/products");
  redirect("/production/" + id + "?ok=processed");
}

export async function cancelProduction(id: number) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const { error } = await supabase.rpc("cancel_production", { p_order_id: id });
  if (error) redirect("/production/" + id + "?err=" + encodeURIComponent(error.message));
  revalidatePath("/production");
  revalidatePath("/production/" + id);
  redirect("/production/" + id + "?ok=cancelled");
}

export async function applyProductionCost(id: number) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const { error } = await supabase.rpc("apply_production_cost", { p_order_id: id });
  if (error) redirect("/production/" + id + "?err=" + encodeURIComponent(error.message));
  revalidatePath("/production");
  revalidatePath("/production/" + id);
  revalidatePath("/products");
  redirect("/production/" + id + "?ok=cost");
}

export async function deleteProduction(id: number) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const { data: order } = await supabase
    .from("production_orders")
    .select("status")
    .eq("id", id)
    .single();
  if (order && order.status === "completed") redirect("/production?err=completed");

  const { error } = await supabase.from("production_orders").delete().eq("id", id);
  if (error) redirect("/production?err=" + encodeURIComponent(error.message));
  revalidatePath("/production");
  redirect("/production?ok=deleted");
}