"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/dal";
import { slugify } from "@/lib/utils";

export async function createCategory(formData: FormData) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;

  if (!name) redirect("/categories?err=name");
  const { error } = await supabase
    .from("categories")
    .insert({ name, slug: slugify(name), description });

  if (error) redirect("/categories?err=" + encodeURIComponent(error.message));
  revalidatePath("/categories");
  redirect("/categories?ok=saved");
}

export async function updateCategory(id: number, formData: FormData) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim() || null;

  if (!name) redirect("/categories/" + id + "/edit?err=name");

  const { error } = await supabase
    .from("categories")
    .update({ name, slug: slugify(name), description })
    .eq("id", id);

  if (error) redirect("/categories/" + id + "/edit?err=" + encodeURIComponent(error.message));
  revalidatePath("/categories");
  revalidatePath("/categories/" + id + "/edit");
  redirect("/categories?ok=updated");
}

export async function deleteCategory(id: number) {
  await requireRole(["owner", "warehouse"]);
  const supabase = await createClient();

  const { count } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (count && count > 0) {
    redirect("/categories?err=inuse");
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) redirect("/categories?err=" + encodeURIComponent(error.message));
  revalidatePath("/categories");
  redirect("/categories?ok=deleted");
}