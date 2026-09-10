"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";

type BomInput = {
  product_id: number | null;
  finished_good_type: "product" | "manual";
  finished_good_name: string | null;
  finished_good_unit: string | null;
  name: string;
  quantity: number;
  unit: string | null;
  labor_cost: number;
  overhead_cost: number;
  profit_type: "percentage" | "amount";
  profit_value: number;
  notes: string | null;
  items: {
    item_type: "product" | "manual";
    product_id: number | null;
    item_name: string | null;
    item_unit: string | null;
    quantity: number;
    unit_cost: number;
  }[];
};

function parseBom(formData: FormData): { data?: BomInput; error?: string } {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "name" };

  const finished_good_type =
    (String(formData.get("finished_good_type")) as "product" | "manual") || "product";
  const itemCount = Number(formData.get("item_count") || 0);

  const items: BomInput["items"] = [];
  for (let i = 0; i < itemCount; i++) {
    const item_type =
      (String(formData.get(`items[${i}].item_type`) || "product") as "product" | "manual");
    const quantity = Number(formData.get(`items[${i}].quantity`) || 0);
    if (quantity <= 0 || !["product", "manual"].includes(item_type)) continue;
    items.push({
      item_type,
      product_id: formData.get(`items[${i}].product_id`)
        ? Number(formData.get(`items[${i}].product_id`))
        : null,
      item_name: String(formData.get(`items[${i}].item_name`) || "").trim() || null,
      item_unit: String(formData.get(`items[${i}].item_unit`) || "").trim() || null,
      quantity,
      unit_cost: Math.max(0, Number(formData.get(`items[${i}].unit_cost`) || 0) || 0),
    });
  }
  if (items.length === 0) return { error: "items" };

  return {
    data: {
      product_id: formData.get("product_id") ? Number(formData.get("product_id")) : null,
      finished_good_type,
      finished_good_name:
        finished_good_type === "manual"
          ? String(formData.get("finished_good_name") || "").trim() || null
          : null,
      finished_good_unit:
        finished_good_type === "manual"
          ? String(formData.get("finished_good_unit") || "").trim() || null
          : null,
      name,
      quantity: Number(formData.get("quantity") || 1) || 1,
      unit: String(formData.get("unit") || "").trim() || null,
      labor_cost: Math.max(0, Number(formData.get("labor_cost") || 0) || 0),
      overhead_cost: Math.max(0, Number(formData.get("overhead_cost") || 0) || 0),
      profit_type:
        (String(formData.get("profit_type")) as "percentage" | "amount") || "percentage",
      profit_value: Math.max(0, Number(formData.get("profit_value") || 0) || 0),
      notes: String(formData.get("notes") || "").trim() || null,
      items,
    },
  };
}

export async function createBom(formData: FormData) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const { data, error } = parseBom(formData);
  if (error) redirect("/bom/create?err=" + error);

  const {
    items,
    ...bomFields
  } = data!;

  const { data: pom, error: bomError } = await supabase
    .from("bill_of_materials")
    .insert(bomFields)
    .select("id")
    .single();

  if (bomError || !pom) redirect("/bom/create?err=" + encodeURIComponent(bomError?.message || "gagal"));

  const { error: itemsError } = await supabase.from("bill_of_material_items").insert(
    items.map((it) => ({ bill_of_material_id: pom.id, ...it }))
  );
  if (itemsError) redirect("/bom/create?err=" + encodeURIComponent(itemsError.message));

  revalidatePath("/bom");
  redirect("/bom?ok=saved");
}

export async function updateBom(id: number, formData: FormData) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const { data, error } = parseBom(formData);
  if (error) redirect("/bom/" + id + "/edit?err=" + error);

  const {
    items,
    ...bomFields
  } = data!;

  const { error: bomError } = await supabase
    .from("bill_of_materials")
    .update(bomFields)
    .eq("id", id);
  if (bomError) redirect("/bom/" + id + "/edit?err=" + encodeURIComponent(bomError.message));

  await supabase.from("bill_of_material_items").delete().eq("bill_of_material_id", id);
  const { error: itemsError } = await supabase.from("bill_of_material_items").insert(
    items.map((it) => ({ bill_of_material_id: id, ...it }))
  );
  if (itemsError) redirect("/bom/" + id + "/edit?err=" + encodeURIComponent(itemsError.message));

  revalidatePath("/bom");
  revalidatePath("/bom/" + id);
  revalidatePath("/production");
  redirect("/bom?ok=updated");
}

export async function deleteBom(id: number) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const { count } = await supabase
    .from("production_orders")
    .select("id", { count: "exact", head: true })
    .eq("bill_of_material_id", id);
  if (count && count > 0) redirect("/bom?err=inuse");

  const { error } = await supabase.from("bill_of_materials").delete().eq("id", id);
  if (error) redirect("/bom?err=" + encodeURIComponent(error.message));
  revalidatePath("/bom");
  redirect("/bom?ok=deleted");
}
