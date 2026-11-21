"use client";

import { useOffline } from "next/offline";

/**
 * Banner bawaan saat koneksi terputus.
 * Membutuhkan `experimental.useOffline: true` di next.config.ts.
 */
export function OfflineBanner() {
  const isOffline = useOffline();

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="fixed left-0 right-0 top-0 z-[70] bg-amber-500 text-white text-center text-xs sm:text-sm font-medium py-1.5 px-4 shadow"
    >
      Offline — permintaan akan diulang otomatis saat kembali online.
    </div>
  );
}
