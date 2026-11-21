"use server";

import { getCurrentUser } from "@/lib/dal";
import { createClient } from "@/lib/supabase/server";
import { notifyUser } from "@/lib/notifications";

export type PushSubscriptionInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent?: string;
};

export type PushActionResult = {
  ok: boolean;
  sent?: number;
  error?: string | null;
};

/** Simpan / perbarui langganan push milik pengguna yang sedang masuk. */
export async function saveSubscription(
  input: PushSubscriptionInput
): Promise<PushActionResult> {
  try {
    const profile = await getCurrentUser();

    const endpoint = String(input?.endpoint || "").trim();
    const p256dh = String(input?.p256dh || "").trim();
    const auth = String(input?.auth || "").trim();
    if (!endpoint || !p256dh || !auth) {
      return { ok: false, error: "Data langganan tidak valid." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("push_subscriptions").upsert(
      {
        user_id: profile.id,
        endpoint,
        p256dh,
        auth,
        user_agent: String(input?.userAgent || "").slice(0, 300) || null,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  } catch (err) {
    // redirect() dari getCurrentUser melempar NEXT_REDIRECT — biarkan lewat.
    if (isRedirectError(err)) throw err;
    return { ok: false, error: gagalPesan(err) };
  }
}

/** Hapus langganan (mis. saat pengguna mematikan notifikasi). */
export async function removeSubscription(
  endpoint: string
): Promise<PushActionResult> {
  try {
    await getCurrentUser();
    const supabase = await createClient();
    const { error } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", String(endpoint || ""));
    if (error) return { ok: false, error: error.message };
    return { ok: true, error: null };
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { ok: false, error: gagalPesan(err) };
  }
}

/** Kirim satu notifikasi uji ke perangkat milik pengguna ini. */
export async function sendTestNotification(): Promise<PushActionResult> {
  try {
    const profile = await getCurrentUser();

    const supabase = await createClient();
    const { count } = await supabase
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id);

    if (!count) {
      return {
        ok: false,
        sent: 0,
        error: "Belum ada perangkat yang mendaftar notifikasi.",
      };
    }

    const sent = await notifyUser(profile.id, {
      title: "Notifikasi aktif ✓",
      body: `Halo ${profile.name}, push notification Toko Nuhahade sudah terpasang di perangkat ini.`,
      url: "/settings",
    });

    return sent > 0
      ? { ok: true, sent, error: null }
      : {
          ok: false,
          sent: 0,
          error:
            "Gagal mengirim. Pastikan VAPID sudah diisi di environment Vercel.",
        };
  } catch (err) {
    if (isRedirectError(err)) throw err;
    return { ok: false, sent: 0, error: gagalPesan(err) };
  }
}

function isRedirectError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    String((err as { digest?: string }).digest || "").startsWith("NEXT_REDIRECT")
  );
}

function gagalPesan(err: unknown): string {
  console.warn("[push] aksi gagal:", err);
  return "Terjadi kesalahan. Coba lagi.";
}
