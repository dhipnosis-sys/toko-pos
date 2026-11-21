"use client";

import { OfflineBanner } from "./OfflineBanner";
import { InstallPrompt } from "./InstallPrompt";
import { RegisterSW } from "./RegisterSW";

/**
 * Komponen root untuk PWA: didaftarkan di layout.tsx.
 * Berjalan di semua halaman (termasuk /login) sehingga service worker
 * dan instalasi tetap tersedia sebelum pengguna masuk.
 */
export function PwaShell() {
  return (
    <>
      <RegisterSW />
      <OfflineBanner />
      <InstallPrompt />
    </>
  );
}
