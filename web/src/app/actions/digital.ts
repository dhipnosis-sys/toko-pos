"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";

export async function topUpDigitalModal(formData: FormData) {
  await requireRole(["owner"]);
  const supabase = await createClient();

  const amount = Math.round(Number(formData.get("amount") || 0) || 0);
  const notes = String(formData.get("notes") || "").trim() || null;

  if (amount < 1) redirect("/digital?err=amount");

  const { error } = await supabase.rpc("top_up_digital_modal", {
    p_amount: amount,
    p_notes: notes,
  });
  if (error) redirect("/digital?err=" + encodeURIComponent(error.message));
  revalidatePath("/digital");
  revalidatePath("/pos");
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
  revalidatePath("/pos");
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
  revalidatePath("/pos");
  redirect("/digital?ok=type");
}