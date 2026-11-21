import { sendNotification, setVapidDetails } from "web-push";
import type { Role } from "@/lib/types";
import { createAdminClient } from "@/lib/supabase/admin";
import { getVapidKeys, getVapidSubject } from "@/lib/vapid-server";

/**
 * Pengirim push notification (server only).
 * Semua fungsi di sini dirancang tidak pernah melempar error ke pemanggil —
 * kegagalan notifikasi tidak boleh membatalkan transaksi.
 *
 * HANYA impor dari server component / server action / route handler.
 */

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type SubscriptionRow = {
  id: number;
  endpoint: string;
  p256dh: string;
  auth: string;
};

let configured = false;
let warnedMissingKeys = false;

function ensureConfigured(): boolean {
  const keys = getVapidKeys();
  if (!keys) {
    if (!warnedMissingKeys) {
      warnedMissingKeys = true;
      console.warn(
        "[push] VAPID belum dikonfigurasi (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY). Notifikasi dinonaktifkan."
      );
    }
    return false;
  }
  if (!configured) {
    try {
      setVapidDetails(getVapidSubject(), keys.publicKey, keys.privateKey);
      configured = true;
    } catch (err) {
      console.warn("[push] VAPID tidak valid:", err);
      return false;
    }
  }
  return true;
}

async function sendToSubscription(sub: SubscriptionRow, payload: PushPayload) {
  await sendNotification(
    {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    },
    JSON.stringify(payload),
    { TTL: 4 * 60 * 60 } // 4 jam: notifikasi basi tidak perlu dikirim lagi
  );
}

/** Membersihkan langganan yang sudah expired (404/410) dan mencatat last_used_at. */
async function afterSend(
  admin: ReturnType<typeof createAdminClient>,
  sub: SubscriptionRow,
  err: unknown
) {
  const status = (err as { statusCode?: number })?.statusCode;
  if (status === 404 || status === 410) {
    await admin.from("push_subscriptions").delete().eq("id", sub.id);
    return;
  }
  if (status) {
    console.warn(`[push] gagal (${status}) ke ${sub.endpoint.slice(0, 40)}…`);
    return;
  }
  await admin
    .from("push_subscriptions")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", sub.id);
}

/** Kirim ke semua perangkat milik pengguna tertentu. Mengembalikan jumlah terkirim. */
export async function notifyUser(
  userId: string,
  payload: PushPayload
): Promise<number> {
  if (!ensureConfigured()) return 0;
  try {
    const admin = createAdminClient();
    const { data: subs, error } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .eq("user_id", userId);
    if (error || !subs?.length) return 0;

    let sent = 0;
    await Promise.all(
      (subs as SubscriptionRow[]).map(async (sub) => {
        try {
          await sendToSubscription(sub, payload);
          sent++;
        } catch (err) {
          await afterSend(admin, sub, err);
        }
      })
    );
    return sent;
  } catch (err) {
    console.warn("[push] notifyUser gagal:", err);
    return 0;
  }
}

/** Kirim ke semua pengguna dengan peran tertentu. */
export async function notifyRoles(
  roles: Role[],
  payload: PushPayload
): Promise<number> {
  if (!ensureConfigured()) return 0;
  try {
    const admin = createAdminClient();

    const { data: profiles, error: pErr } = await admin
      .from("profiles")
      .select("id")
      .in("role", roles);
    if (pErr || !profiles?.length) return 0;
    const userIds = profiles.map((p) => p.id);

    const { data: subs, error: sErr } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth")
      .in("user_id", userIds);
    if (sErr || !subs?.length) return 0;

    let sent = 0;
    await Promise.all(
      (subs as SubscriptionRow[]).map(async (sub) => {
        try {
          await sendToSubscription(sub, payload);
          sent++;
        } catch (err) {
          await afterSend(admin, sub, err);
        }
      })
    );
    return sent;
  } catch (err) {
    console.warn("[push] notifyRoles gagal:", err);
    return 0;
  }
}

/**
 * Kirim maksimal sekali per `kind` + `refKey`.
 * Dipakai untuk pemicu berbasis jadwal (mis. piutang jatuh tempo per hari).
 */
export async function notifyOnce(
  kind: string,
  refKey: string,
  roles: Role[],
  payload: PushPayload
): Promise<boolean> {
  if (!ensureConfigured()) return false;
  try {
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("push_sent_log")
      .select("id")
      .eq("kind", kind)
      .eq("ref_key", refKey)
      .maybeSingle();
    if (existing) return false;

    const sent = await notifyRoles(roles, payload);
    if (sent === 0) {
      // Tidak ada yang menerima → jangan ditandai, biar bisa dicoba lagi.
      return false;
    }

    await admin
      .from("push_sent_log")
      .upsert({ kind, ref_key: refKey }, { onConflict: "kind,ref_key", ignoreDuplicates: true });
    return true;
  } catch (err) {
    console.warn("[push] notifyOnce gagal:", err);
    return false;
  }
}

/** Baca nilai setting (key/value) dengan fallback. */
export async function getSetting(
  key: string,
  fallback = ""
): Promise<string> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();
    return data?.value ?? fallback;
  } catch {
    return fallback;
  }
}

/** Apakah jenis notifikasi ini aktif? (default: aktif) */
export async function isNotifyEnabled(key: string): Promise<boolean> {
  const value = await getSetting(key, "1");
  return value !== "0" && value !== "false" && value !== "";
}
