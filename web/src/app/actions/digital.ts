"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";

function num(value: FormDataEntryValue | null): number {
  return Math.max(0, Math.round(Number(value) || 0));
}

export async function saveDigitalSale(formData: FormData) {
  await requireRole(["owner", "cashier"]);
  const supabase = await createClient();

  const typeId = Math.round(Number(formData.get("type_id") || 0) || 0);
  const identifier = String(formData.get("identifier") || "").trim();
  const amount = num(formData.get("amount"));
  const adminFee = num(formData.get("admin_fee"));
  const cost = num(formData.get("cost"));
  const method = String(formData.get("payment_method") || "cash");
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!typeId) redirect("/digital/create?err=type");
  if (!identifier) redirect("/digital/create?err=identifier");

  const { error } = await supabase.rpc("process_digital_sale", {
    p_type_id: typeId,
    p_identifier: identifier,
    p_amount: amount,
    p_admin_fee: adminFee,
    p_cost: cost,
    p_payment_method: method,
    p_notes: notes,
  });
  if (error) redirect("/digital/create?err=" + encodeURIComponent(error.message));
  revalidatePath("/digital");
  redirect("/digital?ok=digital");
}

export async function topUpDigitalBalance(formData: FormData) {
  await requireRole(["owner"]);
  const supabase = await createClient();

  const typeId = Math.round(Number(formData.get("type_id") || 0) || 0);
  const amount = num(formData.get("amount"));
  const notes = String(formData.get("notes") || "").trim() || null;

  if (!typeId || amount < 1) redirect("/digital?err=amount");

  const { error } = await supabase.rpc("top_up_digital_balance", {
    p_type_id: typeId,
    p_amount: amount,
    p_notes: notes,
  });
  if (error) redirect("/digital?err=" + encodeURIComponent(error.message));
  revalidatePath("/digital");
  redirect("/digital?ok=topup");
}

export async function saveDigitalType(formData: FormData) {
  await requireRole(["owner"]);
  const supabase = await createClient();

  const typeId = Math.round(Number(formData.get("type_id") || 0) || 0);
  const name = String(formData.get("name") || "").trim();
  const reducesBalance = formData.get("reduces_balance") === "on";
  const isActive = formData.get("is_active") !== "off";

  if (!name) redirect("/digital?err=name");

  const { error } = await supabase.rpc("save_digital_type", {
    p_type_id: typeId || null,
    p_name: name,
    p_reduces_balance: reducesBalance,
    p_is_active: isActive,
  });
  if (error) redirect("/digital?err=" + encodeURIComponent(error.message));
  revalidatePath("/digital");
  redirect("/digital?ok=type");
}

export async function toggleDigitalType(formData: FormData) {
  await requireRole(["owner"]);
  const supabase = await createClient();

  const typeId = Math.round(Number(formData.get("type_id") || 0) || 0);
  const isActive = formData.get("is_active") === "on";

  if (!typeId) redirect("/digital?err=name");

  const { error } = await supabase.rpc("toggle_digital_type", {
    p_type_id: typeId,
    p_is_active: isActive,
  });
  if (error) redirect("/digital?err=" + encodeURIComponent(error.message));
  revalidatePath("/digital");
  redirect("/digital?ok=type");
}