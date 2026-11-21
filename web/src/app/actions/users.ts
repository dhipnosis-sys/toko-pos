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

// Password default untuk fitur "Reset Password" di menu Pengguna.
// Bisa di-override lewat env DEFAULT_RESET_PASSWORD tanpa ganti kode.
const DEFAULT_RESET_PASSWORD =
  process.env.DEFAULT_RESET_PASSWORD?.trim() || "nuhade2026";

export async function resetUserPassword(id: string): Promise<void> {
  await requireRole("owner");
  const current = await getCurrentUser();
  if (id === current.id) redirect("/users?err=selfreset");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, {
    password: DEFAULT_RESET_PASSWORD,
  });
  if (error) redirect("/users?err=" + encodeURIComponent(error.message));

  revalidatePath("/users");
  redirect("/users?ok=password-reset");
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

export async function changeOwnPassword(formData: FormData): Promise<void> {
  const profile = await getCurrentUser();
  const supabase = await createClient();

  const currentPassword = String(formData.get("current_password") || "");
  const newPassword = String(formData.get("new_password") || "");
  const confirmPassword = String(formData.get("confirm_password") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    redirect("/profile?err=required");
  }
  if (newPassword.length < 6) {
    redirect("/profile?err=weak");
  }
  if (newPassword !== confirmPassword) {
    redirect("/profile?err=mismatch");
  }

  // Verifikasi password lama dengan mencoba sign-in ulang
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  });
  if (signInError) redirect("/profile?err=current");

  // Set password baru lewat admin client (tidak butuh token recovery)
  const admin = createAdminClient();
  const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, {
    password: newPassword,
  });
  if (updateError) redirect("/profile?err=" + encodeURIComponent(updateError.message));

  revalidatePath("/profile");
  redirect("/profile?ok=password-changed");
}