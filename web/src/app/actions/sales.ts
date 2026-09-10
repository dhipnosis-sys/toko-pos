"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireRole } from "@/lib/dal";

export async function checkout(formData: FormData) {
  await requireRole(["owner", "cashier"]);
  const profile = await getCurrentUser();
  const supabase = await createClient();

  const itemCount = Number(formData.get("item_count") || 0);
  const items: { product_id: number; quantity: number; price: number }[] = [];
  for (let i = 0; i < itemCount; i++) {
    const productId = Number(formData.get(`items[${i}].product_id`) || 0);
    const quantity = Number(formData.get(`items[${i}].quantity`) || 0);
    const price = Number(formData.get(`items[${i}].price`) || 0);
    if (!productId || quantity < 1) continue;
    items.push({ product_id: productId, quantity, price });
  }
  if (items.length === 0) redirect("/pos?err=items");

  const customerRaw = String(formData.get("customer_id") || "");
  const customerId = customerRaw ? Number(customerRaw) : null;
  const paymentMethod = String(formData.get("payment_method") || "cash");
  const paidAmount = Math.max(0, Number(formData.get("paid_amount") || 0) || 0);
  const discount = Math.max(0, Number(formData.get("discount") || 0) || 0);
  const notes = String(formData.get("notes") || "").trim() || null;

  if (paymentMethod === "receivable" && !customerId) {
    redirect("/pos?err=receivable");
  }

  const { error } = await supabase.rpc("process_checkout", {
    p_user_id: profile.id,
    p_items: items,
    p_payment_method: paymentMethod,
    p_paid_amount: paidAmount,
    p_discount: discount,
    p_customer_id: customerId,
    p_notes: notes,
  });

  if (error) redirect("/pos?err=" + encodeURIComponent(error.message));
  revalidatePath("/pos");
  revalidatePath("/sales");
  revalidatePath("/dashboard");
  revalidatePath("/products");
  revalidatePath("/customers");
  redirect("/sales?ok=saved");
}