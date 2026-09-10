"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";
import { randomCode, slugify } from "@/lib/utils";
import type { ProductUnit } from "@/lib/types";

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
  notes: string | null;
  is_active: boolean;
};

function parseProduct(formData: FormData): { data?: ProductData; error?: string } {
  const name = String(formData.get("name") || "").trim();
  if (!name) return { error: "name" };

  const categoryRaw = String(formData.get("category_id") || "");
  const supplierRaw = String(formData.get("supplier_id") || "");
  const sku = String(formData.get("sku") || "").trim();
  const unit = String(formData.get("unit") || "pcs") as ProductUnit;

  if (!sku) return { error: "sku" };
  if (!["pcs", "pack", "box"].includes(unit)) return { error: "unit" };

  const num = (key: string) =>
    Math.max(0, Number(formData.get(key) || 0) || 0);

  return {
    data: {
      category_id: categoryRaw ? Number(categoryRaw) : null,
      supplier_id: supplierRaw ? Number(supplierRaw) : null,
      name,
      sku,
      barcode: String(formData.get("barcode") || "").trim() || null,
      description: String(formData.get("description") || "").trim() || null,
      cost_price: num("cost_price"),
      retail_price: num("retail_price"),
      wholesale_price: num("wholesale_price"),
      reseller_price: num("reseller_price"),
      stock: num("stock"),
      min_stock: num("min_stock"),
      unit,
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

  const { error: insertError } = await supabase.from("products").insert({
    ...data,
    slug: slugify(data.name) + "-" + randomCode(4),
  });

  if (insertError) redirect("/products/create?err=" + encodeURIComponent(insertError.message));
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
    .update(data)
    .eq("id", id);

  if (updateError) redirect("/products/" + id + "/edit?err=" + encodeURIComponent(updateError.message));
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
