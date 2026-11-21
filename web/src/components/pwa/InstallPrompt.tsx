"use client";

import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "toko-install-dismissed";
const DISMISS_MS = 1000 * 60 * 60 * 24 * 14; // 2 minggu

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const display = window.matchMedia?.("(display-mode: standalone)").matches;
  const ios = (window.navigator as unknown as { standalone?: boolean }).standalone;
  return Boolean(display || ios);
}

/**
 * Prompt "Install Aplikasi".
 * Muncul otomatis saat Chrome/Android siap memasang (beforeinstallprompt),
 * dan hilang sendiri setelah aplikasi terpasang atau pengguna menutup.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      return;
    }

    try {
      const at = Number(sessionStorage.getItem(DISMISS_KEY) || 0);
      if (at && Date.now() - at < DISMISS_MS) setDismissed(true);
    } catch {
      /* storage tidak tersedia */
    }

    function onBeforeInstall(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!deferred) return;
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") setInstalled(true);
    } catch {
      /* pengguna membatalkan */
    }
    setDeferred(null);
  }

  function dismiss() {
    try {
      sessionStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* abaikan */
    }
    setDismissed(true);
  }

  if (installed || dismissed || !deferred) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-[60] w-[calc(100%-2rem)] max-w-sm">
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-white px-4 py-3 shadow-lg">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">
            Pasang Warung Nuhahade
          </p>
          <p className="text-xs text-slate-500">
            Tambahkan ke layar utama agar terbuka seperti aplikasi.
          </p>
        </div>
        <button
          type="button"
          onClick={install}
          className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 transition"
        >
          Pasang
        </button>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Tutup"
          className="shrink-0 text-slate-400 hover:text-slate-600"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
