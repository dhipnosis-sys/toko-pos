"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";
import { randomCode, slugify } from "@/lib/utils";
import type { ProductUnit, ProductUnitRow } from "@/lib/types";

type ProductData = {
  category_id: number | null;
  supplier_id: number | null;
  name: string;
  sku: string;
  barcode: string | null;
  description: string | null;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  reseller_price: number;
  stock: number;
  min_stock: number;
  unit: ProductUnit;
  units: ProductUnitRow[];
  notes: string | null;
  is_active: boolean;
};

function parseUnitList(raw: string, unit: ProductUnit): { data?: ProductUnitRow[]; error?: string } {
  let parsed: any[] = [];
  try {
    parsed = raw ? JSON.parse(raw) : [];
  } catch {
    return { error: "unit" };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return { error: "unit" };

  const validUnits = ["pcs", "pack", "box", "karung", "kg", "ltr"];
  const rows: ProductUnitRow[] = [];
  let hasPrimary = false;

  for (const r of parsed) {
    const u = String(r?.unit || "");
    const factor = Number(r?.factor || 0);
    if (!validUnits.includes(u)) return { error: "unit" };
    if (!(factor > 0)) return { error: "unit" };
    rows.push({
      unit: u as ProductUnit,
      factor,
      retail_price: Math.max(0, Math.round(Number(r?.retail_price) || 0)),
      wholesale_price: Math.max(0, Math.round(Number(r?.wholesale_price) || 0)),
      reseller_price: Math.max(0, Math.round(Number(r?.reseller_price) || 0)),
    });
    if (u === unit) {
      if (factor !== 1) return { error: "unit" };
      hasPrimary = true;
    }
  }
  if (!hasPrimary) return { error: "unit" };
  return { data: rows };
}

function parseProduct(formData: FormData): { data?: ProductData; error?: string } {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "name" };

  const categoryRaw = String(formData.get("category_id") || "");
  const supplierRaw = String(formData.get("supplier_id") || "");
  const sku = String(formData.get("sku") || "").trim();
  const unit = String(formData.get("unit") || "pcs") as ProductUnit;

  if (!sku) return { error: "sku" };
  if (!["pcs", "pack", "box", "karung", "kg", "ltr"].includes(unit)) return { error: "unit" };

  const num = (key: string) => Math.max(0, Number(formData.get(key) || 0) || 0);

  const units = parseUnitList(String(formData.get("units_json") || ""), unit);
  if (units.error) return { error: units.error };

  return {
    data: {
      category_id: categoryRaw ? Number(categoryRaw) : null,
      supplier_id: supplierRaw ? Number(supplierRaw) : null,
      name,
      sku,
      barcode: String(formData.get("barcode") || "").trim() || null,
      description: String(formData.get("description") || "").trim() || null,
      cost_price: num("cost_price"),
      retail_price: Number(units.data!.find((u) => u.unit === unit)?.retail_price || 0),
      wholesale_price: Number(units.data!.find((u) => u.unit === unit)?.wholesale_price || 0),
      reseller_price: Number(units.data!.find((u) => u.unit === unit)?.reseller_price || 0),
      stock: num("stock"),
      min_stock: num("min_stock"),
      unit,
      units: units.data!,
      notes: String(formData.get("notes") || "").trim() || null,
      is_active: formData.get("is_active") === "on",
    },
  };
}

export async function createProduct(formData: FormData) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const parsed = parseProduct(formData);
  if (parsed.error) redirect("/products/create?err=" + parsed.error);
  const data = parsed.data!;

  const { data: inserted, error: insertError } = await supabase
    .from("products")
    .insert({
      category_id: data.category_id,
      supplier_id: data.supplier_id,
      name: data.name,
      slug: slugify(data.name) + "-" + randomCode(4),
      sku: data.sku,
      barcode: data.barcode,
      description: data.description,
      cost_price: data.cost_price,
      retail_price: data.retail_price,
      wholesale_price: data.wholesale_price,
      reseller_price: data.reseller_price,
      stock: data.stock,
      min_stock: data.min_stock,
      unit: data.unit,
      notes: data.notes,
      is_active: data.is_active,
    })
    .select("id")
    .single();

  if (insertError) redirect("/products/create?err=" + encodeURIComponent(insertError.message));
  const { error: unitsError } = await supabase.rpc("save_product_units", {
    p_product_id: inserted.id,
    p_display_unit: data.unit,
    p_units: data.units,
  });
  if (unitsError) redirect("/products/create?err=" + encodeURIComponent(unitsError.message));

  revalidatePath("/products");
  revalidatePath("/pos");
  redirect("/products?ok=saved");
}

export async function updateProduct(id: number, formData: FormData) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const parsed = parseProduct(formData);
  if (parsed.error) redirect("/products/" + id + "/edit?err=" + parsed.error);
  const data = parsed.data!;

  const { error: updateError } = await supabase
    .from("products")
    .update({
      category_id: data.category_id,
      supplier_id: data.supplier_id,
      name: data.name,
      sku: data.sku,
      barcode: data.barcode,
      description: data.description,
      cost_price: data.cost_price,
      retail_price: data.retail_price,
      wholesale_price: data.wholesale_price,
      reseller_price: data.reseller_price,
      stock: data.stock,
      min_stock: data.min_stock,
      unit: data.unit,
      notes: data.notes,
      is_active: data.is_active,
    })
    .eq("id", id);

  if (updateError) redirect("/products/" + id + "/edit?err=" + encodeURIComponent(updateError.message));

  const { error: unitsError } = await supabase.rpc("save_product_units", {
    p_product_id: id,
    p_display_unit: data.unit,
    p_units: data.units,
  });
  if (unitsError) redirect("/products/" + id + "/edit?err=" + encodeURIComponent(unitsError.message));

  revalidatePath("/products");
  revalidatePath("/products/" + id + "/edit");
  revalidatePath("/pos");
  redirect("/products?ok=updated");
}

export async function deleteProduct(id: number) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const { count: saleCount } = await supabase
    .from("sale_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);
  const { count: purchaseCount } = await supabase
    .from("purchase_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);
  if ((saleCount && saleCount > 0) || (purchaseCount && purchaseCount > 0)) {
    redirect("/products?err=inuse");
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) redirect("/products?err=" + encodeURIComponent(error.message));
  revalidatePath("/products");
  revalidatePath("/pos");
  redirect("/products?ok=deleted");
}