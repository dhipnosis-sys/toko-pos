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