"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";

export async function updateSettings(formData: FormData) {
  await requireRole("owner");
  const supabase = await createClient();

  const keys = [
    "store_name",
    "store_address",
    "store_phone",
    "store_email",
    "tax_rate",
    "currency",
    "receipt_footer",
  ];

  for (const key of keys) {
    let value = String(formData.get(key) || "").trim();
    if (key === "tax_rate") {
      const n = Number(value);
      value = String(Math.min(100, Math.max(0, isNaN(n) ? 0 : n)));
    }
    if (key === "store_name" && !value) {
      redirect("/settings?err=name");
    }
    const { error } = await supabase.from("settings").upsert({ key, value }, { onConflict: "key" });
    if (error) redirect("/settings?err=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?ok=saved");
}