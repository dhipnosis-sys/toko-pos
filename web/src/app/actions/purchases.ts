"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireRole } from "@/lib/dal";

export async function createPurchase(formData: FormData) {
  await requireRole(["owner", "warehouse"]);
  const profile = await getCurrentUser();
  const supabase = await createClient();

  const supplierRaw = String(formData.get("supplier_id") || "");
  const supplierId = supplierRaw ? Number(supplierRaw) : null;
  const notes = String(formData.get("notes") || "").trim() || null;
  const itemCount = Number(formData.get("item_count") || 0);

  const items: { product_id: number; quantity: number; unit: string; cost_price: number }[] = [];
  for (let i = 0; i < itemCount; i++) {
    const productId = Number(formData.get(`items[${i}].product_id`) || 0);
    const quantity = Number(formData.get(`items[${i}].quantity`) || 0);
    const unit = String(formData.get(`items[${i}].unit`) || "pcs");
    const costPrice = Number(formData.get(`items[${i}].cost_price`) || 0);
    if (!productId || quantity <= 0) continue;
    items.push({
      product_id: productId,
      quantity,
      unit: unit || "pcs",
      cost_price: Math.max(0, costPrice),
    });
  }
  if (items.length === 0) redirect("/purchases/create?err=items");

  const { error } = await supabase.rpc("process_purchase", {
    p_user_id: profile.id,
    p_items: items,
    p_supplier_id: supplierId,
    p_notes: notes,
  });

  if (error) redirect("/purchases/create?err=" + encodeURIComponent(error.message));
  revalidatePath("/purchases");
  revalidatePath("/products");
  revalidatePath("/suppliers");
  redirect("/purchases?ok=saved");
}