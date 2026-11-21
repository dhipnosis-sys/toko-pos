"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";
import {
  saveSubscription,
  removeSubscription,
  sendTestNotification,
} from "@/app/actions/push";
import { getVapidPublicKey, urlBase64ToUint8Array } from "@/lib/vapid";

function browserSupported(): boolean {
  if (typeof window === "undefined") return false;
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

async function getSubscription(): Promise<PushSubscription | null> {
  if (!browserSupported()) return null;
  try {
    const reg = await navigator.serviceWorker.ready;
    return await reg.pushManager.getSubscription();
  } catch {
    return null;
  }
}

/**
 * Kontrol push notification.
 * `variant="sidebar"`  → tombol ringkas di footer sidebar.
 * `variant="settings"` → kartu lengkap + tombol kirim uji.
 */
export function PushOptIn({
  variant = "sidebar",
}: {
  variant?: "sidebar" | "settings";
}) {
  const [ready, setReady] = useState(false);
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setSupported(browserSupported());
    const sub = await getSubscription();
    setActive(Boolean(sub));
    setReady(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function enable() {
    const vapidPublicKey = getVapidPublicKey();
    if (!vapidPublicKey) {
      setMessage("Kunci VAPID belum diatur di server.");
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("Izin notifikasi ditolak oleh browser.");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const json = sub.toJSON();
      const res = await saveSubscription({
        endpoint: json.endpoint || "",
        p256dh: json.keys?.p256dh || "",
        auth: json.keys?.auth || "",
        userAgent: navigator.userAgent,
      });

      if (!res.ok) {
        setMessage(res.error || "Gagal menyimpan langganan.");
        await sub.unsubscribe().catch(() => undefined);
        return;
      }

      setActive(true);
      setMessage("Notifikasi aktif di perangkat ini.");
    } catch (err) {
      console.warn("Gagal mengaktifkan notifikasi:", err);
      setMessage("Gagal mengaktifkan notifikasi. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const sub = await getSubscription();
      if (sub) {
        await removeSubscription(sub.endpoint);
        await sub.unsubscribe().catch(() => undefined);
      }
      setActive(false);
      setMessage("Notifikasi dimatikan.");
    } catch (err) {
      console.warn("Gagal mematikan notifikasi:", err);
      setMessage("Gagal mematikan notifikasi.");
    } finally {
      setBusy(false);
    }
  }

  async function runTest() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await sendTestNotification();
      setMessage(
        res.ok
          ? "Notifikasi uji terkirim ke perangkat ini."
          : res.error || "Gagal mengirim notifikasi uji."
      );
    } catch (err) {
      console.warn("Notifikasi uji gagal:", err);
      setMessage("Gagal mengirim notifikasi uji.");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return null;

  /* ------------------------------------------------------------ settings */
  if (variant === "settings") {
    if (!supported) {
      return (
        <p className="text-sm text-slate-500">
          Browser/perangkat ini tidak mendukung push notification.
        </p>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={active ? disable : enable}
            disabled={busy}
            className={
              active
                ? "inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
                : "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition disabled:opacity-50"
            }
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : active ? (
              <BellOff className="w-4 h-4" />
            ) : (
              <Bell className="w-4 h-4" />
            )}
            {active ? "Matikan Notifikasi" : "Aktifkan Notifikasi"}
          </button>

          {active && (
            <button
              type="button"
              onClick={runTest}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition disabled:opacity-50"
            >
              Kirim Notifikasi Uji
            </button>
          )}
        </div>

        {message && <p className="text-sm text-slate-600">{message}</p>}
      </div>
    );
  }

  /* ------------------------------------------------------------- sidebar */
  if (!supported) return null;

  return (
    <div className="px-3 pb-3">
      <button
        type="button"
        onClick={active ? disable : enable}
        disabled={busy}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
          active
            ? "bg-white/10 text-emerald-50 hover:bg-white/15"
            : "bg-white/10 text-emerald-50 hover:bg-white/15"
        }`}
        title={active ? "Matikan notifikasi" : "Aktifkan notifikasi"}
      >
        {busy ? (
          <Loader2 className="w-5 h-5 shrink-0 animate-spin" />
        ) : active ? (
          <Bell className="w-5 h-5 shrink-0" />
        ) : (
          <BellOff className="w-5 h-5 shrink-0" />
        )}
        <span className="truncate">
          {active ? "Notifikasi aktif" : "Aktifkan Notifikasi"}
        </span>
      </button>
    </div>
  );
}
