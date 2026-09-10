"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";

function parseSupplier(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    tax_id: String(formData.get("tax_id") || "").trim() || null,
    opening_balance: Number(formData.get("opening_balance") || 0) || 0,
    notes: String(formData.get("notes") || "").trim() || null,
  };
}

export async function createSupplier(formData: FormData) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const data = parseSupplier(formData);
  if (!data.name) redirect("/suppliers/create?err=name");

  const { error } = await supabase.from("suppliers").insert(data);
  if (error) redirect("/suppliers/create?err=" + encodeURIComponent(error.message));
  revalidatePath("/suppliers");
  redirect("/suppliers?ok=saved");
}

export async function updateSupplier(id: number, formData: FormData) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const data = parseSupplier(formData);
  if (!data.name) redirect("/suppliers/" + id + "/edit?err=name");

  const { error } = await supabase.from("suppliers").update(data).eq("id", id);
  if (error) redirect("/suppliers/" + id + "/edit?err=" + encodeURIComponent(error.message));
  revalidatePath("/suppliers");
  revalidatePath("/suppliers/" + id + "/edit");
  redirect("/suppliers?ok=updated");
}

export async function deleteSupplier(id: number) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const { count } = await supabase
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .eq("supplier_id", id);
  if (count && count > 0) redirect("/suppliers?err=inuse");

  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) redirect("/suppliers?err=" + encodeURIComponent(error.message));
  revalidatePath("/suppliers");
  redirect("/suppliers?ok=deleted");
}

export async function recordSupplierPayment(formData: FormData) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const supplierId = Number(formData.get("supplier_id") || 0);
  const amount = Number(formData.get("amount") || 0);
  const method = String(formData.get("payment_method") || "cash");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!supplierId || amount < 1) redirect("/suppliers/" + supplierId + "/pay?err=amount");

  const { error } = await supabase.rpc("record_supplier_payment", {
    p_supplier_id: supplierId,
    p_amount: amount,
    p_method: method,
    p_notes: notes,
  });
  if (error) redirect("/suppliers/" + supplierId + "/pay?err=" + encodeURIComponent(error.message));
  revalidatePath("/suppliers");
  revalidatePath("/suppliers/" + supplierId);
  redirect("/suppliers/" + supplierId + "/pay?ok=saved");
}
