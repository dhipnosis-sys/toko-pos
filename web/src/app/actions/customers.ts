"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";

function parseCustomer(formData: FormData) {
  return {
    name: String(formData.get("name") || "").trim(),
    phone: String(formData.get("phone") || "").trim() || null,
    email: String(formData.get("email") || "").trim() || null,
    address: String(formData.get("address") || "").trim() || null,
    city: String(formData.get("city") || "").trim() || null,
    debt_limit: Math.max(0, Number(formData.get("debt_limit") || 0) || 0),
    notes: String(formData.get("notes") || "").trim() || null,
  };
}

export async function createCustomer(formData: FormData) {
  await requireRole(["owner", "cashier"]);
  const supabase = await createClient();

  const data = parseCustomer(formData);
  if (!data.name) redirect("/customers/create?err=name");

  const { error } = await supabase.from("customers").insert(data);
  if (error) redirect("/customers/create?err=" + encodeURIComponent(error.message));
  revalidatePath("/customers");
  redirect("/customers?ok=saved");
}

export async function quickCreateCustomer(formData: FormData) {
  await requireRole(["owner", "cashier"]);
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  if (!name) return { error: "name" };

  const { data, error } = await supabase
    .from("customers")
    .insert({ name, phone, city: null, address: null })
    .select("id, name, phone")
    .single();
  if (error) {
    const msg = /duplicate/i.test(error.message) ? "phone_taken" : error.message;
    return { error: msg };
  }
  revalidatePath("/customers");
  return { id: data.id, name: data.name, phone: data.phone || null };
}

export async function recordCustomerPayment(formData: FormData) {
  await requireRole(["owner", "cashier"]);
  const supabase = await createClient();

  const customerId = Number(formData.get("customer_id") || 0);
  const amount = Number(formData.get("amount") || 0);
  const method = String(formData.get("payment_method") || "cash");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!customerId || amount < 1) redirect("/customers/" + customerId + "/pay?err=amount");

  const { error } = await supabase.rpc("record_customer_payment", {
    p_customer_id: customerId,
    p_amount: amount,
    p_method: method,
    p_notes: notes,
  });
  if (error) redirect("/customers/" + customerId + "/pay?err=" + encodeURIComponent(error.message));
  revalidatePath("/customers");
  revalidatePath("/customers/" + customerId);
  redirect("/customers/" + customerId + "/pay?ok=saved");
}

export async function updateCustomer(id: number, formData: FormData) {
  await requireRole(["owner", "cashier"]);
  const supabase = await createClient();

  const data = parseCustomer(formData);
  if (!data.name) redirect("/customers/" + id + "/edit?err=name");

  const { error } = await supabase.from("customers").update(data).eq("id", id);
  if (error) redirect("/customers/" + id + "/edit?err=" + encodeURIComponent(error.message));
  revalidatePath("/customers");
  revalidatePath("/customers/" + id + "/edit");
  redirect("/customers?ok=updated");
}

export async function deleteCustomer(id: number) {
  await requireRole(["owner", "cashier"]);
  const supabase = await createClient();

  const { count } = await supabase
    .from("sales")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", id);
  if (count && count > 0) redirect("/customers?err=inuse");

  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) redirect("/customers?err=" + encodeURIComponent(error.message));
  revalidatePath("/customers");
  redirect("/customers?ok=deleted");
}