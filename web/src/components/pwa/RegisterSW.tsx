"use client";

import { useEffect, useState } from "react";

/**
 * Mendaftarkan service worker dan menampilkan toast saat versi baru tersedia.
 * Dipasang sekali di root layout sehingga berlaku untuk semua halaman.
 */
export function RegisterSW() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let reg: ServiceWorkerRegistration | undefined;
    let disposed = false;

    async function register() {
      try {
        reg = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });
      } catch (err) {
        console.warn("Pendaftaran service worker gagal:", err);
        return;
      }
      if (disposed || !reg) return;

      // Sudah ada worker menunggu (update dari sesi sebelumnya)
      if (reg.waiting && navigator.serviceWorker.controller) {
        setWaiting(reg.waiting);
        setShowUpdate(true);
      }

      reg.addEventListener("updatefound", () => {
        const installing = reg?.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed" && navigator.serviceWorker.controller) {
            setWaiting(installing);
            setShowUpdate(true);
          }
        });
      });
    }

    register();

    // Cek update setiap kali tab kembali terlihat
    function onVisibility() {
      if (document.visibilityState === "visible") reg?.update().catch(() => undefined);
    }
    document.addEventListener("visibilitychange", onVisibility);

    // Reload hanya sekali ketika worker baru mengambil alih kontrol
    let reloading = false;
    function onControllerChange() {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    }
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibility);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, []);

  function applyUpdate() {
    waiting?.postMessage({ type: "SKIP_WAITING" });
    setShowUpdate(false);
  }

  if (!showUpdate) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-6 z-[60] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">Update tersedia</p>
          <p className="text-xs text-slate-500">
            Versi baru aplikasi sudah diunduh.
          </p>
        </div>
        <button
          type="button"
          onClick={applyUpdate}
          className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
        >
          Muat ulang
        </button>
        <button
          type="button"
          onClick={() => setShowUpdate(false)}
          aria-label="Tutup"
          className="shrink-0 text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
