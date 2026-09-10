import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.is_active) redirect("/login");
  return profile as Profile;
});

export async function requireRole(roles: Role | Role[]): Promise<Profile> {
  const profile = await getCurrentUser();
  const allowed = Array.isArray(roles) ? roles : [roles];
  if (!allowed.includes(profile.role)) redirect("/dashboard");
  return profile;
}

export async function canEditProduct(profile: Profile): Promise<boolean> {
  return profile.role === "owner" || profile.role === "warehouse";
}