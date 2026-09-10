"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, requireRole } from "@/lib/dal";
import type { Role } from "@/lib/types";

export async function createUser(formData: FormData) {
  await requireRole("owner");

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const role = String(formData.get("role") || "cashier") as Role;
  const phone = String(formData.get("phone") || "").trim() || null;
  const isActive = formData.get("is_active") === "on";

  if (!name || !email || password.length < 6) redirect("/users/create?err=required");
  if (!["owner", "cashier", "warehouse"].includes(role)) redirect("/users/create?err=role");

  const admin = createAdminClient();
  const { data: authUser, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (error) redirect("/users/create?err=" + encodeURIComponent(error.message));

  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ name, role, phone, is_active: isActive })
    .eq("id", authUser.user!.id);
  if (profileError) redirect("/users/create?err=" + encodeURIComponent(profileError.message));

  revalidatePath("/users");
  redirect("/users?ok=saved");
}

export async function updateUser(id: string, formData: FormData) {
  await requireRole("owner");
  if (id === (await getCurrentUser()).id) {
    redirect("/users/" + id + "/edit?err=role");
  }

  const name = String(formData.get("name") || "").trim();
  const role = String(formData.get("role") || "cashier") as Role;
  const phone = String(formData.get("phone") || "").trim() || null;
  const isActive = formData.get("is_active") === "on";
  const password = String(formData.get("password") || "");

  if (!name || !["owner", "cashier", "warehouse"].includes(role)) redirect("/users/" + id + "/edit?err=required");

  const admin = createAdminClient();

  if (role === "owner") {
    // Only one owner allowed
    const supabase = await createClient();
    const { count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "owner")
      .neq("id", id);
    if (count && count > 0) redirect("/users/" + id + "/edit?err=role");
  }

  if (password) {
    const { error: pwError } = await admin.auth.admin.updateUserById(id, { password });
    if (pwError) redirect("/users/" + id + "/edit?err=" + encodeURIComponent(pwError.message));
  }

  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ name, role, phone, is_active: isActive })
    .eq("id", id);
  if (profileError) redirect("/users/" + id + "/edit?err=" + encodeURIComponent(profileError.message));

  revalidatePath("/users");
  revalidatePath("/users/" + id);
  redirect("/users?ok=updated");
}

export async function deleteUser(id: string) {
  await requireRole("owner");
  const current = await getCurrentUser();
  if (id === current.id) redirect("/users?err=self");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) redirect("/users?err=" + encodeURIComponent(error.message));
  revalidatePath("/users");
  redirect("/users?ok=deleted");
}

export async function updateOwnProfile(formData: FormData) {
  const profile = await getCurrentUser();
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  if (!name) redirect("/profile?err=name");

  const { error } = await supabase.from("profiles").update({ name, phone }).eq("id", profile.id);
  if (error) redirect("/profile?err=" + encodeURIComponent(error.message));
  revalidatePath("/profile");
  redirect("/profile?ok=saved");
}